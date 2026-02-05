import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createBulkNotifications } from "@/lib/notifications";

// GET - Fetch comments for a task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: params.id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
            attachments: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      where: { taskId: params.id, parentId: null }, // Only top-level comments
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as any;
    const { content, parentId, mentions } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await prisma.clientTask.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, assigneeId: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Create the comment
    const comment = await prisma.taskComment.create({
      data: {
        taskId: params.id,
        authorId: user.id,
        content: content.trim(),
        parentId: parentId || null,
        mentions: mentions || [],
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
      },
    });

    // Log activity
    await prisma.taskModification.create({
      data: {
        taskId: params.id,
        modifiedBy: user.id,
        changeType: "comment_added",
        newValue: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      },
    });

    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      const mentionedUsers = mentions.filter((id: string) => id !== user.id);
      if (mentionedUsers.length > 0) {
        await createBulkNotifications(mentionedUsers, {
          type: "TASK_MENTIONED",
          category: "TASK",
          priority: "NORMAL",
          title: "You were mentioned",
          message: `${user.name} mentioned you in a comment on "${task.name}"`,
          link: `/tasks/${params.id}`,
          metadata: { taskId: params.id, commentId: comment.id },
        });
      }
    }

    // Notify task assignee if they're not the commenter
    if (task.assigneeId && task.assigneeId !== user.id && !mentions?.includes(task.assigneeId)) {
      await createBulkNotifications([task.assigneeId], {
        type: "TASK_COMMENT",
        category: "TASK",
        priority: "NORMAL",
        title: "New comment on your task",
        message: `${user.name} commented on "${task.name}"`,
        link: `/tasks/${params.id}`,
        metadata: { taskId: params.id, commentId: comment.id },
      });
    }

    // Notify watchers
    const watchers = await prisma.taskWatcher.findMany({
      where: {
        taskId: params.id,
        userId: { notIn: [user.id, ...(mentions || []), task.assigneeId].filter(Boolean) as string[] }
      },
      select: { userId: true },
    });

    if (watchers.length > 0) {
      await createBulkNotifications(watchers.map(w => w.userId), {
        type: "TASK_COMMENT",
        category: "TASK",
        priority: "NORMAL",
        title: "New comment on watched task",
        message: `${user.name} commented on "${task.name}"`,
        link: `/tasks/${params.id}`,
        metadata: { taskId: params.id, commentId: comment.id },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
