import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    // Get old task data for comparison
    const oldTask = await prisma.clientTask.findUnique({
      where: { id: params.id },
      select: {
        assigneeId: true,
        status: true,
        priority: true,
        name: true,
      },
    });

    const updateData: any = { updatedAt: new Date() };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.projectId !== undefined) updateData.projectId = data.projectId || null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.nextSteps !== undefined) updateData.nextSteps = data.nextSteps;
    if (data.externalLink !== undefined) updateData.externalLink = data.externalLink;
    if (data.externalLinkLabel !== undefined) updateData.externalLinkLabel = data.externalLinkLabel;
    if (data.internalLink !== undefined) updateData.internalLink = data.internalLink;
    if (data.internalLinkLabel !== undefined) updateData.internalLinkLabel = data.internalLinkLabel;
    if (data.ownerType !== undefined) updateData.ownerType = data.ownerType;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null;
    if (data.order !== undefined) updateData.order = data.order;

    const task = await prisma.clientTask.update({
      where: { id: params.id },
      data: updateData,
      include: { 
        category: true,
        assignee: { select: { id: true, name: true, email: true } },
        client: { 
          select: { 
            id: true,
            nickname: true, 
            name: true, 
            agencies: { include: { agency: true } } 
          } 
        },
      },
    });

    // NOTIFICATION TRIGGERS
    
    // 1. Task Assignment Notification
    if (data.assigneeId !== undefined && data.assigneeId !== oldTask?.assigneeId && data.assigneeId) {
      await createNotification({
        userId: data.assigneeId,
        type: "TASK_ASSIGNED",
        category: "TASK",
        priority: task.priority === "URGENT" ? "URGENT" : "NORMAL",
        title: "New Task Assigned",
        message: `You've been assigned: "${task.name}"`,
        link: `/tasks?taskId=${task.id}`,
        metadata: { taskId: task.id, taskName: task.name },
      });
    }

    // 2. Status Change to Completed Notification
    if (data.status === "COMPLETED" && oldTask?.status !== "COMPLETED") {
      // Notify assignee
      if (task.assigneeId && task.assigneeId !== session.user.id) {
        await createNotification({
          userId: task.assigneeId,
          type: "TASK_COMPLETED",
          category: "TASK",
          priority: "NORMAL",
          title: "Task Marked Complete",
          message: `"${task.name}" was marked as completed`,
          link: `/tasks?taskId=${task.id}`,
          metadata: { taskId: task.id, completedBy: session.user.id },
        });
      }
    }

    // 3. Priority Change to URGENT Notification
    if (data.priority === "URGENT" && oldTask?.priority !== "URGENT" && task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        type: "TASK_STATUS_CHANGED",
        category: "TASK",
        priority: "URGENT",
        title: "Task Marked Urgent",
        message: `"${task.name}" priority changed to URGENT`,
        link: `/tasks?taskId=${task.id}`,
        metadata: { taskId: task.id, changedBy: session.user.id },
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.clientTask.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
