import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import ClientOnboardingView from "@/components/ClientOnboardingView";
import { theme } from "@/lib/theme";

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

  const serializedItems = onboardingItems.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    order: item.order,
    isCompleted: item.isCompleted,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
  }));

  const serializedTemplates = templates.map(template => ({
    id: template.id,
    name: template.name,
    items: template.items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      order: item.order,
    })),
  }));

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/clients/${params.id}`} style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to {client.name}
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
            Onboarding Checklist
          </h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            Manage onboarding tasks for {client.name}
          </p>
        </div>

        <ClientOnboardingView
          clientId={params.id}
          initialItems={serializedItems}
          templates={serializedTemplates}
        />
      </main>
    </div>
  );
}
