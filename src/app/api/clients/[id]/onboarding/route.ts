import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = params.id;

  const items = await prisma.onboardingItem.findMany({
    where: { clientId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = params.id;

  try {
    const data = await req.json();

    // Get max order
    const maxOrder = await prisma.onboardingItem.findFirst({
      where: { clientId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const item = await prisma.onboardingItem.create({
      data: {
        clientId,
        title: data.title,
        description: data.description || null,
        order: (maxOrder?.order ?? -1) + 1,
        isCompleted: false,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to create onboarding item:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
