import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isCompleted !== undefined) {
      updateData.isCompleted = data.isCompleted;
      updateData.completedAt = data.isCompleted ? new Date() : null;
    }
    
    const stage = await prisma.projectStage.update({
      where: { id: params.id },
      data: updateData,
    });
    
    return NextResponse.json(stage);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get the stage to find its project and order
    const stage = await prisma.projectStage.findUnique({ where: { id: params.id } });
    if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Delete the stage
    await prisma.projectStage.delete({ where: { id: params.id } });

    // Reorder remaining stages
    await prisma.projectStage.updateMany({
      where: { projectId: stage.projectId, order: { gt: stage.order } },
      data: { order: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete stage" }, { status: 500 });
  }
}
