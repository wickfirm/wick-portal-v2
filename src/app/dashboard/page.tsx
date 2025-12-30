import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;
  
  const [clientCount, projectCount] = await Promise.all([
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
  ]);

  const recentProjects = await prisma.project.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: { client: true, stages: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
            <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
            <Link href="/analytics" style={{ color: "#666", textDecoration: "none" }}>Analytics</Link>
            <Link href="/settings" style={{ color: "#666", textDecoration: "none" }}>Settings</Link>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>{user.name}</span>
          <span style={{ background: "#eee", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>{user.role}</span>
          <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Welcome, {user.name}</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "24px 0" }}>
          <Link href="/clients" style={{ textDecoration: "none" }}>
            <div style={{ background: "white", padding: 24, borderRadius: 8, cursor: "pointer" }}>
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#333" }}>{clientCount}</div>
              <div style={{ color: "#666" }}>Active Clients</div>
            </div>
          </Link>
          <Link href="/projects" style={{ textDecoration: "none" }}>
            <div style={{ background: "white", padding: 24, borderRadius: 8, cursor: "pointer" }}>
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#333" }}>{projectCount}</div>
              <div style={{ color: "#666" }}>Active Projects</div>
            </div>
          </Link>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Recent Projects</h3>
            <Link href="/projects" style={{ color: "#1976d2", textDecoration: "none", fontSize: 14 }}>View all →</Link>
          </div>
          
          {recentProjects.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No projects yet</p>
          ) : (
            recentProjects.map((project) => {
              const completed = project.stages.filter((s) => s.isCompleted).length;
              const total = project.stages.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ padding: 16, borderBottom: "1px solid #eee", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <strong style={{ color: "#333" }}>{project.name}</strong>
                        <div style={{ color: "#666", fontSize: 14 }}>{project.client.name}</div>
                      </div>
                      <span style={{ 
                        fontSize: 12, 
                        background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                        color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666",
                        padding: "4px 8px", 
                        borderRadius: 4,
                        height: "fit-content"
                      }}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: "#eee", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{pct}% complete</div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
