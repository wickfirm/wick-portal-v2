import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.onboardingItem.findMany({
    where: { clientId: params.id },
    orderBy: [{ serviceType: "asc" }, { order: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projects = await prisma.project.findMany({
      where: { clientId: params.id },
      select: { serviceType: true },
    });

    const serviceTypesSet = new Set(projects.map(p => p.serviceType));
    const serviceTypes: string[] = [];
    serviceTypesSet.forEach(s => serviceTypes.push(s));

    const existingItems = await prisma.onboardingItem.findMany({
      where: { clientId: params.id },
      select: { name: true },
    });
    const existingNames = new Set(existingItems.map(i => i.name));

    const templates = await prisma.onboardingTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { serviceType: "GENERAL" },
          { serviceType: { in: serviceTypes } },
        ],
      },
      orderBy: [{ serviceType: "asc" }, { order: "asc" }],
    });

    const newTemplates = templates.filter(t => !existingNames.has(t.name));

    if (newTemplates.length > 0) {
      const maxOrderItem = await prisma.onboardingItem.findFirst({
        where: { clientId: params.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      let currentOrder = maxOrderItem?.order ?? 0;

      await prisma.onboardingItem.createMany({
        data: newTemplates.map((t) => ({
          clientId: params.id,
          name: t.name,
          description: t.description,
          serviceType: t.serviceType,
          order: ++currentOrder,
          isCompleted: false,
        })),
      });
    }

    const items = await prisma.onboardingItem.findMany({
      where: { clientId: params.id },
      orderBy: [{ serviceType: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to initialize onboarding:", error);
    return NextResponse.json({ error: "Failed to initialize onboarding" }, { status: 500 });
  }
}
