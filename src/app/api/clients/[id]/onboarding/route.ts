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
    // Get client's projects to determine which service types to include
    const projects = await prisma.project.findMany({
      where: { clientId: params.id },
      select: { serviceType: true },
    });

    // Get unique service types from projects
    const serviceTypes = [...new Set(projects.map(p => p.serviceType))];

    // Get existing onboarding item names for this client (to avoid duplicates)
    const existingItems = await prisma.onboardingItem.findMany({
      where: { clientId: params.id },
      select: { name: true },
    });
    const existingNames = new Set(existingItems.map(i => i.name));

    // Get templates: GENERAL + service-specific (only active ones)
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

    // Filter out templates that already exist as items
    const newTemplates = templates.filter(t => !existingNames.has(t.name));

    if (newTemplates.length > 0) {
      // Get max order of existing items
      const maxOrder = existingItems.length > 0 
        ? await prisma.onboardingItem.findFirst({
            where: { clientId: params.id },
            orderBy: { order: "desc" },
            select: { order: true },
          })
        : null;

      let currentOrder = (maxOrder?.order ?? 0);

      // Create new onboarding items
      await prisma.onboardingItem.createMany({
        data: newTemplates.map((t) => ({
          clientId: params.id,
          name: t.name,
          description: t.description,
          order: ++currentOrder,
          isCompleted: false,
        })),
      });
    }

    // Return all items
    const items = await prisma.onboardingItem.findMany({
      where: { clientId: params.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to initialize onboarding:", error);
    return NextResponse.json({ error: "Failed to initialize onboarding" }, { status: 500 });
  }
}
