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

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" || currentUser.role === "PLATFORM_ADMIN";

    let projects: any[] = [];

    if (isAdmin && currentUser.agencyId) {
      // Use raw SQL to get projects via client_agencies junction table (like dashboard does)
      const rawProjects = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT
          p.id,
          p.name,
          p.description,
          p.status,
          p."serviceType",
          p."startDate",
          p."endDate",
          p."createdAt",
          p.pinned,
          p."clientId"
        FROM projects p
        INNER JOIN clients c ON p."clientId" = c.id
        INNER JOIN client_agencies ca ON c.id = ca.client_id
        WHERE ca.agency_id = ${currentUser.agencyId}
        ORDER BY p.pinned DESC NULLS LAST, p.name ASC
      `;

      // Get client info and stages for each project
      const projectIds = rawProjects.map(p => p.id);
      const clientIds = [...new Set(rawProjects.map(p => p.clientId))];

      const [clients, stages] = await Promise.all([
        prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, name: true, nickname: true },
        }),
        prisma.projectStage.findMany({
          where: { projectId: { in: projectIds } },
          select: { id: true, projectId: true, isCompleted: true },
        }),
      ]);

      const clientsMap = clients.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {} as Record<string, any>);

      const stagesByProject = stages.reduce((acc, s) => {
        if (!acc[s.projectId]) acc[s.projectId] = [];
        acc[s.projectId].push({ id: s.id, isCompleted: s.isCompleted });
        return acc;
      }, {} as Record<string, any[]>);

      projects = rawProjects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        serviceType: p.serviceType,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
        pinned: p.pinned,
        client: clientsMap[p.clientId] || null,
        stages: stagesByProject[p.id] || [],
      }));
    } else if (isAdmin && !currentUser.agencyId) {
      // SUPER_ADMIN or PLATFORM_ADMIN with no agencyId sees all projects
      projects = await prisma.project.findMany({
        orderBy: [{ pinned: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          serviceType: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          pinned: true,
          client: {
            select: { id: true, name: true, nickname: true },
          },
          stages: {
            select: { id: true, isCompleted: true },
          },
        },
      });
    } else if (currentUser.role === "MEMBER") {
      // MEMBERs see projects from clients they're assigned to
      projects = await prisma.project.findMany({
        where: {
          client: {
            teamMembers: {
              some: { userId: currentUser.id },
            },
          },
        },
        orderBy: [{ pinned: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          serviceType: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          pinned: true,
          client: {
            select: { id: true, name: true, nickname: true },
          },
          stages: {
            select: { id: true, isCompleted: true },
          },
        },
      });
    }

    // Calculate stats
    const stats = {
      total: projects.length,
      inProgress: projects.filter(p => p.status === "IN_PROGRESS").length,
      completed: projects.filter(p => p.status === "COMPLETED").length,
      onHold: projects.filter(p => p.status === "ON_HOLD").length,
    };

    return NextResponse.json({ projects, stats, isAdmin });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
