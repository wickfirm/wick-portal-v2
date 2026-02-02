/**
 * Task Priority Reminders API
 *
 * GET: Called by cron job to send reminders for urgent/high-priority tasks
 *
 * Reminder frequency by priority:
 *   URGENT/CRITICAL → every 5 minutes
 *   HIGH            → every 30 minutes
 *   MEDIUM          → every 2 hours
 *   LOW             → once per day (8 hours)
 *
 * Reminders stop when:
 *   - Task status is COMPLETED or DONE
 *   - Task has no assignee
 *   - The assignee has an active timer on that task
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Reminder intervals in minutes per priority
const REMINDER_INTERVALS: Record<string, number> = {
  URGENT: 5,
  CRITICAL: 5,
  HIGH: 30,
  MEDIUM: 120,
  LOW: 480,
};

// Which priorities should receive reminders
const REMINDER_PRIORITIES = ["URGENT", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export async function GET(req: NextRequest) {
  // Optional auth via secret key for cron jobs
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow session-based auth for manual triggers
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    let remindersSent = 0;
    let tasksChecked = 0;

    // Get all non-completed tasks with assignees and reminder-eligible priorities
    const tasks = await prisma.clientTask.findMany({
      where: {
        status: { notIn: ["COMPLETED", "DONE"] },
        assigneeId: { not: null },
        priority: { in: REMINDER_PRIORITIES },
      },
      select: {
        id: true,
        name: true,
        priority: true,
        status: true,
        dueDate: true,
        assigneeId: true,
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    tasksChecked = tasks.length;

    // Get all active timers to skip tasks being worked on
    const activeTimers = await prisma.activeTimer.findMany({
      select: { taskId: true, userId: true },
    });
    const activeTimerTaskIds = new Set(activeTimers.map((t) => t.taskId));

    // Get recent reminders to enforce intervals
    // Look back at the max possible interval (8 hours for LOW)
    const lookbackTime = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const recentReminders = await prisma.notification.findMany({
      where: {
        type: "TASK_DUE_SOON",
        createdAt: { gte: lookbackTime },
        metadata: { path: ["reminderType"], equals: "priority_reminder" },
      },
      select: {
        userId: true,
        metadata: true,
        createdAt: true,
      },
    });

    // Build a map of taskId+userId → last reminder time
    const lastReminderMap = new Map<string, Date>();
    for (const r of recentReminders) {
      const meta = r.metadata as any;
      if (meta?.taskId) {
        const key = `${meta.taskId}:${r.userId}`;
        const existing = lastReminderMap.get(key);
        if (!existing || r.createdAt > existing) {
          lastReminderMap.set(key, r.createdAt);
        }
      }
    }

    // Process each task
    for (const task of tasks) {
      if (!task.assigneeId) continue;

      // Skip if assignee is actively timing this task
      if (activeTimerTaskIds.has(task.id)) continue;

      const intervalMinutes = REMINDER_INTERVALS[task.priority] || 480;
      const key = `${task.id}:${task.assigneeId}`;
      const lastReminder = lastReminderMap.get(key);

      // Check if enough time has passed since last reminder
      if (lastReminder) {
        const minutesSince = (now.getTime() - lastReminder.getTime()) / (1000 * 60);
        if (minutesSince < intervalMinutes) continue;
      }

      // Build urgency message
      const isOverdue = task.dueDate && new Date(task.dueDate) < now;
      const priorityEmoji =
        task.priority === "URGENT" || task.priority === "CRITICAL"
          ? "🔴"
          : task.priority === "HIGH"
            ? "🟠"
            : task.priority === "MEDIUM"
              ? "🟡"
              : "🟢";

      const title = isOverdue
        ? `${priorityEmoji} OVERDUE: "${task.name}" needs attention`
        : `${priorityEmoji} ${task.priority} task reminder: "${task.name}"`;

      const messageParts = [];
      if (task.client?.name) messageParts.push(task.client.name);
      if (task.project?.name) messageParts.push(task.project.name);
      messageParts.push(`Status: ${task.status.replace(/_/g, " ")}`);
      if (isOverdue) {
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
        );
        messageParts.push(`${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`);
      }
      const message = messageParts.join(" · ");

      // Determine notification priority
      const notifPriority =
        task.priority === "URGENT" || task.priority === "CRITICAL"
          ? ("URGENT" as const)
          : task.priority === "HIGH"
            ? ("HIGH" as const)
            : ("NORMAL" as const);

      try {
        await createNotification({
          userId: task.assigneeId,
          type: "TASK_DUE_SOON",
          category: "TASK",
          priority: notifPriority,
          title,
          message,
          link: `/tasks?taskId=${task.id}`,
          metadata: {
            taskId: task.id,
            taskPriority: task.priority,
            reminderType: "priority_reminder",
            isOverdue,
          },
        });
        remindersSent++;
      } catch (err) {
        console.error(`Failed to send reminder for task ${task.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      tasksChecked,
      remindersSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Task reminders error:", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
