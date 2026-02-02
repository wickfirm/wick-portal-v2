import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function getWeekDates(dateInWeek: Date) {
  const date = new Date(dateInWeek);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d);
  }

  return weekDates;
}

function getMonthDates(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(year, month, 0); // last day of the month
  monthEnd.setHours(23, 59, 59, 999);

  const allDates: Date[] = [];
  const current = new Date(monthStart);
  while (current <= monthEnd) {
    allDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return { monthStart, monthEnd, allDates };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get("week");
    const monthParam = searchParams.get("month");
    const userIdParam = searchParams.get("userId");

    const dbUser = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agencyId: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMonthView = !!monthParam;
    let rangeStart: Date;
    let rangeEnd: Date;
    let datesToReturn: Date[];

    if (isMonthView) {
      const { monthStart, monthEnd, allDates } = getMonthDates(monthParam);
      rangeStart = monthStart;
      rangeEnd = monthEnd;
      datesToReturn = allDates;
    } else {
      const targetDate = weekParam ? new Date(weekParam) : new Date();
      const weekDates = getWeekDates(targetDate);
      rangeStart = weekDates[0];
      rangeEnd = weekDates[6];
      datesToReturn = weekDates;
    }

    const canViewOthers = ["SUPER_ADMIN", "ADMIN"].includes(dbUser.role || "");
    const viewUserId = canViewOthers && userIdParam ? userIdParam : dbUser.id;

    // Get team members if user can view others
    let teamMembers: any[] = [];
    if (canViewOthers && dbUser.agencyId) {
      teamMembers = await prisma.user.findMany({
        where: { 
          isActive: true, 
          role: { not: "CLIENT" },
          agencyId: dbUser.agencyId,
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
    }

    // Get view user details
    const viewUser = viewUserId === dbUser.id 
      ? dbUser 
      : await prisma.user.findUnique({
          where: { id: viewUserId },
          select: { id: true, name: true, email: true, role: true, agencyId: true },
        });

    // Fetch time entries for the date range (week or month)
    const timeEntries = await (prisma.timeEntry.findMany as any)({
      where: {
        userId: viewUserId,
        date: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      select: {
        id: true,
        date: true,
        duration: true, // Duration in seconds
        description: true,
        billable: true,
        source: true,
        createdAt: true,
        projectId: true,
        taskId: true,
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true,
                nickname: true,
              },
            },
          },
        },
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }) as any[];

    // Fetch clients based on role
    let clientFilter: any = { status: { in: ["ACTIVE", "ONBOARDING"] } };
    
    if (dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN") {
      // ADMINs see all clients in their agency
      if (dbUser.agencyId) {
        const agencyTeamMembers = await prisma.user.findMany({
          where: { agencyId: dbUser.agencyId },
          select: { id: true },
        });
        const teamMemberIds = agencyTeamMembers.map(u => u.id);
        
        clientFilter.teamMembers = {
          some: {
            userId: { in: teamMemberIds }
          }
        };
      }
    } else if (dbUser.role === "MEMBER") {
      // MEMBERs see only their assigned clients
      const assignments = await prisma.clientTeamMember.findMany({
        where: { userId: dbUser.id },
        select: { clientId: true },
      });
      const clientIds = assignments.map(a => a.clientId);
      clientFilter.id = { in: clientIds };
    }

    const clients = await prisma.client.findMany({
      where: clientFilter,
      select: { id: true, name: true, nickname: true },
      orderBy: { name: "asc" },
    });

    // Build month summary if in month view
    let monthSummary = undefined;
    if (isMonthView) {
      // Totals by project
      const projectMap = new Map<string, { projectId: string; projectName: string; clientName: string; totalSeconds: number }>();
      for (const entry of timeEntries) {
        const projId = entry.projectId || "no-project";
        const existing = projectMap.get(projId);
        if (existing) {
          existing.totalSeconds += entry.duration;
        } else {
          projectMap.set(projId, {
            projectId: projId,
            projectName: entry.project?.name || "No Project",
            clientName: entry.project?.client?.name || entry.client?.name || "No Client",
            totalSeconds: entry.duration,
          });
        }
      }

      // Totals by day
      const dayMap = new Map<string, number>();
      for (const entry of timeEntries) {
        const dateKey = new Date(entry.date).toISOString().split("T")[0];
        dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + entry.duration);
      }
      const totalsByDay = Array.from(dayMap.entries())
        .map(([date, totalSeconds]) => ({ date, totalSeconds }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Billable / non-billable
      let totalBillable = 0;
      let totalNonBillable = 0;
      for (const entry of timeEntries) {
        if (entry.billable) {
          totalBillable += entry.duration;
        } else {
          totalNonBillable += entry.duration;
        }
      }

      // Daily average (total seconds / number of days in month)
      const daysInMonth = datesToReturn.length;
      const totalSeconds = totalBillable + totalNonBillable;
      const dailyAverage = daysInMonth > 0 ? Math.round(totalSeconds / daysInMonth) : 0;

      monthSummary = {
        totalsByProject: Array.from(projectMap.values()),
        totalsByDay,
        totalBillable,
        totalNonBillable,
        dailyAverage,
        isMonthView: true as const,
      };
    }

    return NextResponse.json({
      timeEntries,
      clients,
      weekDates: datesToReturn.map(d => d.toISOString()),
      weekStart: rangeStart.toISOString(),
      weekEnd: rangeEnd.toISOString(),
      viewUser,
      teamMembers,
      canViewOthers,
      ...(monthSummary ? { monthSummary } : {}),
    });
  } catch (error) {
    console.error("Error fetching timesheet data:", error);
    return NextResponse.json(
      { error: "Failed to fetch timesheet data" },
      { status: 500 }
    );
  }
}
