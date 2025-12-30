import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, stages: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Projects</h1>
          <Link href="/projects/new" style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
            + Add Project
          </Link>
        </div>

        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          {projects.length === 0 ? (
            <p style={{ padding: 48, textAlign: "center", color: "#888" }}>No projects yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Project</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Client</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Type</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Status</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Progress</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const completed = project.stages.filter(s => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <tr key={project.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 12 }}>
                        <Link href={`/projects/${project.id}`} style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>
                          {project.name}
                        </Link>
                      </td>
                      <td style={{ padding: 12 }}>
                        <Link href={`/clients/${project.client.id}`} style={{ color: "#666", textDecoration: "none" }}>
                          {project.client.name}
                        </Link>
                      </td>
                      <td style={{ padding: 12, color: "#666" }}>{project.serviceType.replace("_", " ")}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: 4, fontSize: 12,
                          background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                          color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 3, minWidth: 60 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: "#666" }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
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
