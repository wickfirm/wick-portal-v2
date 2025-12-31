import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import { theme, STATUS_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

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
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Projects</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Track and manage all your projects</p>
          </div>
          <Link href="/projects/new" style={{
            background: theme.gradients.primary,
            color: "white",
            padding: "12px 24px",
            borderRadius: theme.borderRadius.md,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: theme.shadows.button
          }}>
            <span style={{ fontSize: 18 }}>+</span> New Project
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Projects</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.info }}>{stats.inProgress}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>In Progress</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.success }}>{stats.completed}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Completed</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.error }}>{stats.onHold}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>On Hold</div>
          </div>
        </div>

        {/* Projects Table */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          {projects.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>P</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No projects yet</div>
              <div style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>Get started by creating your first project</div>
              <Link href="/projects/new" style={{
                background: theme.colors.primary,
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
                <tr style={{ background: theme.colors.bgPrimary }}>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Project</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Client</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Type</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Status</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Progress</th>
                  <th style={{ padding: 16, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const completed = project.stages.filter(s => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <tr key={project.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                      <td style={{ padding: 16 }}>
                        <Link href={"/projects/" + project.id} style={{ textDecoration: "none" }}>
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{project.name}</div>
                        </Link>
                      </td>
                      <td style={{ padding: 16 }}>
                        <Link href={"/clients/" + project.client.id} style={{ color: theme.colors.textSecondary, textDecoration: "none" }}>
                          {project.client.name}
                        </Link>
                      </td>
                      <td style={{ padding: 16, color: theme.colors.textSecondary, fontSize: 13 }}>
                        {project.serviceType.replace("_", " ")}
                      </td>
                      <td style={{ padding: 16 }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                          color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 120 }}>
                          <div style={{ flex: 1, height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                            <div style={{
                              height: "100%",
                              width: pct + "%",
                              background: theme.gradients.progress,
                              borderRadius: 3
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500, minWidth: 32 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: 16, textAlign: "right" }}>
                        <Link href={"/projects/" + project.id} style={{
                          color: theme.colors.primary,
                          textDecoration: "none",
                          fontWeight: 500,
                          fontSize: 13,
                          marginRight: 16
                        }}>
                          View
                        </Link>
                        <Link href={"/projects/" + project.id + "/edit"} style={{
                          color: theme.colors.textSecondary,
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
