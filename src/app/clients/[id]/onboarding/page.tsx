import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ClientOnboardingView from "@/components/ClientOnboardingView";

export default async function ClientOnboardingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { id: params.id },
  });

  if (!client) redirect("/clients");

  const onboardingItems = await prisma.onboardingItem.findMany({
    where: { clientId: params.id },
    orderBy: [{ serviceType: "asc" }, { order: "asc" }],
  });

  const templates = await prisma.onboardingTemplate.findMany({
    where: { isActive: true },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  // Group items by service type
  const groupedItems = onboardingItems.reduce((acc: Record<string, any[]>, item) => {
    if (!acc[item.serviceType]) {
      acc[item.serviceType] = [];
    }
    acc[item.serviceType].push(item);
    return acc;
  }, {});

  // Calculate progress
  const totalItems = onboardingItems.length;
  const completedItems = onboardingItems.filter(i => i.isCompleted).length;
  const requiredItems = onboardingItems.filter(i => i.isRequired);
  const completedRequired = requiredItems.filter(i => i.isCompleted).length;

  const progress = {
    total: totalItems,
    completed: completedItems,
    percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    requiredTotal: requiredItems.length,
    requiredCompleted: completedRequired,
    requiredPercentage: requiredItems.length > 0 ? Math.round((completedRequired / requiredItems.length) * 100) : 100,
  };

  return (
    <ClientOnboardingView 
      client={client}
      groupedItems={groupedItems}
      progress={progress}
      templates={templates}
      hasItems={onboardingItems.length > 0}
    />
  );
}
