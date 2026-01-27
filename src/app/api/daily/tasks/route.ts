import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/daily/tasks?date=YYYY-MM-DD&userId=xxx
// Get all tasks for a user on a specific date
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const userId = searchParams.get("userId") || (session.user as any).id;
  const userRole = (session.user as any).role;

  // Only allow viewing own data unless admin/super_admin
  if (userId !== (session.user as any).id && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        userId,
        date: new Date(date),
      },
      include: {
        task: {
          include: {
            project: {
              select: { id: true, name: true, isDefault: true },
            },
            client: {
              select: { id: true, name: true },
            },
            category: {
              select: { id: true, name: true },
            },
            assignee: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [
        { task: { priority: "desc" } },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(dailyTasks);
  } catch (error) {
    console.error("Failed to fetch daily tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/daily/tasks
// Add task to daily plan
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  try {
    const data = await req.json();
    const { taskId, date, source, targetUserId } = data;

    // Determine if this is a manager adding task for team member
    const isManagerOverride = targetUserId && targetUserId !== userId;
    
    if (isManagerOverride && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const finalUserId = targetUserId || userId;
    const taskDate = date ? new Date(date) : new Date();
    taskDate.setHours(0, 0, 0, 0);

    const dailyTask = await prisma.dailyTask.create({
      data: {
        taskId,
        userId: finalUserId,
        date: taskDate,
        source: source || "manual",
        suggestedBy: isManagerOverride ? userId : "system",
        suggested: source === "system",
        accepted: true,
      },
    });

    // Log modification if manager override
    if (isManagerOverride) {
      await prisma.taskModification.create({
        data: {
          taskId,
          modifiedBy: userId,
          changeType: "manager_override",
          newValue: `Added to ${finalUserId}'s daily plan for ${taskDate.toISOString().split("T")[0]}`,
          notes: "Manager added task to team member's plan",
        },
      });
    }

    return NextResponse.json(dailyTask);
  } catch (error) {
    console.error("Failed to add daily task:", error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}

// DELETE /api/daily/tasks/[id]
// Remove task from daily plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  try {
    const dailyTask = await prisma.dailyTask.findUnique({
      where: { id: params.id },
    });

    if (!dailyTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Can only delete own tasks unless admin
    if (dailyTask.userId !== userId && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.dailyTask.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete daily task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
