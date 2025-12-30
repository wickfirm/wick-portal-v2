import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortalProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { client: true },
  });

  if (!dbUser?.client) redirect("/portal");

  const projects = await prisma.project.findMany({
    where: { clientId: dbUser.client.id },
    include: { stages: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontWeight: "bold", fontSize: 20, color: "#333" }}>Wick Portal</span>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/portal" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/portal/projects" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Projects</Link>
            <Link href="/portal/tasks" style={{ color: "#666", textDecoration: "none" }}>Tasks</Link>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#666" }}>{user.name}</span>
          <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginBottom: 24 }}>Your Projects</h1>

        {projects.length === 0 ? (
          <div style={{ background: "white", padding: 48, borderRadius: 8, textAlign: "center" }}>
            <p style={{ color: "#888" }}>No projects yet. Your account manager will set these up for you.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {projects.map(project => {
              const completed = project.stages.filter(s => s.isCompleted).length;
              const total = project.stages.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <Link key={project.id} href={`/portal/projects/${project.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "white", padding: 24, borderRadius: 8, cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ margin: 0, color: "#333" }}>{project.name}</h3>
                        <span style={{ fontSize: 14, color: "#888" }}>{project.serviceType.replace("_", " ")}</span>
                      </div>
                      <span style={{ 
                        padding: "4px 12px", borderRadius: 4, fontSize: 14,
                        background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                        color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
                      }}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, height: 8, background: "#eee", borderRadius: 4 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontWeight: 500, color: "#666" }}>{pct}%</span>
                    </div>

                    <div style={{ marginTop: 12, fontSize: 14, color: "#888" }}>
                      {completed} of {total} stages completed
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
