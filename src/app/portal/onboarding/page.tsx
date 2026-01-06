import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";
import PortalOnboardingView from "@/components/PortalOnboardingView";
import { theme } from "@/lib/theme";

export default async function PortalOnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { client: true },
  });

  if (!dbUser?.client) {
    redirect("/portal");
  }

  const client = dbUser.client;

  const onboardingItems = await prisma.onboardingItem.findMany({
    where: { clientId: client.id },
    orderBy: [{ serviceType: "asc" }, { order: "asc" }],
  });

  // Group items by service type
  const groupedItems = onboardingItems.reduce((acc: Record<string, any[]>, item) => {
    if (!acc[item.serviceType]) {
      acc[item.serviceType] = [];
    }
    acc[item.serviceType].push({
      id: item.id,
      name: item.name,
      description: item.description,
      serviceType: item.serviceType,
      itemType: item.itemType,
      order: item.order,
      isRequired: item.isRequired,
      isCompleted: item.isCompleted,
      completedAt: item.completedAt?.toISOString() || null,
      completedBy: item.completedBy,
      inputValue: item.inputValue,
      notes: item.notes,
    });
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
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <PortalOnboardingView 
          client={{ id: client.id, name: client.name, status: client.status }}
          groupedItems={groupedItems}
          progress={progress}
        />
      </main>
    </div>
  );
}
