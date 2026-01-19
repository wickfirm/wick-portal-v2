import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getProjectFilterForUser } from "@/lib/project-assignments";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, role: true, id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build CLIENT filter
    let clientFilter: any = {};
    if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
      if (currentUser.agencyId) {
        const agencyTeamMembers = await prisma.user.findMany({
          where: { agencyId: currentUser.agencyId },
          select: { id: true },
        });
        const teamMemberIds = agencyTeamMembers.map(u => u.id);
        
        clientFilter = {
          teamMembers: {
            some: {
              userId: { in: teamMemberIds }
            }
          }
        };
      }
    } else {
      const assignments = await prisma.clientTeamMember.findMany({
        where: { userId: currentUser.id },
        select: { clientId: true },
      });
      const clientIds = assignments.map(a => a.clientId);
      clientFilter = { id: { in: clientIds } };
    }

    // Get PROJECT filter
    const projectFilter = await getProjectFilterForUser(
      currentUser.id,
      currentUser.role,
      currentUser.agencyId
    );

    // Fetch recent projects and clients
    const [recentProjects, recentClients] = await Promise.all([
      prisma.project.findMany({
        where: projectFilter,
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          client: {
            select: {
              id: true,
              name: true,
              nickname: true,
            }
          },
          stages: {
            select: {
              id: true,
              isCompleted: true,
            }
          }
        },
      }),
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

    return NextResponse.json({
      recentProjects,
      recentClients,
    });
  } catch (error) {
    console.error("[DASHBOARD RECENT ERROR]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
