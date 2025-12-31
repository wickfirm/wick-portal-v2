import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";

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

  const fmt = (n: any) => n === null || n === undefined ? "—" : Number(n).toLocaleString();
  const fmtDec = (n: any) => n === null || n === undefined ? "—" : Number(n).toFixed(2);
  const fmtPct = (n: any) => n === null || n === undefined ? "—" : Number(n).toFixed(2) + "%";
  const fmtCur = (n: any) => n === null || n === undefined ? "—" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const latest = metrics[0];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Performance Metrics</h1>
          <p style={{ color: "#5f6368", fontSize: 15 }}>Track your digital marketing performance.</p>
        </div>

        {metrics.length === 0 ? (
          <div style={{ background: "white", padding: 64, borderRadius: 12, border: "1px solid #e8eaed", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>No metrics recorded yet</div>
            <div style={{ color: "#5f6368" }}>Performance data will appear here once tracking begins.</div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", borderLeft: "4px solid #4285f4" }}>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Sessions</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1a1a" }}>{fmt(latest.gaSessions)}</div>
                <div style={{ fontSize: 12, color: "#4285f4" }}>Google Analytics</div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", borderLeft: "4px solid #34a853" }}>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>GSC Clicks</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1a1a" }}>{fmt(latest.gscClicks)}</div>
                <div style={{ fontSize: 12, color: "#34a853" }}>Search Console</div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", borderLeft: "4px solid #e85a4f" }}>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Total Ad Spend</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1a1a" }}>
                  {fmtCur((Number(latest.metaSpend) || 0) + (Number(latest.googleAdsSpend) || 0) + (Number(latest.linkedinAdsSpend) || 0) + (Number(latest.tiktokAdsSpend) || 0))}
                </div>
                <div style={{ fontSize: 12, color: "#e85a4f" }}>All Platforms</div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", borderLeft: "4px solid #f9ab00" }}>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Total Hours</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1a1a" }}>
                  {fmtDec((Number(latest.hoursSeo) || 0) + (Number(latest.hoursContent) || 0) + (Number(latest.hoursPaidMedia) || 0) + (Number(latest.hoursSocial) || 0) + (Number(latest.hoursDesign) || 0) + (Number(latest.hoursMaintenance) || 0) + (Number(latest.hoursStrategy) || 0))}
                </div>
                <div style={{ fontSize: 12, color: "#f9ab00" }}>This Month</div>
              </div>
            </div>

            {/* History Tables */}
            <div style={{ display: "grid", gap: 24 }}>
              {/* Analytics */}
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(66, 133, 244, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    📊
                  </div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Google Analytics</h2>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa" }}>
                        <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Month</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Sessions</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Users</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Pageviews</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Bounce Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(0, 6).map((m) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
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
              <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(52, 168, 83, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    🔍
                  </div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Search Console</h2>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa" }}>
                        <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Month</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Clicks</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Impressions</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>CTR</th>
                        <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(0, 6).map((m) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
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
