import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [
    clientCount, 
    projectCount, 
    activeProjects, 
    teamCount,
    allTasks,
    recentProjects,
    recentClients,
  ] = await Promise.all([
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.clientTask.findMany({
      where: { status: { not: "COMPLETED" } },
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { client: true, stages: true },
    }),
    prisma.client.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Task categorization
  const overdueTasks = allTasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < today
  );
  const dueTodayTasks = allTasks.filter(task => 
    task.dueDate && 
    new Date(task.dueDate) >= today && 
    new Date(task.dueDate) < tomorrow
  );
  const highPriorityTasks = allTasks.filter(task => task.priority === "HIGH");

  const taskSummary = {
    total: allTasks.length,
    overdue: overdueTasks.length,
    dueToday: dueTodayTasks.length,
    highPriority: highPriorityTasks.length,
  };

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

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
          <Link href="/clients" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                👥
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{clientCount}</div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Clients</div>
            </div>
          </Link>

          <Link href="/projects" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.info + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                📁
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{activeProjects}</div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Projects</div>
            </div>
          </Link>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.success + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
              ✓
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{taskSummary.total}</div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Tasks</div>
          </div>

          <Link href="/team" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.warning + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                🧑‍💻
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{teamCount}</div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Team Members</div>
            </div>
          </Link>
        </div>

        {/* Task Alerts Row */}
        {(taskSummary.overdue > 0 || taskSummary.dueToday > 0 || taskSummary.highPriority > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {/* Overdue */}
            {taskSummary.overdue > 0 && (
              <div style={{ 
                background: theme.colors.errorBg, 
                padding: 16, 
                borderRadius: 12, 
                border: "1px solid " + theme.colors.error + "30",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 10, 
                  background: theme.colors.error, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                }}>
                  {taskSummary.overdue}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: theme.colors.error, fontSize: 14 }}>Overdue Tasks</div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Need immediate attention</div>
                </div>
              </div>
            )}

            {/* Due Today */}
            {taskSummary.dueToday > 0 && (
              <div style={{ 
                background: theme.colors.warningBg, 
                padding: 16, 
                borderRadius: 12, 
                border: "1px solid " + theme.colors.warning + "30",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 10, 
                  background: theme.colors.warning, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                }}>
                  {taskSummary.dueToday}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#92400E", fontSize: 14 }}>Due Today</div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Complete before end of day</div>
                </div>
              </div>
            )}

            {/* High Priority */}
            {taskSummary.highPriority > 0 && (
              <div style={{ 
                background: PRIORITY_STYLES.HIGH.bg, 
                padding: 16, 
                borderRadius: 12, 
                border: "1px solid " + PRIORITY_STYLES.HIGH.color + "30",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 10, 
                  background: PRIORITY_STYLES.HIGH.color, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                }}>
                  {taskSummary.highPriority}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: PRIORITY_STYLES.HIGH.color, fontSize: 14 }}>High Priority</div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Requires focus</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Task Lists Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Overdue Tasks */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.colors.errorBg }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: theme.colors.error }}>🚨 Overdue Tasks ({overdueTasks.length})</h2>
            </div>
            {overdueTasks.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted, fontSize: 13 }}>
                ✅ No overdue tasks - great job!
              </div>
            ) : (
              <div>
                {overdueTasks.slice(0, 5).map((task, idx) => (
                  <Link key={task.id} href={"/clients/" + task.clientId + "/tasks"} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ 
                      padding: "12px 20px", 
                      borderBottom: idx < Math.min(overdueTasks.length, 5) - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 13 }}>{task.name}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
                          {task.client.name} • Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                        </div>
                      </div>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 500,
                        background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
                        color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textMuted,
                      }}>
                        {task.priority}
                      </span>
                    </div>
                  </Link>
                ))}
                {overdueTasks.length > 5 && (
                  <div style={{ padding: "12px 20px", textAlign: "center", fontSize: 12, color: theme.colors.textMuted }}>
                    +{overdueTasks.length - 5} more overdue tasks
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Due Today Tasks */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.colors.warningBg }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#92400E" }}>📅 Due Today ({dueTodayTasks.length})</h2>
            </div>
            {dueTodayTasks.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted, fontSize: 13 }}>
                No tasks due today
              </div>
            ) : (
              <div>
                {dueTodayTasks.slice(0, 5).map((task, idx) => (
                  <Link key={task.id} href={"/clients/" + task.clientId + "/tasks"} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ 
                      padding: "12px 20px", 
                      borderBottom: idx < Math.min(dueTodayTasks.length, 5) - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 13 }}>{task.name}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
                          {task.client.name}
                        </div>
                      </div>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 500,
                        background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
                        color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textMuted,
                      }}>
                        {task.priority}
                      </span>
                    </div>
                  </Link>
                ))}
                {dueTodayTasks.length > 5 && (
                  <div style={{ padding: "12px 20px", textAlign: "center", fontSize: 12, color: theme.colors.textMuted }}>
                    +{dueTodayTasks.length - 5} more tasks due today
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Projects and Clients Row */}
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
