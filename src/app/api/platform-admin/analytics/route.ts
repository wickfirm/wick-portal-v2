import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  if (user.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Platform admin access required" }, { status: 403 });
  }

  try {
    // Get all agencies with stats
    const agencies = await prisma.agency.findMany({
      include: {
        users: {
          select: {
            id: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    // Count clients per agency
    const clientCounts = await Promise.all(
      agencies.map(async (agency) => {
        const userIds = agency.users.map(u => u.id);
        const clientCount = await prisma.client.count({
          where: {
            teamMembers: {
              some: {
                userId: { in: userIds },
              },
            },
          },
        });
        return { agencyId: agency.id, clientCount };
      })
    );

    // Count projects per agency
    const projectCounts = await Promise.all(
      agencies.map(async (agency) => {
        const userIds = agency.users.map(u => u.id);
        const projectCount = await prisma.project.count({
          where: {
            client: {
              teamMembers: {
                some: {
                  userId: { in: userIds },
                },
              },
            },
          },
        });
        return { agencyId: agency.id, projectCount };
      })
    );

    // Agency stats
    const agencyStats = agencies.map(agency => {
      const clientData = clientCounts.find(c => c.agencyId === agency.id);
      const projectData = projectCounts.find(p => p.agencyId === agency.id);

      return {
        agencyName: agency.name,
        totalUsers: agency.users.length,
        activeUsers: agency.users.filter(u => u.isActive).length,
        totalClients: clientData?.clientCount || 0,
        totalProjects: projectData?.projectCount || 0,
      };
    });

    // User growth (recent signups grouped by agency)
    const userGrowth = agencies.flatMap(agency =>
      agency.users.map(u => ({
        date: u.createdAt.toISOString(),
        count: 1,
        agency: agency.name,
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      agencyStats,
      userGrowth,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
