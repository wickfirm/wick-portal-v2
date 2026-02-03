import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const keyDates = await prisma.clientKeyDate.findMany({
      where: { clientId: params.id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(keyDates);
  } catch (error) {
    console.error("Error fetching key dates:", error);
    return NextResponse.json({ error: "Failed to fetch key dates" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    const keyDate = await prisma.clientKeyDate.create({
      data: {
        clientId: params.id,
        name: data.name,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isRecurring: data.isRecurring ?? true,
        category: data.category || "HOLIDAY",
        color: data.color || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(keyDate);
  } catch (error) {
    console.error("Error creating key date:", error);
    return NextResponse.json({ error: "Failed to create key date" }, { status: 500 });
  }
}
