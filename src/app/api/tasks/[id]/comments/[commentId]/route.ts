import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT - Update a comment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as any;
    const { content } = await req.json();

    // Verify comment exists and belongs to user
    const existingComment = await prisma.taskComment.findUnique({
      where: { id: params.commentId },
    });

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only author can edit their comment (or admins)
    if (existingComment.authorId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Not authorized to edit this comment" }, { status: 403 });
    }

    const comment = await prisma.taskComment.update({
      where: { id: params.commentId },
      data: {
        content: content.trim(),
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as any;

    // Verify comment exists
    const existingComment = await prisma.taskComment.findUnique({
      where: { id: params.commentId },
    });

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only author can delete their comment (or admins)
    if (existingComment.authorId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 });
    }

    // Delete comment (cascades to attachments due to schema)
    await prisma.taskComment.delete({
      where: { id: params.commentId },
    });

    // Log activity
    await prisma.taskModification.create({
      data: {
        taskId: params.id,
        modifiedBy: user.id,
        changeType: "comment_deleted",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
