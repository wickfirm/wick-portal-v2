import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, color, isDefault } = await req.json();
  const updateData: any = {};

  if (name !== undefined) updateData.name = name.toUpperCase().replace(/\s+/g, "_");
  if (color !== undefined) updateData.color = color;
  if (isDefault !== undefined) {
    if (isDefault) {
      await prisma.taskStatusOption.updateMany({ data: { isDefault: false } });
    }
    updateData.isDefault = isDefault;
  }

  const status = await prisma.taskStatusOption.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(status);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.taskStatusOption.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
