import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.clientTask.findUnique({
    where: { id: params.taskId },
    include: { category: true },
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json(task);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.nextSteps !== undefined) updateData.nextSteps = data.nextSteps || null;
    if (data.order !== undefined) updateData.order = data.order;

    updateData.updatedAt = new Date();

    const task = await prisma.clientTask.update({
      where: { id: params.taskId },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.clientTask.delete({ where: { id: params.taskId } });
  return NextResponse.json({ success: true });
}
