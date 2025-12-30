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

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Analytics</h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>{totalClients}</div>
            <div style={{ color: "#666" }}>Total Clients</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold", color: "#2e7d32" }}>{activeClients}</div>
            <div style={{ color: "#666" }}>Active Clients</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>{totalProjects}</div>
            <div style={{ color: "#666" }}>Total Projects</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold", color: "#1976d2" }}>{inProgressProjects}</div>
            <div style={{ color: "#666" }}>In Progress</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Clients by Status</h3>
            {clientsByStatus.map((item) => (
              <div key={item.status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <span>{item.status}</span>
                <span style={{ fontWeight: "bold" }}>{item._count.status}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Projects by Type</h3>
            {projectsByType.map((item) => (
              <div key={item.serviceType} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <span>{item.serviceType.replace("_", " ")}</span>
                <span style={{ fontWeight: "bold" }}>{item._count.serviceType}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8, marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>Project Completion</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1, height: 24, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                width: totalProjects > 0 ? `${(completedProjects / totalProjects) * 100}%` : "0%",
                background: "#4caf50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 12
              }}>
                {totalProjects > 0 ? `${Math.round((completedProjects / totalProjects) * 100)}%` : "0%"}
              </div>
            </div>
            <span style={{ color: "#666" }}>{completedProjects} / {totalProjects} completed</span>
          </div>
        </div>
      </main>
    </div>
  );
}
