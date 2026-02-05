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
    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" || currentUser.role === "PLATFORM_ADMIN";

    if (isAdmin) {
      // ADMINs and SUPER_ADMINs see all clients that belong to their agency
      // They can see all statuses including CHURNED (filtered on frontend)
      if (currentUser.agencyId) {
        // Check both the direct agencyId field AND the agencies relation
        clientFilter = {
          OR: [
            { agencyId: currentUser.agencyId },
            {
              agencies: {
                some: {
                  agencyId: currentUser.agencyId
                }
              }
            }
          ]
        };
      } else if (currentUser.role === "PLATFORM_ADMIN") {
        // Platform admins with no agencyId can see all clients
        clientFilter = {};
      }
    } else if (currentUser.role === "MEMBER") {
      // MEMBERs see ONLY ACTIVE clients they're personally assigned to
      // They cannot see CHURNED clients at all
      clientFilter = {
        teamMembers: {
          some: {
            userId: currentUser.id
          }
        },
        status: {
          not: "CHURNED"
        }
      };
    }

    // Fetch clients with only needed fields
    // Sort by pinned first (true first), then by name
    const clients = await prisma.client.findMany({
      where: clientFilter,
      orderBy: [
        { pinned: "desc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        nickname: true,
        status: true,
        industry: true,
        email: true,
        phone: true,
        createdAt: true,
        pinned: true,
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
      churned: clients.filter(c => c.status === "CHURNED").length,
    };

    return NextResponse.json({ clients, stats, isAdmin });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
