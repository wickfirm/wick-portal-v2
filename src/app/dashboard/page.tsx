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

const statCards = [
  { label: "Active Clients", value: clientCount, icon: "👥", color: theme.colors.primary, href: "/clients" },
  { label: "Active Projects", value: activeProjects, icon: "📁", color: theme.colors.info, href: "/projects" },
  { label: "Total Projects", value: projectCount, icon: "✓", color: theme.colors.success, href: null },
  { label: "Team Members", value: teamCount, icon: "👤", color: theme.colors.warning, href: "/team" },
];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Here's what's happening with your agency today.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          {statCards.map((stat, idx) => {
            const content = (
              <div style={{
                background: theme.colors.bgSecondary,
                padding: 24,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.borderLight}`,
                transition: "all 150ms ease",
                cursor: stat.href ? "pointer" : "default"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: `${stat.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20
                  }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>{stat.label}</div>
              </div>
            );

            return stat.href ? (
              <Link key={idx} href={stat.href} style={{ textDecoration: "none" }}>{content}</Link>
            ) : (
              <div key={idx}>{content}</div>
            );
          })}
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Recent Projects */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${theme.colors.borderLight}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Projects</h2>
              <Link href="/projects" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View all →
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
                No projects yet
              </div>
            ) : (
              <div>
                {recentProjects.map((project, idx) => {
                  const completed = project.stages.filter((s) => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{
                        padding: "16px 24px",
                        borderBottom: idx < recentProjects.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                        transition: "background 150ms ease",
                        cursor: "pointer"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 2 }}>{project.name}</div>
                            <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{project.client.name}</div>
                          </div>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                            color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary
                          }}>
                            {project.status.replace("_", " ")}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                            <div style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: theme.gradients.progress,
                              borderRadius: 3
                            }} />
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

          {/* Recent Clients */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            overflow: "hidden"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${theme.colors.borderLight}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Clients</h2>
              <Link href="/clients" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View all →
              </Link>
            </div>

            {recentClients.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted
