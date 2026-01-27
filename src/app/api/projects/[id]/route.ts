import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { 
      client: { select: { id: true, name: true } },
      stages: { orderBy: { order: "asc" } },
      tasks: {
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      resources: {
        select: {
          id: true,
          name: true,
          url: true,
          type: true,
        },
        orderBy: { order: "asc" },
      },
      assignments: {
        select: {
          id: true,
          role: true,
          hoursAllocated: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.billRate !== undefined) updateData.billRate = data.billRate !== null ? parseFloat(data.billRate) : null;

    // Finance Module fields
    if (data.pricingModel !== undefined) updateData.pricingModel = data.pricingModel;
    if (data.fixedFeeAmount !== undefined) updateData.fixedFeeAmount = data.fixedFeeAmount ? parseFloat(data.fixedFeeAmount) : null;

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if this is a default project
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { isDefault: true, name: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.isDefault) {
    return NextResponse.json(
      { error: "Cannot delete Admin/Operations project. This is a system-required project." },
      { status: 403 }
    );
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
