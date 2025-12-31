import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import { theme, STATUS_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const [clientCount, projectCount, activeProjects, teamCount] = await Promise.all([
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const recentProjects = await prisma.project.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: { client: true, stages: true },
  });

  const recentClients = await prisma.client.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Here is what is happening with your agency today.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          <Link href="/clients" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                C
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{clientCount}</div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Clients</div>
            </div>
          </Link>

          <Link href="/projects" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.info + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                P
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{activeProjects}</div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Projects</div>
            </div>
          </Link>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.success + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
              T
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{projectCount}</div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Total Projects</div>
          </div>

          <Link href="/team" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.warning + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                U
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{teamCount}</div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Team Members</div>
            </div>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Projects</h2>
              <Link href="/projects" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>View all</Link>
            </div>

            {recentProjects.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>No projects yet</div>
            ) : (
              <div>
                {recentProjects.map((project, idx) => {
                  const completed = project.stages.filter((s) => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <Link key={project.id} href={"/projects/" + project.id} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ padding: "16px 24px", borderBottom: idx < recentProjects.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 2 }}>{project.name}</div>
                            <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{project.client.name}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 20, background: STATUS_STYLES[project.status]?.bg, color: STATUS_STYLES[project.status]?.color }}>
                            {project.status.replace("_", " ")}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                            <div style={{ height: "100%", width: pct + "%", background: theme.gradients.progress, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500 }}>{pct}%</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Clients</h2>
              <Link href="/clients" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>View all</Link>
            </div>

            {recentClients.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>No clients yet</div>
            ) : (
              <div>
                {recentClients.map((client, idx) => (
                  <Link key={client.id} href={"/clients/" + client.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ padding: "14px 24px", borderBottom: idx < recentClients.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.gradients.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 600, fontSize: 14 }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 2 }}>{client.name}</div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{client.industry || "No industry"}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 20, background: STATUS_STYLES[client.status]?.bg, color: STATUS_STYLES[client.status]?.color }}>
                        {client.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
