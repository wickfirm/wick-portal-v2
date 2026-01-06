import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { itemType, isRequired, autoCreateTask, taskName, taskPriority, name, description } = await req.json();

    const updateData: any = {};
    
    if (itemType !== undefined) updateData.itemType = itemType;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (autoCreateTask !== undefined) updateData.autoCreateTask = autoCreateTask;
    if (taskName !== undefined) updateData.taskName = taskName;
    if (taskPriority !== undefined) updateData.taskPriority = taskPriority;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const item = await prisma.onboardingTemplateItem.update({
      where: { id: params.itemId },
      data: updateData,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update template item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.onboardingTemplateItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete template item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
