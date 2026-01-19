import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Get current user's agencyId and role
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, role: true, id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build client filter based on role
    let clientFilter: any = {};
    
    if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
      // ADMINs see all clients where any team member from their agency is assigned
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
    } else if (currentUser.role === "MEMBER") {
      // MEMBERs see ONLY clients they're personally assigned to
      clientFilter = {
        teamMembers: {
          some: {
            userId: currentUser.id
          }
        }
      };
    }

    // Fetch clients with only needed fields
    const clients = await prisma.client.findMany({
      where: clientFilter,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        status: true,
        industry: true,
        email: true,
        phone: true,
        createdAt: true,
        projects: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = {
      total: clients.length,
      active: clients.filter(c => c.status === "ACTIVE").length,
      onboarding: clients.filter(c => c.status === "ONBOARDING").length,
      leads: clients.filter(c => c.status === "LEAD").length,
    };

    return NextResponse.json({ clients, stats });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
