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
  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { client: true },
  });

  if (!dbUser || !dbUser.client) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <PortalHeader userName={user.name} />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 48, textAlign: "center" }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, color: theme.colors.textPrimary }}>No Client Linked</h1>
          <p style={{ color: theme.colors.textSecondary }}>Your account is not linked to a client.</p>
        </main>
      </div>
    );
  }

  const client = dbUser.client;

  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    include: { stages: true },
    orderBy: { createdAt: "desc" },
  });

  const tasks = await prisma.clientTask.findMany({
    where: { clientId: client.id },
    include: { category: true },
    orderBy: { dueDate: "asc" },
  });

  const onboardingItems = await prisma.onboardingItem.findMany({
    where: { clientId: client.id },
    orderBy: { order: "asc" },
  });

  const resources = await prisma.clientResource.findMany({
    where: { clientId: client.id },
    orderBy: { order: "asc" },
    take: 6,
  });

  const teamMembers = await prisma.clientTeamMember.findMany({
    where: { clientId: client.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  const metrics = await prisma.clientMetrics.findMany({
    where: { clientId: client.id },
    orderBy: { month: "desc" },
    take: 6,
  });

  // Fetch time tracking data if enabled
  let totalTimeTracked = 0;
  let timeByProject: { project: { id: string; name: string }; total: number }[] = [];
  
  if (client.showTimeInPortal) {
    const timeEntries = await prisma.timeEntry.findMany({
      where: { clientId: client.id },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
    
    totalTimeTracked = timeEntries.reduce((sum, e) => sum + e.duration, 0);
    
    // Group by project
    const byProject: Record<string, { project: { id: string; name: string }; total: number }> = {};
    timeEntries.forEach((entry) => {
      if (!byProject[entry.projectId]) {
        byProject[entry.projectId] = { project: entry.project, total: 0 };
      }
      byProject[entry.projectId].total += entry.duration;
    });
    timeByProject = Object.values(byProject).sort((a, b) => b.total - a.total);
  }

  const completedOnboarding = onboardingItems.filter(function(i) { return i.isCompleted; }).length;
  const totalOnboarding = onboardingItems.length;
  const onboardingPct = totalOnboarding > 0 ? Math.round((completedOnboarding / totalOnboarding) * 100) : 0;

  const pendingTasks = tasks.filter(function(t) { return t.status !== "COMPLETED"; });
  const completedTasks = tasks.filter(function(t) { return t.status === "COMPLETED"; });

  const activeProjects = projects.filter(function(p) { return p.status === "IN_PROGRESS"; });

  const latestMetrics = metrics[0];

  // Helper to format duration
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary }}>
            Welcome back{user.name ? ", " + user.name.split(" ")[0] : ""}!
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Here is what is happening with {client.nickname || client.name}.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: client.showTimeInPortal ? "repeat(5, 1fr)" : "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 12, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{activeProjects.length}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Active Projects</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 12, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{pendingTasks.length}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Pending Tasks</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 12, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{completedTasks.length}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Completed Tasks</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 12, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{onboardingPct}%</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Onboarding</div>
          </div>
          {client.showTimeInPortal && (
            <div style={{ background: theme.colors.successBg, padding: 20, borderRadius: 12, border: "1px solid " + theme.colors.success + "30" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.success }}>{formatDuration(totalTimeTracked)}</div>
              <div style={{ fontSize: 13, color: theme.colors.success }}>Hours Logged</div>
            </div>
          )}
        </div>

        {totalOnboarding > 0 && onboardingPct < 100 && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Onboarding Progress</h3>
            <div style={{ height: 12, background: theme.colors.bgTertiary, borderRadius: 6 }}>
              <div style={{ height: "100%", width: onboardingPct + "%", background: theme.gradients.progress, borderRadius: 6 }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: theme.colors.textSecondary }}>{completedOnboarding} of {totalOnboarding} complete</div>
          </div>
        )}

        {latestMetrics && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Performance Snapshot</h3>
              <Link href="/portal/metrics" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none" }}>View Details</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <div style={{ padding: 16, background: theme.colors.bgPrimary, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Sessions</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{latestMetrics.gaSessions || "-"}</div>
              </div>
              <div style={{ padding: 16, background: theme.colors.bgPrimary, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Organic Clicks</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{latestMetrics.gscClicks || "-"}</div>
              </div>
              <div style={{ padding: 16, background: theme.colors.bgPrimary, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Ad Spend</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>${(Number(latestMetrics.metaSpend) || 0) + (Number(latestMetrics.googleAdsSpend) || 0)}</div>
              </div>
              <div style={{ padding: 16, background: theme.colors.bgPrimary, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Keywords Top 10</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{latestMetrics.seoKeywordsTop10 || "-"}</div>
              </div>
            </div>
          </div>
        )}

        {client.showTimeInPortal && timeByProject.length > 0 && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Time by Project</h3>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.success }}>
                Total: {formatDuration(totalTimeTracked)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {timeByProject.slice(0, 5).map(({ project, total }) => (
                <div key={project.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: 4, 
                      background: theme.colors.success 
                    }} />
                    <span style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{project.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ 
                      width: 120, 
                      height: 6, 
                      background: theme.colors.bgTertiary, 
                      borderRadius: 3 
                    }}>
                      <div style={{ 
                        width: `${Math.min(100, (total / totalTimeTracked) * 100)}%`, 
                        height: "100%", 
                        background: theme.colors.success, 
                        borderRadius: 3 
                      }} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary, minWidth: 60, textAlign: "right" }}>
                      {formatDuration(total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Projects</h3>
              <Link href="/portal/projects" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: "none" }}>View all</Link>
            </div>
            {projects.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>No projects yet</div>
            ) : (
              projects.slice(0, 4).map(function(project) {
                const completed = project.stages.filter(function(s) { return s.isCompleted; }).length;
                const total = project.stages.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <Link key={project.id} href={"/portal/projects/" + project.id} style={{ display: "block", padding: 16, borderBottom: "1px solid " + theme.colors.borderLight, textDecoration: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{project.name}</span>
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 12, background: STATUS_STYLES[project.status]?.bg, color: STATUS_STYLES[project.status]?.color }}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: pct + "%", background: theme.gradients.progress, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 6 }}>{pct}% complete</div>
                  </Link>
                );
              })
            )}
          </div>

          <div style={{ background: theme.colors.bgSecondary, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Tasks</h3>
              <Link href="/portal/tasks" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: "none" }}>View all</Link>
            </div>
            {pendingTasks.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>No pending tasks</div>
            ) : (
              pendingTasks.slice(0, 5).map(function(task) {
                return (
                  <div key={task.id} style={{ padding: 16, borderBottom: "1px solid " + theme.colors.borderLight }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{task.name}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: PRIORITY_STYLES[task.priority]?.bg, color: PRIORITY_STYLES[task.priority]?.color }}>
                        {task.priority}
                      </span>
                    </div>
                    {task.dueDate && (
                      <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Resources</h3>
              <Link href="/portal/resources" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: "none" }}>View all</Link>
            </div>
            {resources.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>No resources yet</div>
            ) : (
              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {resources.map(function(resource) {
                  return (
                    <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, background: theme.colors.bgPrimary, borderRadius: 8, textDecoration: "none" }}>
                      <span style={{ fontSize: 16 }}>📄</span>
                      <span style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 13 }}>{resource.name}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ background: theme.colors.bgSecondary, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Your Team</h3>
              <Link href="/portal/team" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: "none" }}>View all</Link>
            </div>
            {teamMembers.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>No team assigned yet</div>
            ) : (
              <div style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
                {teamMembers.slice(0, 6).map(function(tm) {
                  return (
                    <div key={tm.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: theme.colors.bgPrimary, borderRadius: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: theme.gradients.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 600 }}>
                        {(tm.user.name || tm.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: theme.colors.textPrimary }}>{tm.user.name || tm.user.email.split("@")[0]}</div>
                        <div style={{ fontSize: 10, color: theme.colors.textMuted, textTransform: "uppercase" }}>{tm.user.role.replace("_", " ")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
