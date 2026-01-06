import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";
import MetricsChart, { BarChart, MultiLineChart } from "@/components/MetricsChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const [
    totalClients,
    activeClients,
    totalProjects,
    completedProjects,
    inProgressProjects,
    totalTasks,
    completedTasks,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.clientTask.count(),
    prisma.clientTask.count({ where: { status: "COMPLETED" } }),
  ]);

  const clientsByStatus = await prisma.client.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const projectsByType = await prisma.project.groupBy({
    by: ["serviceType"],
    _count: { serviceType: true },
  });

  const projectsByStatus = await prisma.project.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const allMetrics = await prisma.clientMetrics.findMany({
    orderBy: { month: "asc" },
  });

  const metricsByMonth: Record<string, { sessions: number; clicks: number; spend: number; count: number }> = {};
  
  allMetrics.forEach(function(m) {
    const monthKey = new Date(m.month).toISOString().slice(0, 7);
    if (!metricsByMonth[monthKey]) {
      metricsByMonth[monthKey] = { sessions: 0, clicks: 0, spend: 0, count: 0 };
    }
    metricsByMonth[monthKey].sessions += Number(m.gaSessions) || 0;
    metricsByMonth[monthKey].clicks += Number(m.gscClicks) || 0;
    metricsByMonth[monthKey].spend += (Number(m.metaSpend) || 0) + (Number(m.googleAdsSpend) || 0);
    metricsByMonth[monthKey].count += 1;
  });

  const sortedMonths = Object.keys(metricsByMonth).sort().slice(-12);

  const sessionsData = sortedMonths.map(function(monthKey) {
    return {
      label: new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short" }),
      value: metricsByMonth[monthKey].sessions,
    };
  });

  const clicksData = sortedMonths.map(function(monthKey) {
    return {
      label: new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short" }),
      value: metricsByMonth[monthKey].clicks,
    };
  });

  const spendData = sortedMonths.slice(-6).map(function(monthKey) {
    return {
      label: new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short" }),
      value: metricsByMonth[monthKey].spend,
    };
  });

  const trafficDatasets = [
    {
      label: "Sessions",
      color: theme.colors.info,
      data: sessionsData,
    },
    {
      label: "Clicks",
      color: theme.colors.success,
      data: clicksData,
    },
  ];

  const projectStatusData = projectsByStatus.map(function(item) {
    return {
      label: item.status.replace("_", " ").slice(0, 8),
      value: item._count.status,
    };
  });

  const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalSessions = sortedMonths.reduce(function(sum, key) { return sum + metricsByMonth[key].sessions; }, 0);
  const totalClicks = sortedMonths.reduce(function(sum, key) { return sum + metricsByMonth[key].clicks; }, 0);
  const totalSpend = sortedMonths.reduce(function(sum, key) { return sum + metricsByMonth[key].spend; }, 0);

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Analytics</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Overview of your agency performance across all clients</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.primary, fontWeight: 600 }}>
                C
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalClients}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Clients</div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>{activeClients} active</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.infoBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.info, fontWeight: 600 }}>
                P
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalProjects}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Projects</div>
            <div style={{ fontSize: 12, color: theme.colors.info, marginTop: 4 }}>{inProgressProjects} in progress</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.success, fontWeight: 600 }}>
                %
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{completionRate}%</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Project Completion</div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>{completedProjects} completed</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.warningBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.warning, fontWeight: 600 }}>
                T
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{taskCompletionRate}%</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Task Completion</div>
            <div style={{ fontSize: 12, color: theme.colors.warning, marginTop: 4 }}>{completedTasks}/{totalTasks} tasks</div>
          </div>
        </div>

        {sortedMonths.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Sessions (All Clients)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.info }}>{totalSessions.toLocaleString()}</div>
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Organic Clicks</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.success }}>{totalClicks.toLocaleString()}</div>
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Ad Spend Managed</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.primary }}>${totalSpend.toLocaleString()}</div>
            </div>
          </div>
        )}

        {sessionsData.length > 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Sessions Trend (All Clients)</h3>
              <MetricsChart data={sessionsData} color={theme.colors.info} height={180} />
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Organic Clicks Trend</h3>
              <MetricsChart data={clicksData} color={theme.colors.success} height={180} />
            </div>
          </div>
        )}

        {sessionsData.length > 1 && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Traffic Overview</h3>
            <MultiLineChart datasets={trafficDatasets} height={220} />
          </div>
        )}

        {spendData.length > 0 && spendData.some(function(d) { return d.value > 0; }) && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Ad Spend by Month (All Clients)</h3>
            <BarChart data={spendData} color={theme.colors.primary} height={180} format="currency" />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Clients by Status</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {clientsByStatus.map(function(item) {
                var percentage = totalClients > 0 ? Math.round((item._count.status / totalClients) * 100) : 0;
                var statusColor = item.status === "ACTIVE" ? theme.colors.success : item.status === "ONBOARDING" ? theme.colors.info : theme.colors.textMuted;
                return (
                  <div key={item.status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>{item.status}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textSecondary }}>{item._count.status} ({percentage}%)</span>
                    </div>
                    <div style={{ height: 8, background: theme.colors.bgTertiary, borderRadius: 4 }}>
                      <div style={{
                        height: "100%",
                        width: percentage + "%",
                        background: statusColor,
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Projects by Status</h3>
            {projectStatusData.length > 0 ? (
              <BarChart data={projectStatusData} color={theme.colors.info} height={160} />
            ) : (
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
                No projects yet
              </div>
            )}
          </div>
        </div>

        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Projects by Service Type</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {projectsByType.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>No projects yet</div>
            ) : (
              projectsByType.map(function(item) {
                var percentage = totalProjects > 0 ? Math.round((item._count.serviceType / totalProjects) * 100) : 0;
                return (
                  <div key={item.serviceType}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>{item.serviceType.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textSecondary }}>{item._count.serviceType} ({percentage}%)</span>
                    </div>
                    <div style={{ height: 8, background: theme.colors.bgTertiary, borderRadius: 4 }}>
                      <div style={{
                        height: "100%",
                        width: percentage + "%",
                        background: "linear-gradient(90deg, " + theme.colors.info + ", " + theme.colors.success + ")",
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
