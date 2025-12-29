import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [
    totalClients,
    activeClients,
    totalProjects,
    activeProjects,
    completedProjects,
    totalUsers,
    clientsByStatus,
    projectsByService,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.user.count(),
    prisma.client.groupBy({ by: ["status"], _count: true }),
    prisma.project.groupBy({ by: ["serviceType"], _count: true }),
  ]);

  const recentProjects = await prisma.project.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: { client: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
            <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
            <Link href="/analytics" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Analytics</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginBottom: 24 }}>Analytics</h1>

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
            <div style={{ fontSize: 32, fontWeight: "bold", color: "#1976d2" }}>{activeProjects}</div>
            <div style={{ color: "#666" }}>In Progress</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Clients by Status</h3>
            {clientsByStatus.map((item) => (
              <div key={item.status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <span>{item.status}</span>
                <strong>{item._count}</strong>
              </div>
            ))}
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Projects by Service</h3>
            {projectsByService.map((item) => (
              <div key={item.serviceType} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <span>{item.serviceType.replace("_", " ")}</span>
                <strong>{item._count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#2e7d32" }}>{completedProjects}</div>
            <div style={{ color: "#666" }}>Completed Projects</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: "bold" }}>{totalUsers}</div>
            <div style={{ color: "#666" }}>Team Members</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: "bold" }}>
              {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
            </div>
            <div style={{ color: "#666" }}>Completion Rate</div>
          </div>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Recently Updated Projects</h3>
          {recentProjects.length === 0 ? (
            <p style={{ color: "#888" }}>No projects yet</p>
          ) : (
            recentProjects.map((project) => (
              <div key={project.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eee" }}>
                <div>
                  <Link href={`/projects/${project.id}`} style={{ fontWeight: 500, color: "#333", textDecoration: "none" }}>{project.name}</Link>
                  <div style={{ fontSize: 12, color: "#888" }}>{project.client.name}</div>
                </div>
                <span style={{ 
                  padding: "4px 8px", borderRadius: 4, fontSize: 12, height: "fit-content",
                  background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                  color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
                }}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
