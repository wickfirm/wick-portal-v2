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
      select: { id: true, agencyId: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

    // Get project filter using helper function
    const projectFilter = await getProjectFilterForUser(
      currentUser.id,
      currentUser.role,
      currentUser.agencyId
    );

    // Fetch projects with only needed fields
    const projects = await prisma.project.findMany({
      where: projectFilter,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
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
    });

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
