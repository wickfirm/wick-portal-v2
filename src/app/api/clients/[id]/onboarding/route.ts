import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.onboardingItem.findMany({
    where: { clientId: params.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check if client already has onboarding items
    const existingItems = await prisma.onboardingItem.findFirst({
      where: { clientId: params.id },
    });

    if (existingItems) {
      return NextResponse.json({ error: "Onboarding already initialized" }, { status: 400 });
    }

    // Get all templates
    const templates = await prisma.onboardingTemplate.findMany({
      orderBy: { order: "asc" },
    });

    // Create onboarding items for this client
    await prisma.onboardingItem.createMany({
      data: templates.map(t => ({
        clientId: params.id,
        name: t.name,
        description: t.description,
        order: t.order,
        isCompleted: false,
      })),
    });

    const items = await prisma.onboardingItem.findMany({
      where: { clientId: params.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to initialize onboarding" }, { status: 500 });
  }
}
