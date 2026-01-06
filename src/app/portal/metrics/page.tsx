import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";
import { theme } from "@/lib/theme";
import MetricsChart, { BarChart, MultiLineChart } from "@/components/MetricsChart";

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

  const fmt = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toLocaleString(); };
  const fmtDec = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toFixed(2); };
  const fmtPct = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toFixed(2) + "%"; };
  const fmtCur = function(n: any) { return n === null || n === undefined ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  const latest = metrics[metrics.length - 1];
  const previous = metrics[metrics.length - 2];

  const getChange = function(current: any, prev: any) {
    if (!current || !prev) return null;
    var curr = Number(current) || 0;
    var p = Number(prev) || 0;
    if (p === 0) return null;
    return Math.round(((curr - p) / p) * 100);
  };

  const sessionsData = metrics.slice(-12).map(function(m) {
    return {
      label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
      value: Number(m.gaSessions) || 0,
    };
  });

  const clicksData = metrics.slice(-12).map(function(m) {
    return {
      label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
      value: Number(m.gscClicks) || 0,
    };
  });

  const adSpendData = metrics.slice(-6).map(function(m) {
    return {
      label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
      value: (Number(m.metaSpend) || 0) + (Number(m.googleAdsSpend) || 0),
    };
  });

  const trafficDatasets = [
    {
      label: "Sessions",
      color: theme.colors.info,
      data: metrics.slice(-12).map(function(m) {
        return {
          label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
          value: Number(m.gaSessions) || 0,
        };
      }),
    },
    {
      label: "Users",
      color: theme.colors.success,
      data: metrics.slice(-12).map(function(m) {
        return {
          label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
          value: Number(m.gaUsers) || 0,
        };
      }),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Performance Metrics</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Track your digital marketing performance.</p>
        </div>

        {metrics.length === 0 ? (
          <div style={{ background: theme.colors.bgSecondary, padding: 64, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>M</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No metrics recorded yet</div>
            <div style={{ color: theme.colors.textSecondary }}>Performance data will appear here once tracking begins.</div>
          </div>
        ) : (
          <div>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Sessions</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmt(latest?.gaSessions)}</div>
                {getChange(latest?.gaSessions, previous?.gaSessions) !== null && (
                  <div style={{ fontSize: 12, color: getChange(latest?.gaSessions, previous?.gaSessions)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
                    {getChange(latest?.gaSessions, previous?.gaSessions)! >= 0 ? "+" : ""}{getChange(latest?.gaSessions, previous?.gaSessions)}% vs last month
                  </div>
                )}
              </div>
              <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Organic Clicks</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmt(latest?.gscClicks)}</div>
                {getChange(latest?.gscClicks, previous?.gscClicks) !== null && (
                  <div style={{ fontSize: 12, color: getChange(latest?.gscClicks, previous?.gscClicks)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
                    {getChange(latest?.gscClicks, previous?.gscClicks)! >= 0 ? "+" : ""}{getChange(latest?.gscClicks, previous?.gscClicks)}% vs last month
                  </div>
                )}
              </div>
              <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Ad Spend</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {fmtCur((Number(latest?.metaSpend) || 0) + (Number(latest?.googleAdsSpend) || 0))}
                </div>
              </div>
              <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Avg Position</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmtDec(latest?.gscAvgPosition)}</div>
                {getChange(previous?.gscAvgPosition, latest?.gscAvgPosition) !== null && (
                  <div style={{ fontSize: 12, color: getChange(previous?.gscAvgPosition, latest?.gscAvgPosition)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
                    {getChange(previous?.gscAvgPosition, latest?.gscAvgPosition)! >= 0 ? "+" : ""}{getChange(previous?.gscAvgPosition, latest?.gscAvgPosition)}% improvement
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Sessions Trend</h3>
                <MetricsChart data={sessionsData} color={theme.colors.info} height={180} />
              </div>
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Organic Clicks Trend</h3>
                <MetricsChart data={clicksData} color={theme.colors.success} height={180} />
              </div>
            </div>

            {/* Traffic Overview */}
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Traffic Overview</h3>
              <MultiLineChart datasets={trafficDatasets} height={220} />
            </div>

            {/* Ad Spend */}
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Ad Spend by Month</h3>
              <BarChart data={adSpendData} color={theme.colors.primary} height={180} formatValue={function(v) { return "$" + v.toLocaleString(); }} />
            </div>

            {/* Data Tables */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Analytics Table */}
              <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Google Analytics</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme.colors.bgPrimary }}>
                        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Month</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Sessions</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Users</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Bounce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(-6).reverse().map(function(m) {
                        return (
                          <tr key={m.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                            <td style={{ padding: 12, fontWeight: 500, fontSize: 13 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                            <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmt(m.gaSessions)}</td>
                            <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmt(m.gaUsers)}</td>
                            <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmtPct(m.gaBounceRate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Search Console Table */}
              <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Search Console</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme.colors.bgPrimary }}>
                        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Month</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Clicks</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Impr.</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(-6).reverse().map(function(m) {
                        return (
                          <tr key={m.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                            <td style={{ padding: 12, fontWeight: 500, fontSize: 13 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                            <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmt(m.gscClicks)}</td>
                            <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmt(m.gscImpressions)}</td>
                            <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmtPct(m.gscCtr)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
