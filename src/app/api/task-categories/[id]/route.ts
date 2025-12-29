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
    if (data.order !== undefined) updateData.order = data.order;

    const category = await prisma.taskCategory.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = await prisma.taskCategory.findUnique({ where: { id: params.id } });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete category (tasks will have categoryId set to null due to onDelete: SetNull)
  await prisma.taskCategory.delete({ where: { id: params.id } });

  // Reorder remaining categories
  await prisma.taskCategory.updateMany({
    where: { order: { gt: category.order } },
    data: { order: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
