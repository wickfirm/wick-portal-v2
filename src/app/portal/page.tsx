import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { client: true },
  });

  if (!dbUser?.client) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <PortalHeader userName={user.name} />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🔗</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>No Client Linked</h1>
          <p style={{ color: theme.colors.textSecondary }}>Your account is not linked to a client. Please contact your account manager.</p>
        </main>
      </div>
    );
  }

  const client = dbUser.client;

  const [projects, tasks, onboardingItems, resources, teamMembers, metrics] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: client.id },
      include: { stages: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clientTask.findMany({
      where: { clientId: client.id },
      include: { category: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.onboardingItem.findMany({
      where: { clientId: client.id },
      orderBy: { order: "asc" },
    }),
    prisma.clientResource.findMany({
      where: { clientId: client.id },
      orderBy: { order: "asc" },
      take: 6,
    }),
    prisma.clientTeamMember.findMany({
      where: { clientId: client.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.clientMetrics.findMany({
      where: { clientId: client.id },
      orderBy: { month: "desc" },
      take: 6,
    }),
  ]);

  const completedOnboarding = onboardingItems.filter(i => i.isCompleted).length;
  const totalOnboarding = onboardingItems.length;
  const onboardingPct = totalOnboarding > 0 ? Math.round((completedOnboarding / totalOnboarding) * 100) : 0;

  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < today);

  const activeProjects = projects.filter(p => p.status === "IN_PROGRESS");

  const latestMetrics = metrics[0];
  const previousMetrics = metrics[1];

  const getChange = (current: any, previous: any) => {
    if (!current || !previous) return null;
    const curr = Number(current) || 0;
    const prev = Number(previous) || 0;
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Here's what's happening with {client.nickname || client.name}.
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <Link href="/portal/projects" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.infoBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  📁
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{activeProjects.length}</div>
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Active Projects</div>
            </div>
          </Link>

          <Link href="/portal/tasks" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.warningBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  ✓
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{pendingTasks.length}</div>
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Pending Tasks</div>
              {overdueTasks.length > 0 && (
                <div style={{ fontSize: 11, color: theme.colors.error, marginTop: 4 }}>{overdueTasks.length} overdue</div>
              )}
            </div>
          </Link>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                ✅
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{completedTasks.length}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Completed Tasks</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: onboardingPct === 100 ? theme.colors.successBg : theme.colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                🚀
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{onboardingPct}%</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Onboarding</div>
          </div>
        </div>

        {/* Onboarding Progress (if not complete) */}
        {totalOnboarding > 0 && onboardingPct < 100 && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>🚀 Onboarding Progress</h3>
              <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>{completedOnboarding} of {totalOnboarding} complete</span>
            </div>
            <div style={{ height: 12, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 16 }}>
              <div style={{
                height: "100%",
                width: onboardingPct + "%",
                background: theme.gradients.progress,
                borderRadius: 6,
                transition: "width 300ms ease"
              }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {onboardingItems.slice(0, 5).map(item => (
                <div key={item.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: item.isCompleted ? theme.colors.successBg : theme.colors.bgTertiary,
                  color: item.isCompleted ? theme.colors.success : theme.colors.textSecondary,
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {item.isCompleted ? "✓" : "○"} {item.name}
                </div>
              ))}
              {onboardingItems.length > 5 && (
                <div style={{ padding: "6px 12px", fontSize: 12, color: theme.colors.textMuted }}>
                  +{onboardingItems.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metrics Preview */}
        {latestMetrics && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>📊 Performance Snapshot</h3>
              <Link href="/portal/metrics" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View Details →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <div style={{ padding: 16, background: theme.colors.bgPrimary, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Sessions</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {latestMetrics.gaSessions?.toLocaleString() || "-"}
                </div>
                {getChange(latestMetrics.gaSessions, previousMetrics?.gaSessions) !== null && (
                  <div style={{ 
                    fontSize: 11, 
                    color: getChange(latestMetrics.gaSessions, previousMetrics?.gaSessions)! >= 0 ? theme.colors.success : theme.colors.error,
                    marginTop: 4 
                  }}>
                    {getChange(latestMetrics.gaSessions, previousMetrics?.gaSessions)! >= 0 ? "↑" : "↓"} {Math.abs(getChange(latestMetrics.gaSessions, previousMetrics?.gaSessions)!)}% vs last month
                  </div>
                )}
              </div>
              <div style={{ padding: 16, background: theme.colors.bgPrimary, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Organic Clicks</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {latestMetrics.gscClicks?.toLocaleString() || "-"}
                </div>
                {getChange(latestMetrics.gscClicks, previousMetrics?.gscClicks) !== null && (
                  <div style={{ 
                    fontSize: 11, 
                    color: getChange(latestMetrics.gscClicks, previousMetrics?.gscClicks)! >= 0 ? theme.colors.success : theme.colors.error,
                    marginTop: 4 
                  }}>
                    {getChange(latestMetrics.gscClicks, previousMetrics?.gscClicks)! >= 0 ? "↑" : "↓"} {Math.abs(getChange(latestMetrics.gscClicks, previousMetrics?.gscClicks)!)}% vs last month
                  </div>
                )}
              </div>
              <div style={{ padding: 16, background: theme.colors.bgPrimary, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Ad Spend</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>
                  ${((Number(latestMetrics.metaSpend) || 0) + (Number(latestMetrics.googleAdsSpend) || 0)).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: 16, background: theme.colors.bgPrimary, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Keywords Top 10</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {latestMetrics.seoKeywordsTop10?.toLocaleString() || "-"}
                </div>
                {getChange(latestMetrics.seoKeywordsTop10, previousMetrics?.seoKeywordsTop10) !== null && (
                  <div style={{ 
                    fontSize: 11, 
                    color: getChange(latestMetrics.seoKeywordsTop10, previousMetrics?.seoKeywordsTop10)! >= 0 ? theme.colors.success : theme.colors.error,
                    marginTop: 4 
                  }}>
                    {getChange(latestMetrics.seoKeywordsTop10, previousMetrics?.seoKeywordsTop10)! >= 0 ? "↑" : "↓"} {Math.abs(getChange(latestMetrics.seoKeywordsTop10, previousMetrics?.seoKeywordsTop10)!)}% vs last month
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Recent Projects */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>📁 Projects</h3>
              <Link href="/portal/projects" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View all
              </Link>
            </div>
            {projects.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted, fontSize: 13 }}>No projects yet</div>
            ) : (
              <div>
                {projects.slice(0, 4).map((project, idx) => {
                  const completed = project.stages.filter(s => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <Link key={project.id} href={"/portal/projects/" + project.id} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{
                        padding: "14px 20px",
                        borderBottom: idx < Math.min(projects.length, 4) - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 14 }}>{project.name}</div>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: "3px 8px",
                            borderRadius: 12,
                            background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                            color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary
                          }}>
                            {project.status.replace("_", " ")}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                            <div style={{
                              height: "100%",
                              width: pct + "%",
                              background: theme.gradients.progress,
                              borderRadius: 3
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: 500, minWidth: 32 }}>{pct}%</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>📋 Pending Tasks</h3>
              <Link href="/portal/tasks" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View all
              </Link>
            </div>
            {pendingTasks.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted, fontSize: 13 }}>All caught up! 🎉</div>
            ) : (
              <div>
                {pendingTasks.slice(0, 5).map((task, idx) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < today;
                  return (
                    <div key={task.id} style={{
                      padding: "14px 20px",
                      borderBottom: idx < Math.min(pendingTasks.length, 5) - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 14, marginBottom: 4 }}>{task.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                            {task.category && (
                              <span style={{ color: theme.colors.textMuted }}>{task.category.name}</span>
                            )}
                            {task.dueDate && (
                              <span style={{ color: isOverdue ? theme.colors.error : theme.colors.textMuted }}>
                                {isOverdue ? "⚠️ " : ""}Due {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: "3px 8px",
                          borderRadius: 12,
                          background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
                          color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textSecondary
                        }}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Team & Resources */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Your Team */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>👥 Your Team</h3>
              <Link href="/portal/team" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View all
              </Link>
            </div>
            {teamMembers.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted, fontSize: 13 }}>No team members assigned</div>
            ) : (
              <div style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
                {teamMembers.map(tm => (
                  <div key={tm.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: theme.gradients.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 13
                    }}>
                      {(tm.user.name || tm.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13, color: theme.colors.textPrimary }}>{tm.user.name || tm.user.email.split("@")[0]}</div>
                      <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{tm.user.role.replace("_", " ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Resources */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>🔗 Quick Links</h3>
              <Link href="/portal/resources" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View all
              </Link>
            </div>
            {resources.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted, fontSize: 13 }}>No resources yet</div>
            ) : (
              <div style={{ padding: 12 }}>
                {resources.map(resource => (
                  
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      textDecoration: "none",
                      color: "inherit",
                      marginBottom: 4,
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: theme.colors.infoBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14
                    }}>
                      {resource.type === "DRIVE" ? "📁" : resource.type === "SHEET" ? "📊" : resource.type === "DOC" ? "📄" : "🔗"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, color: theme.colors.textPrimary }}>{resource.name}</div>
                    </div>
                    <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
