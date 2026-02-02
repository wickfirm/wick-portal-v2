/**
 * Client Calendar API
 * GET: Returns calendar events scoped to a specific client
 * Aggregates: tasks (with due dates), project timelines, time entries
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface CalendarEvent {
  id: string;
  type: "task" | "timeEntry" | "project";
  title: string;
  date: string;
  endDate?: string;
  color: string;
  metadata: Record<string, any>;
}

const EVENT_COLORS = {
  task: "#76527c",
  timeEntry: "#4285f4",
  project: "#34a853",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = params.id;
  const { searchParams } = new URL(req.url);

  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  if (!startStr || !endStr) {
    return NextResponse.json(
      { error: "start and end query params are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const start = new Date(startStr + "T00:00:00.000Z");
  const end = new Date(endStr + "T23:59:59.999Z");

  try {
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Run queries in parallel — all scoped to this client
    const [tasks, timeEntries, projects] = await Promise.all([
      // 1. Tasks with dueDate in range for this client
      prisma.clientTask.findMany({
        where: {
          clientId,
          dueDate: { gte: start, lte: end },
        },
        select: {
          id: true,
          name: true,
          dueDate: true,
          status: true,
          priority: true,
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          category: { select: { name: true } },
        },
      }),

      // 2. Time entries for this client in range
      prisma.timeEntry.findMany({
        where: {
          clientId,
          date: { gte: start, lte: end },
        },
        select: {
          id: true,
          date: true,
          duration: true,
          description: true,
          project: { select: { name: true } },
          task: { select: { name: true } },
          user: { select: { id: true, name: true } },
        },
      }),

      // 3. Projects for this client overlapping range
      prisma.project.findMany({
        where: {
          clientId,
          OR: [
            { startDate: { gte: start, lte: end } },
            { endDate: { gte: start, lte: end } },
            {
              AND: [
                { startDate: { lte: start } },
                { endDate: { gte: end } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
          serviceType: true,
        },
      }),
    ]);

    // Transform to unified CalendarEvent[]
    const events: CalendarEvent[] = [];

    // Tasks
    for (const task of tasks) {
      if (!task.dueDate) continue;
      events.push({
        id: `task-${task.id}`,
        type: "task",
        title: task.name,
        date: task.dueDate.toISOString().split("T")[0],
        color: EVENT_COLORS.task,
        metadata: {
          taskId: task.id,
          status: task.status,
          priority: task.priority,
          assignee: task.assignee?.name,
          assigneeId: task.assignee?.id,
          project: task.project?.name,
          projectId: task.project?.id,
          category: task.category?.name,
        },
      });
    }

    // Time entries — group by date+user for cleaner display
    for (const entry of timeEntries) {
      const hours = Math.round((entry.duration / 3600) * 10) / 10;
      events.push({
        id: `time-${entry.id}`,
        type: "timeEntry",
        title: `${hours}h — ${entry.user?.name || "Unknown"} — ${entry.task?.name || entry.project?.name || "Work"}`,
        date: entry.date.toISOString().split("T")[0],
        color: EVENT_COLORS.timeEntry,
        metadata: {
          duration: entry.duration,
          hours,
          description: entry.description,
          project: entry.project?.name,
          task: entry.task?.name,
          userName: entry.user?.name,
          userId: entry.user?.id,
        },
      });
    }

    // Projects
    for (const project of projects) {
      events.push({
        id: `project-${project.id}`,
        type: "project",
        title: project.name,
        date: (project.startDate || start).toISOString().split("T")[0],
        endDate: project.endDate
          ? project.endDate.toISOString().split("T")[0]
          : undefined,
        color: EVENT_COLORS.project,
        metadata: {
          projectId: project.id,
          status: project.status,
          serviceType: project.serviceType,
        },
      });
    }

    return NextResponse.json({
      events,
      clientName: client.name,
      dateRange: { start: startStr, end: endStr },
    });
  } catch (error) {
    console.error("Client calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client calendar data" },
      { status: 500 }
    );
  }
}
