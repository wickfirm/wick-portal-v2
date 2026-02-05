import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" || currentUser.role === "PLATFORM_ADMIN";

    let clients: any[] = [];

    if (isAdmin && currentUser.agencyId) {
      // Use raw SQL to get clients via client_agencies junction table (like dashboard does)
      clients = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT
          c.id,
          c.name,
          c.nickname,
          c.status,
          c.industry,
          c.email,
          c.phone,
          c."createdAt",
          c.pinned
        FROM clients c
        INNER JOIN client_agencies ca ON c.id = ca.client_id
        WHERE ca.agency_id = ${currentUser.agencyId}
        ORDER BY c.pinned DESC NULLS LAST, c.name ASC
      `;

      // Get projects for each client
      const clientIds = clients.map(c => c.id);
      if (clientIds.length > 0) {
        const projects = await prisma.project.findMany({
          where: { clientId: { in: clientIds } },
          select: { id: true, status: true, clientId: true },
        });

        // Attach projects to clients
        const projectsByClient = projects.reduce((acc, p) => {
          if (!acc[p.clientId]) acc[p.clientId] = [];
          acc[p.clientId].push({ id: p.id, status: p.status });
          return acc;
        }, {} as Record<string, any[]>);

        clients = clients.map(c => ({
          ...c,
          projects: projectsByClient[c.id] || [],
        }));
      }
    } else if (isAdmin && !currentUser.agencyId) {
      // SUPER_ADMIN or PLATFORM_ADMIN with no agencyId sees all clients
      clients = await prisma.client.findMany({
        orderBy: [{ pinned: "desc" }, { name: "asc" }],
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
            select: { id: true, status: true },
          },
        },
      });
    } else if (currentUser.role === "MEMBER") {
      // MEMBERs see ONLY clients they're personally assigned to
      clients = await prisma.client.findMany({
        where: {
          teamMembers: {
            some: { userId: currentUser.id },
          },
          status: { not: "CHURNED" },
        },
        orderBy: [{ pinned: "desc" }, { name: "asc" }],
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
            select: { id: true, status: true },
          },
        },
      });
    }

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
