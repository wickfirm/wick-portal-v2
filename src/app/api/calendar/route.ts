/**
 * Calendar API
 * GET: Returns unified calendar events for a date range
 * Aggregates: tasks, time entries, leave requests, projects, public holidays, bookings
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface CalendarEvent {
  id: string;
  type: "task" | "timeEntry" | "leave" | "project" | "holiday" | "booking";
  title: string;
  date: string;        // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD for multi-day events
  color: string;
  link?: string;
  metadata: Record<string, any>;
}

const EVENT_COLORS = {
  task: "#76527c",       // Wick purple
  timeEntry: "#4285f4",  // Blue
  leave: "#ea4335",      // Red
  project: "#34a853",    // Green
  holiday: "#f9ab00",    // Warning yellow
  booking: "#f6dab9",    // Peach
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { searchParams } = new URL(req.url);

  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");
  const filterUserId = searchParams.get("userId");

  if (!startStr || !endStr) {
    return NextResponse.json({ error: "start and end query params are required (YYYY-MM-DD)" }, { status: 400 });
  }

  const start = new Date(startStr + "T00:00:00.000Z");
  const end = new Date(endStr + "T23:59:59.999Z");

  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(user.role);

  // Determine which userId to filter by
  // Members always see only their own data
  // Admins see all data, or filter by a specific userId
  const targetUserId = isAdmin ? (filterUserId || null) : user.id;

  try {
    // Run all queries in parallel
    const [tasks, timeEntries, leaveRequests, projects, holidays, bookings, teamMembers] = await Promise.all([
      // 1. Tasks with dueDate in range
      prisma.clientTask.findMany({
        where: {
          dueDate: { gte: start, lte: end },
          ...(targetUserId ? { assigneeId: targetUserId } : {}),
        },
        select: {
          id: true,
          name: true,
          dueDate: true,
          status: true,
          priority: true,
          client: { select: { name: true } },
          assignee: { select: { id: true, name: true } },
        },
      }),

      // 2. Time entries in range
      prisma.timeEntry.findMany({
        where: {
          date: { gte: start, lte: end },
          ...(targetUserId ? { userId: targetUserId } : {}),
        },
        select: {
          id: true,
          date: true,
          duration: true,
          description: true,
          client: { select: { name: true } },
          project: { select: { name: true } },
          task: { select: { name: true } },
          user: { select: { id: true, name: true } },
        },
      }),

      // 3. Approved leave requests overlapping range
      prisma.leaveRequest.findMany({
        where: {
          status: "APPROVED",
          startDate: { lte: end },
          endDate: { gte: start },
          ...(targetUserId
            ? { employee: { userId: targetUserId } }
            : {}),
        },
        select: {
          id: true,
          leaveType: true,
          startDate: true,
          endDate: true,
          totalDays: true,
          reason: true,
          employee: {
            select: { user: { select: { id: true, name: true } } },
          },
        },
      }),

      // 4. Projects overlapping range
      prisma.project.findMany({
        where: {
          OR: [
            { startDate: { gte: start, lte: end } },
            { endDate: { gte: start, lte: end } },
            { AND: [{ startDate: { lte: start } }, { endDate: { gte: end } }] },
          ],
          ...(targetUserId
            ? { assignments: { some: { userId: targetUserId } } }
            : {}),
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
          client: { select: { name: true } },
        },
      }),

      // 5. Public holidays in range (agency-scoped)
      prisma.publicHoliday.findMany({
        where: {
          date: { gte: start, lte: end },
          ...(user.agencyId ? { agencyId: user.agencyId } : {}),
        },
        select: {
          id: true,
          name: true,
          date: true,
          numberOfDays: true,
          country: true,
        },
      }),

      // 6. Bookings in range
      prisma.booking.findMany({
        where: {
          scheduledTime: { gte: start, lte: end },
          ...(targetUserId ? { userId: targetUserId } : {}),
        },
        select: {
          id: true,
          scheduledTime: true,
          meetingType: true,
          status: true,
          notes: true,
          lead: { select: { name: true, company: true } },
          user: { select: { id: true, name: true } },
        },
      }),

      // 7. Team members (for admin dropdown)
      isAdmin
        ? prisma.user.findMany({
            where: {
              isActive: true,
              role: { in: ["MEMBER", "ADMIN", "SUPER_ADMIN", "MANAGER"] },
              ...(user.agencyId ? { agencyId: user.agencyId } : {}),
            },
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
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
        link: `/tasks?highlight=${task.id}`,
        metadata: {
          status: task.status,
          priority: task.priority,
          client: task.client?.name,
          assignee: task.assignee?.name,
          assigneeId: task.assignee?.id,
        },
      });
    }

    // Time entries
    for (const entry of timeEntries) {
      const hours = Math.round((entry.duration / 3600) * 10) / 10;
      events.push({
        id: `time-${entry.id}`,
        type: "timeEntry",
        title: `${hours}h — ${entry.project?.name || entry.client?.name || "Time entry"}`,
        date: entry.date.toISOString().split("T")[0],
        color: EVENT_COLORS.timeEntry,
        link: "/timesheet",
        metadata: {
          duration: entry.duration,
          hours,
          description: entry.description,
          client: entry.client?.name,
          project: entry.project?.name,
          task: entry.task?.name,
          userName: entry.user?.name,
          userId: entry.user?.id,
        },
      });
    }

    // Leave requests
    for (const leave of leaveRequests) {
      events.push({
        id: `leave-${leave.id}`,
        type: "leave",
        title: `${leave.employee?.user?.name || "Employee"} — ${leave.leaveType} leave`,
        date: leave.startDate.toISOString().split("T")[0],
        endDate: leave.endDate.toISOString().split("T")[0],
        color: EVENT_COLORS.leave,
        link: "/dashboard/hr",
        metadata: {
          leaveType: leave.leaveType,
          totalDays: Number(leave.totalDays),
          reason: leave.reason,
          employeeName: leave.employee?.user?.name,
          employeeId: leave.employee?.user?.id,
        },
      });
    }

    // Projects
    for (const project of projects) {
      events.push({
        id: `project-${project.id}`,
        type: "project",
        title: `${project.name}${project.client?.name ? ` (${project.client.name})` : ""}`,
        date: (project.startDate || start).toISOString().split("T")[0],
        endDate: project.endDate
          ? project.endDate.toISOString().split("T")[0]
          : undefined,
        color: EVENT_COLORS.project,
        link: `/projects?id=${project.id}`,
        metadata: {
          status: project.status,
          client: project.client?.name,
        },
      });
    }

    // Public holidays
    for (const holiday of holidays) {
      // For multi-day holidays, compute end date
      let holidayEnd: string | undefined;
      if (holiday.numberOfDays > 1) {
        const endD = new Date(holiday.date);
        endD.setDate(endD.getDate() + holiday.numberOfDays - 1);
        holidayEnd = endD.toISOString().split("T")[0];
      }
      events.push({
        id: `holiday-${holiday.id}`,
        type: "holiday",
        title: holiday.name,
        date: holiday.date.toISOString().split("T")[0],
        endDate: holidayEnd,
        color: EVENT_COLORS.holiday,
        metadata: {
          country: holiday.country,
          numberOfDays: holiday.numberOfDays,
        },
      });
    }

    // Bookings
    for (const booking of bookings) {
      const time = booking.scheduledTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      events.push({
        id: `booking-${booking.id}`,
        type: "booking",
        title: `${booking.meetingType.replace(/_/g, " ")} — ${booking.lead?.name || "Lead"}`,
        date: booking.scheduledTime.toISOString().split("T")[0],
        color: EVENT_COLORS.booking,
        link: "/lead-qualifier",
        metadata: {
          time,
          meetingType: booking.meetingType,
          status: booking.status,
          leadName: booking.lead?.name,
          company: booking.lead?.company,
          userName: booking.user?.name,
          userId: booking.user?.id,
        },
      });
    }

    return NextResponse.json({
      events,
      teamMembers: isAdmin ? teamMembers : [],
      dateRange: { start: startStr, end: endStr },
      filteredUserId: targetUserId,
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
  }
}
