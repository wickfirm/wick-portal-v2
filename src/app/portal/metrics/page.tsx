import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";
import { theme } from "@/lib/theme";
import PortalMetricsDashboard from "@/components/PortalMetricsDashboard";

export const dynamic = "force-dynamic";

export default async function PortalMetricsPage() {
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

  const metrics = await prisma.clientMetrics.findMany({
    where: { clientId: dbUser.client.id },
    orderBy: { month: "asc" },
  });

  // Serialize dates for client component
  const serializedMetrics = metrics.map(function(m) {
    return {
      ...m,
      month: m.month.toISOString(),
    };
  });

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {metrics.length === 0 ? (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Performance Metrics</h1>
              <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Track your digital marketing performance.</p>
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 64, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>M</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No metrics recorded yet</div>
              <div style={{ color: theme.colors.textSecondary }}>Performance data will appear here once tracking begins.</div>
            </div>
          </div>
        ) : (
          <PortalMetricsDashboard metrics={serializedMetrics} />
        )}
      </main>
    </div>
  );
}
