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
    <div style={{ minHeight: "100vh" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Wick Portal</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>{user.name}</span>
          <span style={{ background: "#eee", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>{user.role}</span>
          <Link href="/api/auth/signout" style={{ color: "#666" }}>Sign out</Link>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <h2>Welcome, {user.name}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "24px 0" }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>{clientCount}</div>
            <div style={{ color: "#666" }}>Active Clients</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>{projectCount}</div>
            <div style={{ color: "#666" }}>Active Projects</div>
          </div>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h3>Recent Projects</h3>
          {recentProjects.length === 0 ? (
            <p style={{ color: "#888" }}>No projects yet</p>
          ) : (
            recentProjects.map((project) => {
              const completed = project.stages.filter((s) => s.isCompleted).length;
              const total = project.stages.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={project.id} style={{ padding: 16, borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <strong>{project.name}</strong>
                      <div style={{ color: "#666", fontSize: 14 }}>{project.client.name}</div>
                    </div>
                    <span style={{ fontSize: 12, background: "#e3f2fd", color: "#1976d2", padding: "4px 8px", borderRadius: 4 }}>
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, height: 6, background: "#eee", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{pct}% complete</div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
