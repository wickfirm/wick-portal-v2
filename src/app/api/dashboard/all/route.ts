import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getProjectFilterForUser } from "@/lib/project-assignments";

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

    // FETCH EVERYTHING IN PARALLEL (1 DATABASE ROUNDTRIP)
    const [
      clientCount,
      projectCount,
      activeProjects,
      teamCount,
      overdueTasks,
      dueTodayTasks,
      totalTasks,
      recentProjects,
      recentClients,
    ] = await Promise.all([
      // Stats
      prisma.client.count({ where: clientFilter }),
      prisma.project.count({ where: projectFilter }),
      prisma.project.count({
        where: {
          ...projectFilter,
          status: "IN_PROGRESS",
        },
      }),
      isAdmin
        ? prisma.user.count({
            where: currentUser.agencyId
              ? { agencyId: currentUser.agencyId }
              : {},
          })
        : Promise.resolve(0),

      // Overdue tasks
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
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Due today tasks
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
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Total tasks count
      prisma.clientTask.count({
        where: {
          ...(!isAdmin && { assigneeId: currentUser.id }),
          status: { not: "COMPLETED" },
        },
      }),

      // Recent projects
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

      // Recent clients
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
    ]);

    // Return everything in one response
    return NextResponse.json({
      stats: {
        clientCount,
        projectCount,
        activeProjects,
        teamCount,
      },
      tasks: {
        overdueTasks,
        dueTodayTasks,
        taskSummary: {
          total: totalTasks,
          overdue: overdueTasks.length,
          dueToday: dueTodayTasks.length,
        },
      },
      recent: {
        recentProjects,
        recentClients,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
