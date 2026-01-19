"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

type Stats = {
  clientCount: number;
  projectCount: number;
  activeProjects: number;
  teamCount: number;
};

type Task = {
  id: string;
  name: string;
  dueDate: Date | null;
  priority: string;
  client: {
    id: string;
    name: string;
  };
};

type TaskData = {
  overdueTasks: Task[];
  dueTodayTasks: Task[];
  taskSummary: {
    total: number;
    overdue: number;
    dueToday: number;
  };
};

type Project = {
  id: string;
  name: string;
  status: string;
  client: {
    id: string;
    name: string;
    nickname: string | null;
  };
  stages: {
    id: string;
    isCompleted: boolean;
  }[];
};

type Client = {
  id: string;
  name: string;
  nickname: string | null;
  status: string;
  industry: string | null;
};

type RecentData = {
  recentProjects: Project[];
  recentClients: Client[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [recentData, setRecentData] = useState<RecentData | null>(null);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch all data in parallel
      fetch("/api/dashboard/stats")
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoadingStats(false);
        })
        .catch(err => {
          console.error("Failed to load stats:", err);
          setLoadingStats(false);
        });

      fetch("/api/dashboard/tasks")
        .then(res => res.json())
        .then(data => {
          setTaskData(data);
          setLoadingTasks(false);
        })
        .catch(err => {
          console.error("Failed to load tasks:", err);
          setLoadingTasks(false);
        });

      fetch("/api/dashboard/recent")
        .then(res => res.json())
        .then(data => {
          setRecentData(data);
          setLoadingRecent(false);
        })
        .catch(err => {
          console.error("Failed to load recent data:", err);
          setLoadingRecent(false);
        });
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
            Loading...
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            {user.role === "SUPER_ADMIN" 
              ? "Here is what is happening with your agency today."
              : "Here is what is happening with your clients today."
            }
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
          <Link href="/clients" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                👥
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
                {loadingStats ? "..." : stats?.clientCount || 0}
              </div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Clients</div>
            </div>
          </Link>

          <Link href="/projects" style={{ textDecoration: "none" }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.info + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                📁
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
                {loadingStats ? "..." : stats?.activeProjects || 0}
              </div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Projects</div>
            </div>
          </Link>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.success + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
              ✓
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
              {loadingTasks ? "..." : taskData?.taskSummary.total || 0}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Tasks</div>
          </div>

          {user.role === "SUPER_ADMIN" && (
            <Link href="/team" style={{ textDecoration: "none" }}>
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.warning + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                  🧑‍💻
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
                  {loadingStats ? "..." : stats?.teamCount || 0}
                </div>
                <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Team Members</div>
              </div>
            </Link>
          )}
          
          {user.role !== "SUPER_ADMIN" && (
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.warning + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
                📊
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
                {loadingStats ? "..." : stats?.projectCount || 0}
              </div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Total Projects</div>
            </div>
          )}
        </div>

        {/* Task Lists Row */}
        {!loadingTasks && taskData && (taskData.taskSummary.overdue > 0 || taskData.taskSummary.dueToday > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* Overdue Tasks */}
            {taskData.taskSummary.overdue > 0 && (
              <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, background: theme.colors.errorBg }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: theme.colors.error }}>
                    🚨 Overdue Tasks ({taskData.taskSummary.overdue})
                  </h2>
                </div>
                <div>
                  {taskData.overdueTasks.map((task, idx) => (
                    <Link key={task.id} href={`/clients/${task.client.id}/tasks`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ 
                        padding: "12px 20px", 
                        borderBottom: idx < taskData.overdueTasks.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                      }}>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 13 }}>{task.name}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
                          {task.client.name} • Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Due Today Tasks */}
            {taskData.taskSummary.dueToday > 0 && (
              <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, background: theme.colors.warningBg }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#92400E" }}>
                    📅 Due Today ({taskData.taskSummary.dueToday})
                  </h2>
                </div>
                <div>
                  {taskData.dueTodayTasks.map((task, idx) => (
                    <Link key={task.id} href={`/clients/${task.client.id}/tasks`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ 
                        padding: "12px 20px", 
                        borderBottom: idx < taskData.dueTodayTasks.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                      }}>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 13 }}>{task.name}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
                          {task.client.name}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Projects and Clients Row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Recent Projects */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Projects</h2>
              <Link href="/projects" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>View all</Link>
            </div>

            {loadingRecent ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>Loading...</div>
            ) : !recentData?.recentProjects.length ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>No projects yet</div>
            ) : (
              <div>
                {recentData.recentProjects.map((project, idx) => {
                  const completed = project.stages.filter((s) => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <Link key={project.id} href={"/projects/" + project.id} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ padding: "16px 24px", borderBottom: idx < recentData.recentProjects.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none" }}>
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

          {/* Recent Clients */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Clients</h2>
              <Link href="/clients" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>View all</Link>
            </div>

            {loadingRecent ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>Loading...</div>
            ) : !recentData?.recentClients.length ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>No clients yet</div>
            ) : (
              <div>
                {recentData.recentClients.map((client, idx) => (
                  <Link key={client.id} href={"/clients/" + client.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ padding: "14px 24px", borderBottom: idx < recentData.recentClients.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none", display: "flex", alignItems: "center", gap: 12 }}>
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
