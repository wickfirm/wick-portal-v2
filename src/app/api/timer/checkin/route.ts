/**
 * Timer Check-in API
 * POST: Creates a platform notification reminding the user about their running timer
 * Called by the client-side FloatingTimerBubble every 30 minutes
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Verify user has an active timer
    const activeTimer = await prisma.activeTimer.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!activeTimer) {
      return NextResponse.json({ error: "No active timer" }, { status: 404 });
    }

    // Calculate elapsed time
    const startTime = new Date(activeTimer.startedAt).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Get task/project/client names for the notification
    const [task, project, client] = await Promise.all([
      prisma.clientTask.findUnique({ where: { id: activeTimer.taskId }, select: { name: true } }),
      prisma.project.findUnique({ where: { id: activeTimer.projectId }, select: { name: true } }),
      prisma.client.findUnique({ where: { id: activeTimer.clientId }, select: { name: true, nickname: true } }),
    ]);

    const taskName = task?.name || "Task";
    const projectName = project?.name || "Project";
    const clientName = client?.nickname || client?.name || "Client";

    // Create platform notification
    await createNotification({
      userId: user.id,
      type: "TIMESHEET_REMINDER",
      category: "TIME",
      priority: "NORMAL",
      title: `⏱ Timer Check-in: ${timeStr}`,
      message: `Still working on "${taskName}"? (${clientName} · ${projectName})`,
      link: "/time",
      metadata: {
        timerId: activeTimer.id,
        elapsedSeconds,
        taskName,
        projectName,
        clientName,
      },
    });

    return NextResponse.json({ success: true, elapsed: timeStr });
  } catch (error) {
    console.error("Error creating timer check-in:", error);
    return NextResponse.json(
      { error: "Failed to create check-in notification" },
      { status: 500 }
    );
  }
}
