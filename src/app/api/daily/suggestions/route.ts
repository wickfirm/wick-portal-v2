import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/daily/suggestions?date=YYYY-MM-DD&userId=xxx
// Generate smart task suggestions for a specific date
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
    const targetDate = new Date(date);
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get tasks already planned for this date
    const existingDailyTasks = await prisma.dailyTask.findMany({
      where: {
        userId,
        date: targetDate,
      },
      select: { taskId: true },
    });

    const existingTaskIds = existingDailyTasks.map(dt => dt.taskId);

    // 1. Get incomplete tasks from yesterday (ROLLOVER)
    const rolledOverTasks = await prisma.dailyTask.findMany({
      where: {
        userId,
        date: yesterday,
        completedAt: null,
        taskId: { notIn: existingTaskIds },
      },
      include: {
        task: {
          include: {
            project: { select: { id: true, name: true, isDefault: true } },
            client: { select: { id: true, name: true } },
            category: { select: { id: true, name: true} },
          },
        },
      },
      take: 5,
    });

    // 2. Get tasks due on target date
    const dueTasks = await prisma.clientTask.findMany({
      where: {
        assignedToId: userId,
        dueDate: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: { not: "COMPLETED" },
        id: { notIn: existingTaskIds },
      },
      include: {
        project: { select: { id: true, name: true, isDefault: true } },
        client: { select: { id: true, name: true } },
        category: { select: { id: true, name: true} },
      },
      take: 5,
    });

    // 3. Get high priority tasks from active projects
    const highPriorityTasks = await prisma.clientTask.findMany({
      where: {
        assignedToId: userId,
        priority: "HIGH",
        status: { in: ["TODO", "IN_PROGRESS"] },
        id: { notIn: [...existingTaskIds, ...dueTasks.map(t => t.id)] },
        project: {
          status: { in: ["IN_PROGRESS", "ACTIVE"] },
        },
      },
      include: {
        project: { select: { id: true, name: true, isDefault: true } },
        client: { select: { id: true, name: true } },
        category: { select: { id: true, name: true} },
      },
      take: 3,
    });

    // 4. Get next tasks from active projects (project sequence)
    const projectTasks = await prisma.clientTask.findMany({
      where: {
        assignedToId: userId,
        status: { in: ["TODO", "IN_PROGRESS"] },
        id: { 
          notIn: [
            ...existingTaskIds, 
            ...dueTasks.map(t => t.id),
            ...highPriorityTasks.map(t => t.id)
          ] 
        },
        project: {
          status: { in: ["IN_PROGRESS", "ACTIVE"] },
        },
      },
      include: {
        project: { select: { id: true, name: true, isDefault: true } },
        client: { select: { id: true, name: true } },
        category: { select: { id: true, name: true} },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      take: 4,
    });

    // Calculate priority scores
    const suggestions = [
      ...rolledOverTasks.map(dt => ({
        task: dt.task,
        source: "rollover" as const,
        score: 140, // High score for rolled over tasks
        reason: "Incomplete from yesterday",
      })),
      ...dueTasks.map(task => ({
        task,
        source: "due_date" as const,
        score: 100, // Very high for due today
        reason: "Due today",
      })),
      ...highPriorityTasks.map(task => ({
        task,
        source: "priority" as const,
        score: 50, // High priority tasks
        reason: "High priority task",
      })),
      ...projectTasks.map(task => ({
        task,
        source: "project_sequence" as const,
        score: 20, // Next in project
        reason: "Next task in active project",
      })),
    ];

    // Sort by score and take top 10
    const topSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json(topSuggestions);
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}

// POST /api/daily/suggestions/accept
// Accept all suggestions for a date
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const data = await req.json();
    const { date, taskIds, sources } = data;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Create daily tasks for all accepted suggestions
    const dailyTasks = await Promise.all(
      taskIds.map((taskId: string, index: number) =>
        prisma.dailyTask.create({
          data: {
            taskId,
            userId,
            date: targetDate,
            source: sources[index] || "system",
            suggested: true,
            accepted: true,
            suggestedBy: "system",
          },
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      count: dailyTasks.length,
      tasks: dailyTasks,
    });
  } catch (error) {
    console.error("Failed to accept suggestions:", error);
    return NextResponse.json({ error: "Failed to accept suggestions" }, { status: 500 });
  }
}
