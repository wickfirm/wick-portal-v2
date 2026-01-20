import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's agency for filtering
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Redirect MEMBERs - they shouldn't access analytics
    if (currentUser.role === "MEMBER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build client filter based on agency
    let clientFilter: any = {};
    
    if (currentUser.agencyId === null) {
      // External partners: only see clients they're assigned to
      clientFilter = {
        teamMembers: {
          some: { userId: currentUser.id }
        }
      };
    } else if (currentUser.role === "SUPER_ADMIN") {
      // SUPER_ADMIN: see all clients where their agency's team members are assigned
      const agencyUsers = await prisma.user.findMany({
        where: { agencyId: currentUser.agencyId },
        select: { id: true },
      });
      clientFilter = {
        teamMembers: {
          some: {
            userId: { in: agencyUsers.map(u => u.id) }
          }
        }
      };
    } else {
      // Regular users: only see clients they're assigned to
      clientFilter = {
        teamMembers: {
          some: { userId: currentUser.id }
        }
      };
    }

    const [
      clients,
      totalProjects,
      completedProjects,
      inProgressProjects,
      totalTasks,
      completedTasks,
      clientsByStatus,
      projectsByType,
      projectsByStatus,
      allMetrics,
    ] = await Promise.all([
      prisma.client.findMany({ 
        where: clientFilter,
        select: { id: true, name: true, nickname: true, status: true },
        orderBy: { name: "asc" }
      }),
      prisma.project.count({
        where: {
          client: clientFilter
        }
      }),
      prisma.project.count({ 
        where: { 
          status: "COMPLETED",
          client: clientFilter
        } 
      }),
      prisma.project.count({ 
        where: { 
          status: "IN_PROGRESS",
          client: clientFilter
        } 
      }),
      prisma.clientTask.count({
        where: {
          client: clientFilter
        }
      }),
      prisma.clientTask.count({ 
        where: { 
          status: "COMPLETED",
          client: clientFilter
        } 
      }),
      prisma.client.groupBy({ 
        by: ["status"], 
        _count: { status: true },
        where: clientFilter
      }),
      prisma.project.groupBy({ 
        by: ["serviceType"], 
        _count: { serviceType: true },
        where: {
          client: clientFilter
        }
      }),
      prisma.project.groupBy({ 
        by: ["status"], 
        _count: { status: true },
        where: {
          client: clientFilter
        }
      }),
      prisma.clientMetrics.findMany({ 
        where: {
          client: clientFilter
        },
        orderBy: { month: "asc" },
        include: { client: { select: { id: true, name: true, nickname: true } } }
      }),
    ]);

    const serializedMetrics = allMetrics.map((m) => ({ 
      ...m, 
      month: m.month.toISOString(),
      clientName: m.client.nickname || m.client.name,
    }));

    const serializedClients = clients.map((c) => ({
      id: c.id,
      name: c.nickname || c.name,
      status: c.status,
    }));

    return NextResponse.json({
      clients: serializedClients,
      totalProjects,
      completedProjects,
      inProgressProjects,
      totalTasks,
      completedTasks,
      clientsByStatus,
      projectsByType,
      projectsByStatus,
      allMetrics: serializedMetrics,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
