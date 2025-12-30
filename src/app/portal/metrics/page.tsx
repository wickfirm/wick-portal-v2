import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortalMetricsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { client: true },
  });

  if (!dbUser?.client) redirect("/portal");

  const metrics = await prisma.clientMetrics.findMany({
    where: { clientId: dbUser.client.id },
    orderBy: { month: "desc" },
  });

  function formatNumber(n: number | null): string {
    if (n === null || n === undefined) return "-";
    return n.toLocaleString();
  }

  function formatDecimal(n: number | null, suffix = ""): string {
    if (n === null || n === undefined) return "-";
    return n.toFixed(2) + suffix;
  }

  function formatCurrency(n: number | null): string {
    if (n === null || n === undefined) return "-";
    return "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontWeight: "bold", fontSize: 20, color: "#333" }}>Wick Portal</span>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/portal" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/portal/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/portal/tasks" style={{ color: "#666", textDecoration: "none" }}>Tasks</Link>
            <Link href="/portal/metrics" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Metrics</Link>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#666" }}>{user.name}</span>
          <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginBottom: 24 }}>Performance Metrics</h1>

        {metrics.length === 0 ? (
          <div style={{ background: "white", padding: 48, borderRadius: 8, textAlign: "center" }}>
            <p style={{ color: "#888" }}>No metrics recorded yet. Your account manager will add performance data here.</p>
          </div>
        ) : (
          <>
            {/* Latest Metrics Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
              {/* GA Card */}
              <div style={{ background: "white", padding: 24, borderRadius: 8, borderTop: "4px solid #1976d2" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1976d2" }}>📊 Google Analytics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Sessions</div>
                    <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(metrics[0].gaSessions)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Users</div>
                    <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(metrics[0].gaUsers)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Pageviews</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>{formatNumber(metrics[0].gaPageviews)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Bounce Rate</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>{formatDecimal(metrics[0].gaBounceRate, "%")}</div>
                  </div>
                </div>
              </div>

              {/* GSC Card */}
              <div style={{ background: "white", padding: 24, borderRadius: 8, borderTop: "4px solid #2e7d32" }}>
                <h3 style={{ margin: "0 0 16px", color: "#2e7d32" }}>🔍 Search Console</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Impressions</div>
                    <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(metrics[0].gscImpressions)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Clicks</div>
                    <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(metrics[0].gscClicks)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>CTR</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>{formatDecimal(metrics[0].gscCtr, "%")}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Avg Position</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>{formatDecimal(metrics[0].gscAvgPosition)}</div>
                  </div>
                </div>
              </div>

              {/* META Card */}
              <div style={{ background: "white", padding: 24, borderRadius: 8, borderTop: "4px solid #1877f2" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1877f2" }}>📱 META Ads</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Spend</div>
                    <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatCurrency(metrics[0].metaSpend)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>ROAS</div>
                    <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatDecimal(metrics[0].metaRoas)}x</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>Conversions</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>{formatNumber(metrics[0].metaConversions)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888" }}>CPC</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>{formatCurrency(metrics[0].metaCpc)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics History Table */}
            <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
              <h3 style={{ margin: 0, padding: 24, borderBottom: "1px solid #eee" }}>Monthly History</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Month</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#1976d2" }}>Sessions</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#1976d2" }}>Users</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#2e7d32" }}>GSC Clicks</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#2e7d32" }}>Impressions</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#1877f2" }}>META Spend</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#1877f2" }}>ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: 12, fontWeight: 500 }}>
                          {new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </td>
                        <td style={{ padding: 12 }}>{formatNumber(m.gaSessions)}</td>
                        <td style={{ padding: 12 }}>{formatNumber(m.gaUsers)}</td>
                        <td style={{ padding: 12 }}>{formatNumber(m.gscClicks)}</td>
                        <td style={{ padding: 12 }}>{formatNumber(m.gscImpressions)}</td>
                        <td style={{ padding: 12 }}>{formatCurrency(m.metaSpend)}</td>
                        <td style={{ padding: 12 }}>{m.metaRoas ? formatDecimal(Number(m.metaRoas)) + "x" : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
