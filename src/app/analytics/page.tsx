import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";

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
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
  ]);

  const clientsByStatus = await prisma.client.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const projectsByType = await prisma.project.groupBy({
    by: ["serviceType"],
    _count: { serviceType: true },
  });

  const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Analytics</h1>
          <p style={{ color: "#5f6368", fontSize: 15 }}>Overview of your agency performance</p>
        </div>

        {/* Key Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(232, 90, 79, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                👥
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{totalClients}</div>
            <div style={{ fontSize: 14, color: "#5f6368" }}>Total Clients</div>
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(52, 168, 83, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                ✓
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#34a853", marginBottom: 4 }}>{activeClients}</div>
            <div style={{ fontSize: 14, color: "#5f6368" }}>Active Clients</div>
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(66, 133, 244, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                📁
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#4285f4", marginBottom: 4 }}>{inProgressProjects}</div>
            <div style={{ fontSize: 14, color: "#5f6368" }}>Active Projects</div>
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(248, 183, 57, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                🎯
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#f9ab00", marginBottom: 4 }}>{completionRate}%</div>
            <div style={{ fontSize: 14, color: "#5f6368" }}>Completion Rate</div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Clients by Status */}
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Clients by Status</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {clientsByStatus.map((item) => {
                const percentage = totalClients > 0 ? Math.round((item._count.status / totalClients) * 100) : 0;
                return (
                  <div key={item.status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: "#1a1a1a" }}>{item.status}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#5f6368" }}>{item._count.status}</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f3f4", borderRadius: 4 }}>
                      <div style={{
                        height: "100%",
                        width: `${percentage}%`,
                        background: "linear-gradient(90deg, #e85a4f, #f8b739)",
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projects by Type */}
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Projects by Service Type</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {projectsByType.map((item) => {
                const percentage = totalProjects > 0 ? Math.round((item._count.serviceType / totalProjects) * 100) : 0;
                return (
                  <div key={item.serviceType}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: "#1a1a1a" }}>{item.serviceType.replace("_", " ")}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#5f6368" }}>{item._count.serviceType}</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f3f4", borderRadius: 4 }}>
                      <div style={{
                        height: "100%",
                        width: `${percentage}%`,
                        background: "linear-gradient(90deg, #4285f4, #34a853)",
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Project Completion */}
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Project Completion</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ flex: 1, height: 24, background: "#f1f3f4", borderRadius: 12, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${completionRate}%`,
                background: "linear-gradient(90deg, #34a853, #4285f4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 12,
                fontWeight: 600
              }}>
                {completionRate > 10 && `${completionRate}%`}
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: 120 }}>
              <div style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 500 }}>{completedProjects} / {totalProjects}</div>
              <div style={{ fontSize: 12, color: "#9aa0a6" }}>projects completed</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
