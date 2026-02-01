import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const query = req.nextUrl.searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        clients: [],
        projects: [],
        tasks: [],
        notes: [],
        leads: [],
        team: [],
      });
    }

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, role: true, id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { agencyId, role, id: userId } = currentUser;
    const isMember = role === "MEMBER";

    // Build client scope filter based on role
    const clientScopeFilter: any = isMember
      ? { teamMembers: { some: { userId } } }
      : agencyId
        ? { agencies: { some: { agencyId } } }
        : {};

    // Run all searches in parallel
    const [clients, projects, tasks, notes, leads, team] = await Promise.all([
      // Clients
      prisma.client.findMany({
        where: {
          ...clientScopeFilter,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { nickname: { contains: query, mode: "insensitive" } },
            { industry: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          status: true,
          nickname: true,
        },
        take: 5,
        orderBy: { name: "asc" },
      }),

      // Projects
      prisma.project.findMany({
        where: {
          client: clientScopeFilter,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
          serviceType: true,
          client: { select: { name: true } },
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),

      // Tasks
      prisma.clientTask.findMany({
        where: {
          client: clientScopeFilter,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { internalNotes: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          client: { select: { name: true, id: true } },
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),

      // Notes
      prisma.note.findMany({
        where: {
          createdBy: userId,
          archivedAt: null,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          color: true,
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),

      // Leads (only for non-members)
      isMember
        ? Promise.resolve([])
        : prisma.lead.findMany({
            where: {
              ...(agencyId ? { agencyId } : {}),
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { company: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          }),

      // Team members (only for non-members)
      isMember
        ? Promise.resolve([])
        : prisma.user.findMany({
            where: {
              ...(agencyId ? { agencyId } : {}),
              isActive: true,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
            take: 5,
            orderBy: { name: "asc" },
          }),
    ]);

    // Format response
    return NextResponse.json({
      clients,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        serviceType: p.serviceType,
        clientName: p.client?.name || null,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        priority: t.priority,
        clientName: t.client?.name || null,
        clientId: t.client?.id || null,
      })),
      notes,
      leads,
      team,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
