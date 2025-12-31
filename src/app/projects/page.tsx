import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "#f1f3f4", color: "#5f6368" },
  PENDING_APPROVAL: { bg: "#fef7e0", color: "#f9ab00" },
  IN_PROGRESS: { bg: "#e8f0fe", color: "#4285f4" },
  ON_HOLD: { bg: "#fce8e6", color: "#ea4335" },
  COMPLETED: { bg: "#e6f4ea", color: "#34a853" },
  CANCELLED: { bg: "#f1f3f4", color: "#5f6368" },
};

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, stages: true },
  });

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === "IN_PROGRESS").length,
    completed: projects.filter(p => p.status === "COMPLETED").length,
    onHold: projects.filter(p => p.status === "ON_HOLD").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Projects</h1>
            <p style={{ color: "#5f6368", fontSize: 15 }}>Track and manage all your projects</p>
          </div>
          <Link href="/projects/new" style={{
            background: "linear-gradient(135deg, #e85a4f, #d44a3f)",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(232, 90, 79, 0.3)"
          }}>
            <span style={{ fontSize: 18 }}>+</span> New Project
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>Total Projects</div>
          </div>
          <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#4285f4" }}>{stats.inProgress}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>In Progress</div>
          </div>
          <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#34a853" }}>{stats.completed}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>Completed</div>
          </div>
          <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#ea4335" }}>{stats.onHold}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>On Hold</div>
          </div>
        </div>

        {/* Projects Table */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
          {projects.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>No projects yet</div>
              <div style={{ color: "#5f6368", marginBottom: 24 }}>Get started by creating your first project</div>
              <Link href="/projects/new" style={{
                background: "#e85a4f",
                color: "white",
                padding: "10px 20px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 14
              }}>
                Create Project
              </Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Project</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Client</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Type</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Status</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Progress</th>
                  <th style={{ padding: 16, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const completed = project.stages.filter(s => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <tr key={project.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                      <td style={{ padding: 16 }}>
                        <Link href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{project.name}</div>
                        </Link>
                      </td>
                      <td style={{ padding: 16 }}>
                        <Link href={`/clients/${project.client.id}`} style={{ color: "#5f6368", textDecoration: "none" }}>
                          {project.client.name}
                        </Link>
                      </td>
                      <td style={{ padding: 16, color: "#5f6368", fontSize: 13 }}>
                        {project.serviceType.replace("_", " ")}
                      </td>
                      <td style={{ padding: 16 }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: STATUS_STYLES[project.status]?.bg || "#f1f3f4",
                          color: STATUS_STYLES[project.status]?.color || "#5f6368"
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 120 }}>
                          <div style={{ flex: 1, height: 6, background: "#f1f3f4", borderRadius: 3 }}>
                            <div style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: "linear-gradient(90deg, #e85a4f, #f8b739)",
                              borderRadius: 3
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: "#5f6368", fontWeight: 500, minWidth: 32 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: 16, textAlign: "right" }}>
                        <Link href={`/projects/${project.id}`} style={{
                          color: "#e85a4f",
                          textDecoration: "none",
                          fontWeight: 500,
                          fontSize: 13,
                          marginRight: 16
                        }}>
                          View
                        </Link>
                        <Link href={`/projects/${project.id}/edit`} style={{
                          color: "#5f6368",
                          textDecoration: "none",
                          fontWeight: 500,
                          fontSize: 13
                        }}>
                          Edit
                        </Link>
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
