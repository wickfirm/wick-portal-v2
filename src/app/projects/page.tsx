import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, stages: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
            <Link href="/projects" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Projects</h1>
          <Link href="/projects/new" style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
            + New Project
          </Link>
        </div>

        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          {projects.length === 0 ? (
            <p style={{ padding: 24, textAlign: "center", color: "#888" }}>No projects yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Project</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Client</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Service</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Status</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Progress</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const completed = project.stages.filter(s => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  
                  return (
                    <tr key={project.id}>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        <strong>{project.name}</strong>
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{project.client.name}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{project.serviceType.replace("_", " ")}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: 4, fontSize: 12,
                          background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                          color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 3 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: "#666" }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        <Link href={`/projects/${project.id}`} style={{ color: "#1976d2", marginRight: 12 }}>View</Link>
                        <Link href={`/projects/${project.id}/edit`} style={{ color: "#666" }}>Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
