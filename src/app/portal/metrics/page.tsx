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

  const fmt = (n: any) => n === null || n === undefined ? "-" : Number(n).toLocaleString();
  const fmtDec = (n: any) => n === null || n === undefined ? "-" : Number(n).toFixed(2);
  const fmtCur = (n: any) => n === null || n === undefined ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const latest = metrics[0];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Performance Metrics</h1>

        {metrics.length === 0 ? (
          <div style={{ background: "white", padding: 48, borderRadius: 8, textAlign: "center", color: "#888" }}>
            No metrics recorded yet.
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "white", padding: 20, borderRadius: 8, borderLeft: "4px solid #1976d2" }}>
                <div style={{ fontSize: 12, color: "#888" }}>Sessions</div>
                <div style={{ fontSize: 28, fontWeight: "bold" }}>{fmt(latest.gaSessions)}</div>
                <div style={{ fontSize: 12, color: "#1976d2" }}>Google Analytics</div>
              </div>
              <div style={{ background: "white", padding: 20, borderRadius: 8, borderLeft: "4px solid #2e7d32" }}>
                <div style={{ fontSize: 12, color: "#888" }}>GSC Clicks</div>
                <div style={{ fontSize: 28, fontWeight: "bold" }}>{fmt(latest.gscClicks)}</div>
                <div style={{ fontSize: 12, color: "#2e7d32" }}>Search Console</div>
              </div>
              <div style={{ background: "white", padding: 20, borderRadius: 8, borderLeft: "4px solid #1877f2" }}>
                <div style={{ fontSize: 12, color: "#888" }}>Total Ad Spend</div>
                <div style={{ fontSize: 28, fontWeight: "bold" }}>{fmtCur((Number(latest.metaSpend) || 0) + (Number(latest.googleAdsSpend) || 0) + (Number(latest.linkedinAdsSpend) || 0) + (Number(latest.tiktokAdsSpend) || 0))}</div>
                <div style={{ fontSize: 12, color: "#1877f2" }}>All Platforms</div>
              </div>
              <div style={{ background: "white", padding: 20, borderRadius: 8, borderLeft: "4px solid #607d8b" }}>
                <div style={{ fontSize: 12, color: "#888" }}>Total Hours</div>
                <div style={{ fontSize: 28, fontWeight: "bold" }}>{fmtDec((Number(latest.hoursSeo) || 0) + (Number(latest.hoursContent) || 0) + (Number(latest.hoursPaidMedia) || 0) + (Number(latest.hoursSocial) || 0) + (Number(latest.hoursDesign) || 0) + (Number(latest.hoursMaintenance) || 0) + (Number(latest.hoursStrategy) || 0))}</div>
                <div style={{ fontSize: 12, color: "#607d8b" }}>This Month</div>
              </div>
            </div>

            {/* History Table */}
            <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
              <h3 style={{ margin: 0, padding: 24, borderBottom: "1px solid #eee" }}>Metrics History</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Month</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Sessions</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>GSC Clicks</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Ad Spend</th>
                      <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: 12, fontWeight: 500 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</td>
                        <td style={{ padding: 12 }}>{fmt(m.gaSessions)}</td>
                        <td style={{ padding: 12 }}>{fmt(m.gscClicks)}</td>
                        <td style={{ padding: 12 }}>{fmtCur((Number(m.metaSpend) || 0) + (Number(m.googleAdsSpend) || 0) + (Number(m.linkedinAdsSpend) || 0) + (Number(m.tiktokAdsSpend) || 0))}</td>
                        <td style={{ padding: 12 }}>{fmtDec((Number(m.hoursSeo) || 0) + (Number(m.hoursContent) || 0) + (Number(m.hoursPaidMedia) || 0) + (Number(m.hoursSocial) || 0) + (Number(m.hoursDesign) || 0) + (Number(m.hoursMaintenance) || 0) + (Number(m.hoursStrategy) || 0))}</td>
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
