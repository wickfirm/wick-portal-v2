import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification, createBulkNotifications } from "@/lib/notifications";

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
        dueDate: true,
      },
    });

    const updateData: any = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) {
      updateData.category = data.categoryId
        ? { connect: { id: data.categoryId } }
        : { disconnect: true };
    }
    if (data.projectId !== undefined) {
      updateData.project = data.projectId
        ? { connect: { id: data.projectId } }
        : { disconnect: true };
    }
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
    if (data.assigneeId !== undefined) {
      updateData.assignee = data.assigneeId
        ? { connect: { id: data.assigneeId } }
        : { disconnect: true };
    }
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

    // 4. WATCHER NOTIFICATIONS — notify watchers (excluding the person making the change)
    try {
      const watchers = await prisma.taskWatcher.findMany({
        where: { taskId: params.id, userId: { not: (session.user as any).id } },
        select: { userId: true },
      });
      const watcherIds = watchers.map((w) => w.userId);

      if (watcherIds.length > 0) {
        // Status change
        if (data.status !== undefined && data.status !== oldTask?.status) {
          await createBulkNotifications(watcherIds, {
            type: "TASK_STATUS_CHANGED",
            category: "TASK",
            priority: "NORMAL",
            title: "Watched Task Updated",
            message: `"${task.name}" status changed to ${data.status.replace(/_/g, " ")}`,
            link: `/tasks?taskId=${task.id}`,
            metadata: { taskId: task.id, changeType: "status" },
          });
        }

        // Priority change
        if (data.priority !== undefined && data.priority !== oldTask?.priority) {
          await createBulkNotifications(watcherIds, {
            type: "TASK_STATUS_CHANGED",
            category: "TASK",
            priority: data.priority === "URGENT" ? "HIGH" : "NORMAL",
            title: "Watched Task Priority Changed",
            message: `"${task.name}" priority changed to ${data.priority}`,
            link: `/tasks?taskId=${task.id}`,
            metadata: { taskId: task.id, changeType: "priority" },
          });
        }

        // Due date change
        if (data.dueDate !== undefined) {
          const oldDue = oldTask?.dueDate ? new Date(oldTask.dueDate).toISOString().split("T")[0] : null;
          const newDue = data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : null;
          if (oldDue !== newDue) {
            await createBulkNotifications(watcherIds, {
              type: "TASK_STATUS_CHANGED",
              category: "TASK",
              priority: "NORMAL",
              title: "Watched Task Due Date Changed",
              message: `"${task.name}" due date was updated`,
              link: `/tasks?taskId=${task.id}`,
              metadata: { taskId: task.id, changeType: "dueDate" },
            });
          }
        }

        // Completion
        if (data.status === "COMPLETED" && oldTask?.status !== "COMPLETED") {
          await createBulkNotifications(watcherIds, {
            type: "TASK_COMPLETED",
            category: "TASK",
            priority: "NORMAL",
            title: "Watched Task Completed",
            message: `"${task.name}" was marked as completed`,
            link: `/tasks?taskId=${task.id}`,
            metadata: { taskId: task.id },
          });
        }
      }
    } catch (watcherError) {
      console.error("Error notifying watchers:", watcherError);
      // Don't fail the update if watcher notifications fail
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
