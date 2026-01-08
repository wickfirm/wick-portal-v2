import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const where: any = {};
  if (clientId) {
    where.clientId = clientId;
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, nickname: true } },
      stages: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    // Create project
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        clientId: data.clientId,
        serviceType: data.serviceType,
        status: data.status || "DRAFT",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget ? parseFloat(data.budget) : null,
      },
      include: {
        client: { select: { id: true, name: true } },
        stages: true,
      },
    });

    // If a template ID is provided, create stages from template
    if (data.templateId) {
      const template = await prisma.stageTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (template && template.stages.length > 0) {
        await prisma.projectStage.createMany({
          data: template.stages.map((name: string, index: number) => ({
            projectId: project.id,
            name,
            order: index,
            isCompleted: false,
          })),
        });
      }
    }

    // Fetch updated project with stages
    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        client: { select: { id: true, name: true } },
        stages: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
