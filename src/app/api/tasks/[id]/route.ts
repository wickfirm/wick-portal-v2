import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    const updateData: any = { updatedAt: new Date() };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.nextSteps !== undefined) updateData.nextSteps = data.nextSteps;
    if (data.externalLink !== undefined) updateData.externalLink = data.externalLink;
    if (data.externalLinkLabel !== undefined) updateData.externalLinkLabel = data.externalLinkLabel;
    if (data.internalLink !== undefined) updateData.internalLink = data.internalLink;
    if (data.internalLinkLabel !== undefined) updateData.internalLinkLabel = data.internalLinkLabel;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null;
    if (data.order !== undefined) updateData.order = data.order;

    const task = await prisma.clientTask.update({
      where: { id: params.id },
      data: updateData,
      include: { category: true, assignee: { select: { id: true, name: true } } },
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.clientTask.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
