import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";
import { theme } from "@/lib/theme";

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
    orderBy: { month: "desc" },
  });

  const fmt = (n: any) => n === null || n === undefined ? "-" : Number(n).toLocaleString();
  const fmtDec = (n: any) => n === null || n === undefined ? "-" : Number(n).toFixed(2);
  const fmtPct = (n: any) => n === null || n === undefined ? "-" : Number(n).toFixed(2) + "%";
  const fmtCur = (n: any) => n === null || n === undefined ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const latest = metrics[0];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader />

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
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, borderLeft: "4px solid " + theme.colors.info }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Sessions</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary }}>{fmt(latest.gaSessions)}</div>
                <div style={{ fontSize: 12, color: theme.colors.info }}>Google Analytics</div>
              </div>
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, borderLeft: "4px solid " + theme.colors.success }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>GSC Clicks</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary }}>{fmt(latest.gscClicks)}</div>
                <div style={{ fontSize: 12, color: theme.colors.success }}>Search Console</div>
              </div>
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, borderLeft: "4px solid " + theme.colors.primary }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Ad Spend</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {fmtCur((Number(latest.metaSpend) || 0) + (Number(latest.googleAdsSpend) || 0) + (Number(latest.linkedinAdsSpend) || 0) + (Number(latest.tiktokAdsSpend) || 0))}
                </div>
                <div style={{ fontSize: 12, color: theme.colors.primary }}>All Platforms</div>
              </div>
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, borderLeft: "4px solid " + theme.colors.warning }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Hours</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {fmtDec((Number(latest.hoursSeo) || 0) + (Number(latest.hoursContent) || 0) + (Number(latest.hoursPaidMedia) || 0) + (Number(latest.hoursSocial) || 0) + (Number(latest.hoursDesign) || 0) + (Number(latest.hoursMaintenance) || 0) + (Number(latest.hoursStrategy) || 0))}
                </div>
                <div style={{ fontSize: 12, color: theme.colors.warning }}>This Month</div>
              </div>
            </div>

            {/* History Tables */}
            <div style={{ display: "grid", gap: 24 }}>
              {/* Analytics */}
              <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: theme.borderRadius.md, background: theme.colors.infoBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: theme.colors.info, fontWeight: 600 }}>
                    A
                  </div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Google Analytics</h2>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme.colors.bgPrimary }}>
                        <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Month</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Sessions</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Users</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Pageviews</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Bounce Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(0, 6).map((m) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                          <td style={{ padding: 14, fontWeight: 500 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>{fmt(m.gaSessions)}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>{fmt(m.gaUsers)}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>{fmt(m.gaPageviews)}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>{fmtPct(m.gaBounceRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Search Console */}
              <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: theme.borderRadius.md, background: theme.colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: theme.colors.success, fontWeight: 600 }}>
                    S
                  </div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Search Console</h2>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme.colors.bgPrimary }}>
                        <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Month</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Clicks</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Impressions</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>CTR</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(0, 6).map((m) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                          <td style={{ padding: 14, fontWeight: 500 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>{fmt(m.gscClicks)}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>{fmt(m.gscImpressions)}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>{fmtPct(m.gscCtr)}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>{fmtDec(m.gscAvgPosition)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
