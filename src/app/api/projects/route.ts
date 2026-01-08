import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
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
