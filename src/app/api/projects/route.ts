import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

  // Get clientId from query params (used by TimerWidget)
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  // Build where clause based on role
  let where: any = {};

  // If clientId is specified, filter by that
  if (clientId) {
    where.clientId = clientId;
  }

  // Apply role-based filtering
  if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
    // ADMINs see all projects in their agency
    if (currentUser.agencyId) {
      const agencyTeamMembers = await prisma.user.findMany({
        where: { agencyId: currentUser.agencyId },
        select: { id: true },
      });
      const teamMemberIds = agencyTeamMembers.map(u => u.id);
      
      where.client = {
        teamMembers: {
          some: {
            userId: { in: teamMemberIds }
          }
        }
      };
    }
  } else if (currentUser.role === "MEMBER") {
    // MEMBERs see only projects for their assigned clients
    const assignments = await prisma.clientTeamMember.findMany({
      where: { userId: currentUser.id },
      select: { clientId: true },
    });
    const clientIds = assignments.map(a => a.clientId);
    
    // If clientId specified, make sure it's in their assigned clients
    if (clientId) {
      if (!clientIds.includes(clientId)) {
        return NextResponse.json([]); // Not assigned to this client
      }
    } else {
      where.clientId = { in: clientIds };
    }
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
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
