import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; keyDateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    const keyDate = await prisma.clientKeyDate.update({
      where: { id: params.keyDateId },
      data: {
        name: data.name,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isRecurring: data.isRecurring,
        category: data.category,
        color: data.color,
        notes: data.notes,
      },
    });

    return NextResponse.json(keyDate);
  } catch (error) {
    console.error("Error updating key date:", error);
    return NextResponse.json({ error: "Failed to update key date" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; keyDateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.clientKeyDate.delete({
      where: { id: params.keyDateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting key date:", error);
    return NextResponse.json({ error: "Failed to delete key date" }, { status: 500 });
  }
}
