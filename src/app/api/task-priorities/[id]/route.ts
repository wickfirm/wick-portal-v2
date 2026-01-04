import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color, isDefault } = await req.json();
  const updateData: any = {};

  if (name !== undefined) updateData.name = name.toUpperCase().replace(/\s+/g, "_");
  if (color !== undefined) updateData.color = color;
  if (isDefault !== undefined) {
    if (isDefault) {
      await prisma.taskPriorityOption.updateMany({ data: { isDefault: false } });
    }
    updateData.isDefault = isDefault;
  }

  const priority = await prisma.taskPriorityOption.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(priority);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.taskPriorityOption.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
