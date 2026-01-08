import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ClientOnboardingView from "@/components/ClientOnboardingView";

export const dynamic = "force-dynamic";

export default async function ClientOnboardingPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { id: params.id },
  });

  if (!client) {
    return <div style={{ padding: 48, textAlign: "center" }}>Client not found</div>;
  }

  const onboardingItems = await prisma.onboardingItem.findMany({
    where: { clientId: params.id },
    orderBy: { order: "asc" },
  });

  const templates = await prisma.onboardingTemplate.findMany({
    include: {
      items: { orderBy: { order: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  // Group items by a default "GENERAL" service type since the model doesn't have serviceType
  const groupedItems: Record<string, any[]> = {};
  
  onboardingItems.forEach(item => {
    const serviceType = "GENERAL";
    if (!groupedItems[serviceType]) {
      groupedItems[serviceType] = [];
    }
    groupedItems[serviceType].push({
      id: item.id,
      name: item.title,
      description: item.description,
      serviceType: "GENERAL",
      itemType: "CHECKBOX",
      order: item.order,
      isRequired: false,
      isCompleted: item.isCompleted,
      completedAt: item.completedAt ? item.completedAt.toISOString() : null,
      completedBy: null,
      inputValue: null,
      fileUrl: null,
      notes: null,
      resourceUrl: null,
      resourceLabel: null,
    });
  });

  const totalItems = onboardingItems.length;
  const completedItems = onboardingItems.filter(i => i.isCompleted).length;

  const progress = {
    total: totalItems,
    completed: completedItems,
    percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    requiredTotal: 0,
    requiredCompleted: 0,
    requiredPercentage: 100,
  };

  const serializedTemplates = templates.map(template => ({
    id: template.id,
    name: template.name,
    description: null,
    serviceType: "GENERAL",
    items: template.items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      order: item.order,
      isRequired: false,
    })),
  }));

  return (
    <ClientOnboardingView
      client={{
        id: client.id,
        name: client.name,
        status: client.status,
      }}
      groupedItems={groupedItems}
      progress={progress}
      templates={serializedTemplates}
      hasItems={onboardingItems.length > 0}
    />
  );
}
