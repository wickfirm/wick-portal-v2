import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getProjectFilterForUser } from "@/lib/project-assignments";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

    // Get project filter
    const projectFilter = await getProjectFilterForUser(
      currentUser.id,
      currentUser.role,
      currentUser.agencyId
    );

    // Build client filter
    let clientFilter: any = {};
    if (currentUser.agencyId) {
      clientFilter = {
        agencies: {
          some: { agencyId: currentUser.agencyId }
        }
      };
    } else if (currentUser.role !== "PLATFORM_ADMIN") {
      clientFilter = {
        teamMembers: {
          some: { userId: currentUser.id }
        }
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 7 days ago for weekly trends
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // COMBINED STATS QUERY - All counts in ONE database round trip!
    interface DashboardStats {
      clientCount: bigint;
      projectCount: bigint;
      activeProjects: bigint;
      teamCount: bigint;
      overdueTasks: bigint;
      dueTodayTasks: bigint;
      totalTasks: bigint;
      completedThisWeek: bigint;
    }

    const statsQueryAdmin = Prisma.sql`
      SELECT
        (SELECT COUNT(DISTINCT c.id) FROM clients c
         INNER JOIN client_agencies ca ON c.id = ca.client_id
         WHERE ca.agency_id = ${currentUser.agencyId} AND c.status = 'ACTIVE') as "clientCount",
        (SELECT COUNT(DISTINCT p.id) FROM projects p
         INNER JOIN clients c ON p."clientId" = c.id
         INNER JOIN client_agencies ca ON c.id = ca.client_id
         WHERE ca.agency_id = ${currentUser.agencyId}) as "projectCount",
        (SELECT COUNT(DISTINCT p.id) FROM projects p
         INNER JOIN clients c ON p."clientId" = c.id
         INNER JOIN client_agencies ca ON c.id = ca.client_id
         WHERE ca.agency_id = ${currentUser.agencyId} AND p.status = 'IN_PROGRESS') as "activeProjects",
        (SELECT COUNT(*) FROM users WHERE agency_id = ${currentUser.agencyId}) as "teamCount",
        (SELECT COUNT(*) FROM client_tasks ct
         INNER JOIN clients c ON ct."clientId" = c.id
         INNER JOIN client_agencies ca ON c.id = ca.client_id
         WHERE ca.agency_id = ${currentUser.agencyId} AND ct.status != 'COMPLETED' AND ct."dueDate" < ${today}) as "overdueTasks",
        (SELECT COUNT(*) FROM client_tasks ct
         INNER JOIN clients c ON ct."clientId" = c.id
         INNER JOIN client_agencies ca ON c.id = ca.client_id
         WHERE ca.agency_id = ${currentUser.agencyId} AND ct.status != 'COMPLETED' AND ct."dueDate" >= ${today} AND ct."dueDate" < ${tomorrow}) as "dueTodayTasks",
        (SELECT COUNT(*) FROM client_tasks ct
         INNER JOIN clients c ON ct."clientId" = c.id
         INNER JOIN client_agencies ca ON c.id = ca.client_id
         WHERE ca.agency_id = ${currentUser.agencyId} AND ct.status != 'COMPLETED') as "totalTasks",
        (SELECT COUNT(*) FROM client_tasks ct
         INNER JOIN clients c ON ct."clientId" = c.id
         INNER JOIN client_agencies ca ON c.id = ca.client_id
         WHERE ca.agency_id = ${currentUser.agencyId} AND ct.status = 'COMPLETED' AND ct."updatedAt" >= ${weekAgo}) as "completedThisWeek"
    `;

    const statsQueryNonAdmin = Prisma.sql`
      SELECT
        (SELECT COUNT(DISTINCT c.id) FROM clients c
         INNER JOIN client_team_members ctm ON c.id = ctm."clientId"
         WHERE ctm."userId" = ${currentUser.id}) as "clientCount",
        (SELECT COUNT(*) FROM projects WHERE "clientId" IN
         (SELECT "clientId" FROM client_team_members WHERE "userId" = ${currentUser.id})) as "projectCount",
        (SELECT COUNT(*) FROM projects WHERE status = 'IN_PROGRESS' AND "clientId" IN
         (SELECT "clientId" FROM client_team_members WHERE "userId" = ${currentUser.id})) as "activeProjects",
        0 as "teamCount",
        (SELECT COUNT(*) FROM client_tasks WHERE "assigneeId" = ${currentUser.id} AND status != 'COMPLETED' AND "dueDate" < ${today}) as "overdueTasks",
        (SELECT COUNT(*) FROM client_tasks WHERE "assigneeId" = ${currentUser.id} AND status != 'COMPLETED' AND "dueDate" >= ${today} AND "dueDate" < ${tomorrow}) as "dueTodayTasks",
        (SELECT COUNT(*) FROM client_tasks WHERE "assigneeId" = ${currentUser.id} AND status != 'COMPLETED') as "totalTasks",
        (SELECT COUNT(*) FROM client_tasks WHERE "assigneeId" = ${currentUser.id} AND status = 'COMPLETED' AND "updatedAt" >= ${weekAgo}) as "completedThisWeek"
    `;

    // Execute queries in parallel
    const [statsResult, overdueTasks, dueTodayTasks, recentProjects, recentClients, recentActivity, todayTimeEntries] = await Promise.all([
      // 1. Combined stats query
      prisma.$queryRaw<DashboardStats[]>(isAdmin ? statsQueryAdmin : statsQueryNonAdmin),

      // 2. Overdue tasks details
      prisma.clientTask.findMany({
        where: {
          ...(!isAdmin && { assigneeId: currentUser.id }),
          dueDate: { lt: today },
          status: { not: "COMPLETED" },
        },
        take: 10,
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          name: true,
          dueDate: true,
          priority: true,
          status: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // 3. Due today tasks details
      prisma.clientTask.findMany({
        where: {
          ...(!isAdmin && { assigneeId: currentUser.id }),
          dueDate: { gte: today, lt: tomorrow },
          status: { not: "COMPLETED" },
        },
        take: 10,
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          name: true,
          dueDate: true,
          priority: true,
          status: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // 4. Recent projects
      prisma.project.findMany({
        where: projectFilter,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          client: {
            select: {
              id: true,
              name: true,
              nickname: true,
            },
          },
          stages: {
            select: {
              id: true,
              isCompleted: true,
            },
          },
        },
      }),

      // 5. Recent clients
      prisma.client.findMany({
        where: clientFilter,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          nickname: true,
          status: true,
          industry: true,
        },
      }),

      // 6. Recent team activity
      prisma.teamActivity.findMany({
        where: {
          createdAt: { gte: weekAgo },
          ...(currentUser.agencyId ? {
            user: { agencyId: currentUser.agencyId }
          } : {}),
        },
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          activityType: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      }),

      // 7. Today's time entries for hours logged
      prisma.timeEntry.findMany({
        where: {
          userId: currentUser.id,
          date: { gte: today, lt: tomorrow },
        },
        select: {
          duration: true,
        },
      }),
    ]);

    // Convert BigInt to Number for JSON serialization
    const stats = statsResult[0];
    const todayHoursSeconds = todayTimeEntries.reduce((sum, e) => sum + e.duration, 0);
    const todayHours = Math.round((todayHoursSeconds / 3600) * 10) / 10;

    const formattedStats = {
      clientCount: Number(stats.clientCount),
      projectCount: Number(stats.projectCount),
      activeProjects: Number(stats.activeProjects),
      teamCount: Number(stats.teamCount),
    };

    return NextResponse.json({
      stats: formattedStats,
      tasks: {
        overdueTasks,
        dueTodayTasks,
        taskSummary: {
          total: Number(stats.totalTasks),
          overdue: Number(stats.overdueTasks),
          dueToday: Number(stats.dueTodayTasks),
          completedThisWeek: Number(stats.completedThisWeek),
        },
      },
      recent: {
        recentProjects,
        recentClients,
      },
      activity: recentActivity,
      timeToday: todayHours,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
