import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getProjectFilterForUser } from "@/lib/project-assignments";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  
  // Get current user with role
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, role: true, agencyId: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get clientId from query params (used by TimerWidget/Timesheet)
  // Support both single clientId and multiple clientId params
  const { searchParams } = new URL(request.url);
  const clientIds = searchParams.getAll('clientId');

  // Get base project filter
  let where = await getProjectFilterForUser(
    currentUser.id,
    currentUser.role,
    currentUser.agencyId
  );

  // If clientIds are specified, add them to the filter
  if (clientIds.length === 1) {
    where = { ...where, clientId: clientIds[0] };
  } else if (clientIds.length > 1) {
    where = { ...where, clientId: { in: clientIds } };
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: [
      { pinned: "desc" },
      { name: "asc" },
    ],
    include: { client: true, stages: true },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        serviceType: data.serviceType,
        status: data.status || "NOT_STARTED",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget || null,
      },
    });

    // Fetch stage templates for this service type
    const templates = await prisma.stageTemplate.findMany({
      where: { serviceType: data.serviceType },
      orderBy: { order: "asc" },
    });

    // Create project stages from templates
    if (templates.length > 0) {
      await prisma.projectStage.createMany({
        data: templates.map((t) => ({
          projectId: project.id,
          name: t.name,
          order: t.order,
          isCompleted: false,
        })),
      });
    }

    // Return project with stages
    const projectWithStages = await prisma.project.findUnique({
      where: { id: project.id },
      include: { stages: true, client: true },
    });

    return NextResponse.json(projectWithStages);
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
