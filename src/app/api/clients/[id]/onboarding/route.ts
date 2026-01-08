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
    orderBy: [{ serviceType: "asc" }, { order: "asc" }],
  });

  // Group by service type
  const grouped = items.reduce((acc: Record<string, any[]>, item) => {
    if (!acc[item.serviceType]) {
      acc[item.serviceType] = [];
    }
    acc[item.serviceType].push(item);
    return acc;
  }, {});

  // Calculate progress
  const totalItems = items.length;
  const completedItems = items.filter(i => i.isCompleted).length;
  const requiredItems = items.filter(i => i.isRequired);
  const completedRequired = requiredItems.filter(i => i.isCompleted).length;

  return NextResponse.json({
    items,
    grouped,
    progress: {
      total: totalItems,
      completed: completedItems,
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      requiredTotal: requiredItems.length,
      requiredCompleted: completedRequired,
      requiredPercentage: requiredItems.length > 0 ? Math.round((completedRequired / requiredItems.length) * 100) : 100,
    },
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const clientId = params.id;
    
    // Handle empty body gracefully
    let body: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // Empty body is fine, use legacy logic
    }
    
    // If serviceTypes provided, use new initialization logic
    if (body.serviceTypes && Array.isArray(body.serviceTypes)) {
      const serviceTypes = body.serviceTypes;
      const allServiceTypes = ["GENERAL", ...serviceTypes.filter((s: string) => s !== "GENERAL")];

      // Get templates for selected services
      const templates = await prisma.onboardingTemplate.findMany({
        where: {
          serviceType: { in: allServiceTypes },
          isActive: true,
        },
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      });

      // Delete existing onboarding items for fresh start
      await prisma.onboardingItem.deleteMany({
        where: { clientId },
      });

      // Create onboarding items from templates
      let globalOrder = 0;
      for (const template of templates) {
        for (const templateItem of template.items) {
          globalOrder++;
          await prisma.onboardingItem.create({
            data: {
              clientId,
              name: templateItem.name,
              description: templateItem.description,
              serviceType: template.serviceType,
              itemType: templateItem.itemType,
              isRequired: templateItem.isRequired,
              order: globalOrder,
            },
          });
        }
      }

      // Update client status to ONBOARDING
      await prisma.client.update({
        where: { id: clientId },
        data: { status: "ONBOARDING" },
      });
    } else {
      // Legacy logic - get from projects
      const projects = await prisma.project.findMany({
        where: { clientId },
        select: { serviceType: true },
      });

      const serviceTypesSet = new Set(projects.map(p => p.serviceType));
      const serviceTypes: string[] = [];
      serviceTypesSet.forEach(s => serviceTypes.push(s));

      const existingItems = await prisma.onboardingItem.findMany({
        where: { clientId },
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
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: [{ serviceType: "asc" }, { order: "asc" }],
      });

      // Create items from template items
      let currentOrder = 0;
      const maxOrderItem = await prisma.onboardingItem.findFirst({
        where: { clientId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      currentOrder = maxOrderItem?.order ?? 0;

      for (const template of templates) {
        for (const templateItem of template.items) {
          if (!existingNames.has(templateItem.name)) {
            currentOrder++;
            await prisma.onboardingItem.create({
              data: {
                clientId,
                name: templateItem.name,
                description: templateItem.description,
                serviceType: template.serviceType,
                itemType: templateItem.itemType,
                isRequired: templateItem.isRequired,
                order: currentOrder,
              },
            });
          }
        }
      }
    }

    const items = await prisma.onboardingItem.findMany({
      where: { clientId },
      orderBy: [{ serviceType: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to initialize onboarding:", error);
    return NextResponse.json({ error: "Failed to initialize onboarding" }, { status: 500 });
  }
}


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const clientId = params.id;
    const { itemId, isCompleted, inputValue, fileUrl, notes, resourceUrl, resourceLabel } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    // Verify item belongs to this client
    const existingItem = await prisma.onboardingItem.findFirst({
      where: { id: itemId, clientId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (typeof isCompleted === "boolean") {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
      updateData.completedBy = isCompleted ? (session.user?.name || session.user?.email) : null;
    }

    if (inputValue !== undefined) {
      updateData.inputValue = inputValue;
    }

    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (resourceUrl !== undefined) {
      updateData.resourceUrl = resourceUrl;
    }

    if (resourceLabel !== undefined) {
      updateData.resourceLabel = resourceLabel;
    }

    const updatedItem = await prisma.onboardingItem.update({
      where: { id: itemId },
      data: updateData,
    });

    // Check if all required items are completed
    const allItems = await prisma.onboardingItem.findMany({
      where: { clientId },
    });

    const requiredItems = allItems.filter(i => i.isRequired);
    const allRequiredCompleted = requiredItems.length > 0 && requiredItems.every(i => i.isCompleted);
    const allCompleted = allItems.length > 0 && allItems.every(i => i.isCompleted);

    // If all required items completed, update client status to ACTIVE
    if (allRequiredCompleted) {
      await prisma.client.update({
        where: { id: clientId },
        data: { status: "ACTIVE" },
      });
    }

    return NextResponse.json({
      item: updatedItem,
      allRequiredCompleted,
      allCompleted,
    });
  } catch (error) {
    console.error("Failed to update onboarding item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
