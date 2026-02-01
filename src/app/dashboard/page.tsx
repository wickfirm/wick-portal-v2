"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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

// Greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDateString(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Stat card accent colors from Wick palette
const STAT_ACCENTS = [
  { bg: "#76527c", light: "rgba(118,82,124,0.08)", text: "#76527c" },
  { bg: "#d8ee91", light: "rgba(216,238,145,0.15)", text: "#5a7a10" },
  { bg: "#d0e4e7", light: "rgba(208,228,231,0.2)", text: "#3d6b73" },
  { bg: "#f6dab9", light: "rgba(246,218,185,0.2)", text: "#8a6030" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-all"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/all");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    enabled: status === "authenticated",
    staleTime: 2 * 60 * 1000,
  });

  const stats = data?.stats;
  const taskData = data?.tasks;
  const recentData = data?.recent;
  const loading = isLoading;

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
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const firstName = user.name?.split(" ")[0] || "there";

  const statCards = [
    {
      label: "Active Clients",
      value: stats?.clientCount || 0,
      href: "/clients",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={STAT_ACCENTS[0].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      accent: STAT_ACCENTS[0],
    },
    {
      label: "Active Projects",
      value: stats?.activeProjects || 0,
      href: "/projects",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={STAT_ACCENTS[1].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      accent: STAT_ACCENTS[1],
    },
    {
      label: "Active Tasks",
      value: taskData?.taskSummary?.total || 0,
      href: "/tasks",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={STAT_ACCENTS[2].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      accent: STAT_ACCENTS[2],
    },
    {
      label: isSuperAdmin ? "Team Members" : "Total Projects",
      value: isSuperAdmin ? (stats?.teamCount || 0) : (stats?.projectCount || 0),
      href: isSuperAdmin ? "/team" : "/projects",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={STAT_ACCENTS[3].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isSuperAdmin ? (
            <>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
          ) : (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
            </>
          )}
        </svg>
      ),
      accent: STAT_ACCENTS[3],
    },
  ];

  return (
    <>
      <style>{`
        .welcome-banner {
          background: linear-gradient(135deg, #76527c 0%, #5f4263 60%, #4a3350 100%);
          border-radius: 16px;
          padding: 32px 36px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          color: #fff;
        }

        .welcome-banner::before {
          content: '';
          position: absolute;
          top: -40%;
          right: -10%;
          width: 50%;
          height: 160%;
          background: radial-gradient(ellipse, rgba(216,238,145,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .welcome-banner::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: 20%;
          width: 40%;
          height: 120%;
          background: radial-gradient(ellipse, rgba(208,228,231,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .welcome-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          z-index: 1;
        }

        .welcome-banner h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 30px;
          font-weight: 400;
          margin: 0 0 6px 0;
          color: #fff;
        }

        .welcome-banner .date-text {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          margin: 0;
        }

        .welcome-summary {
          display: flex;
          gap: 28px;
          margin-top: 24px;
          position: relative;
          z-index: 1;
        }

        .welcome-summary-item {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.2s ease;
          cursor: pointer;
        }

        .welcome-summary-item:hover {
          background: rgba(255,255,255,0.1);
        }

        .summary-num {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: #d8ee91;
          line-height: 1;
        }

        .summary-label {
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .summary-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.12);
        }

        .quick-actions {
          display: flex;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
        }

        .quick-action-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.3);
        }

        .priority-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .dash-main {
          font-family: 'DM Sans', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 24px 48px;
        }

        .dash-greeting {
          margin-bottom: 28px;
        }

        .dash-greeting h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          font-weight: 400;
          color: #1a1a1a;
          margin: 0 0 4px 0;
        }

        .dash-greeting p {
          font-size: 14px;
          color: #9aa0a6;
          margin: 0;
        }

        .dash-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #fff;
          border-radius: 14px;
          padding: 22px 24px;
          text-decoration: none;
          color: inherit;
          border: 1px solid #e8eaed;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          border-color: transparent;
        }

        .stat-card:hover::after {
          opacity: 1;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          color: #1a1a1a;
          margin-bottom: 2px;
          line-height: 1;
        }

        .stat-label {
          font-size: 13px;
          color: #9aa0a6;
          letter-spacing: 0.01em;
        }

        .dash-section {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #e8eaed;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }

        .dash-section:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }

        .section-header {
          padding: 18px 24px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .section-link {
          font-size: 13px;
          color: #76527c;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .section-link:hover {
          color: #5f4263;
        }

        .task-alert-header {
          padding: 14px 24px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .task-alert-header.overdue {
          background: #fff5f5;
        }

        .task-alert-header.today {
          background: #fffbeb;
        }

        .task-alert-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .task-alert-text {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
        }

        .task-item {
          padding: 12px 24px;
          display: block;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
        }

        .task-item:hover {
          background: #fafafa;
        }

        .task-item + .task-item {
          border-top: 1px solid #f5f5f5;
        }

        .task-name {
          font-size: 13px;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 2px;
        }

        .task-meta {
          font-size: 11px;
          color: #9aa0a6;
        }

        .project-row {
          padding: 16px 24px;
          display: block;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
        }

        .project-row:hover {
          background: #fafafa;
        }

        .project-row + .project-row {
          border-top: 1px solid #f5f5f5;
        }

        .project-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .project-name {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 2px;
        }

        .project-client {
          font-size: 12px;
          color: #9aa0a6;
        }

        .status-badge {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .progress-track {
          height: 5px;
          background: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #76527c, #d8ee91);
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .client-row {
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
        }

        .client-row:hover {
          background: #fafafa;
        }

        .client-row + .client-row {
          border-top: 1px solid #f5f5f5;
        }

        .client-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 600;
          font-size: 15px;
          flex-shrink: 0;
        }

        .client-name {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 2px;
        }

        .client-industry {
          font-size: 12px;
          color: #9aa0a6;
        }

        .empty-state {
          padding: 48px 24px;
          text-align: center;
          color: #c0c0c0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .dash-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f8f8f8" }}>
        <Header />

        <main className="dash-main">
          {/* Welcome Banner */}
          <div className="welcome-banner" style={{
            opacity: mounted ? 1 : 0,
            transform: `translateY(${mounted ? 0 : 16}px)`,
            transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <div className="welcome-top">
              <div>
                <h1>{getGreeting()}, {firstName}</h1>
                <p className="date-text">{getDateString()}</p>
              </div>
              <div className="quick-actions">
                <Link href="/clients" className="quick-action-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Client
                </Link>
                <Link href="/tasks" className="quick-action-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Task
                </Link>
                <Link href="/timesheet" className="quick-action-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Timesheet
                </Link>
              </div>
            </div>
            {!loading && (
              <div className="welcome-summary">
                <Link href="/clients" className="welcome-summary-item">
                  <span className="summary-num">{stats?.clientCount || 0}</span>
                  <span className="summary-label">Clients</span>
                </Link>
                <div className="summary-divider" />
                <Link href="/projects" className="welcome-summary-item">
                  <span className="summary-num">{stats?.activeProjects || 0}</span>
                  <span className="summary-label">Projects</span>
                </Link>
                <div className="summary-divider" />
                <Link href="/tasks" className="welcome-summary-item">
                  <span className="summary-num">{taskData?.taskSummary?.total || 0}</span>
                  <span className="summary-label">Tasks</span>
                </Link>
                {taskData?.taskSummary?.overdue > 0 && (
                  <>
                    <div className="summary-divider" />
                    <Link href="/tasks" className="welcome-summary-item">
                      <span className="summary-num" style={{ color: "#ff9a9a" }}>{taskData.taskSummary.overdue}</span>
                      <span className="summary-label">Overdue</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Task Alerts */}
          {!loading && taskData && (taskData.taskSummary.overdue > 0 || taskData.taskSummary.dueToday > 0) && (
            <div style={{
              display: "grid",
              gridTemplateColumns: taskData.taskSummary.overdue > 0 && taskData.taskSummary.dueToday > 0 ? "1fr 1fr" : "1fr",
              gap: 16,
              marginBottom: 24,
              opacity: mounted ? 1 : 0,
              transform: `translateY(${mounted ? 0 : 12}px)`,
              transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s",
            }}>
              {/* Overdue */}
              {taskData.taskSummary.overdue > 0 && (
                <div className="dash-section">
                  <div className="task-alert-header overdue">
                    <div className="task-alert-dot" style={{ background: "#ea4335" }} />
                    <h2 className="task-alert-text" style={{ color: "#c62828" }}>
                      Overdue ({taskData.taskSummary.overdue})
                    </h2>
                  </div>
                  {taskData.overdueTasks.map((task: Task) => (
                    <Link key={task.id} href={`/clients/${task.client.id}`} className="task-item">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="task-name">{task.name}</div>
                          <div className="task-meta">
                            {task.client.name} &middot; Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                          </div>
                        </div>
                        {task.priority && (
                          <span className="priority-pill" style={{
                            background: PRIORITY_STYLES[task.priority]?.bg || "#f5f5f5",
                            color: PRIORITY_STYLES[task.priority]?.color || "#666",
                          }}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Due Today */}
              {taskData.taskSummary.dueToday > 0 && (
                <div className="dash-section">
                  <div className="task-alert-header today">
                    <div className="task-alert-dot" style={{ background: "#f9ab00" }} />
                    <h2 className="task-alert-text" style={{ color: "#92400E" }}>
                      Due Today ({taskData.taskSummary.dueToday})
                    </h2>
                  </div>
                  {taskData.dueTodayTasks.map((task: Task) => (
                    <Link key={task.id} href={`/clients/${task.client.id}`} className="task-item">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="task-name">{task.name}</div>
                          <div className="task-meta">{task.client.name}</div>
                        </div>
                        {task.priority && (
                          <span className="priority-pill" style={{
                            background: PRIORITY_STYLES[task.priority]?.bg || "#f5f5f5",
                            color: PRIORITY_STYLES[task.priority]?.color || "#666",
                          }}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects & Clients */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 16,
            opacity: mounted ? 1 : 0,
            transform: `translateY(${mounted ? 0 : 12}px)`,
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s",
          }}>
            {/* Recent Projects */}
            <div className="dash-section">
              <div className="section-header">
                <h2 className="section-title">Recent Projects</h2>
                <Link href="/projects" className="section-link">View all &rarr;</Link>
              </div>

              {loading ? (
                <div className="empty-state">Loading...</div>
              ) : !recentData?.recentProjects?.length ? (
                <div className="empty-state">No projects yet</div>
              ) : (
                recentData.recentProjects.map((project: Project) => {
                  const completed = project.stages.filter((s) => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`} className="project-row">
                      <div className="project-info">
                        <div>
                          <div className="project-name">{project.name}</div>
                          <div className="project-client">{project.client.name}</div>
                        </div>
                        <span
                          className="status-badge"
                          style={{
                            background: STATUS_STYLES[project.status]?.bg || "#f5f5f5",
                            color: STATUS_STYLES[project.status]?.color || "#666",
                          }}
                        >
                          {project.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="progress-track" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#9aa0a6", fontWeight: 500, minWidth: 32, textAlign: "right" }}>{pct}%</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Recent Clients */}
            <div className="dash-section">
              <div className="section-header">
                <h2 className="section-title">Recent Clients</h2>
                <Link href="/clients" className="section-link">View all &rarr;</Link>
              </div>

              {loading ? (
                <div className="empty-state">Loading...</div>
              ) : !recentData?.recentClients?.length ? (
                <div className="empty-state">No clients yet</div>
              ) : (
                recentData.recentClients.map((client: Client) => {
                  // Rotating avatar colors from Wick palette
                  const avatarColors = ["#76527c", "#5f4263", "#3d6b73", "#8a6030"];
                  const colorIdx = client.name.charCodeAt(0) % avatarColors.length;
                  return (
                    <Link key={client.id} href={`/clients/${client.id}`} className="client-row">
                      <div className="client-avatar" style={{ background: avatarColors[colorIdx] }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="client-name">{client.nickname || client.name}</div>
                        <div className="client-industry">{client.industry || "No industry"}</div>
                      </div>
                      <span
                        className="status-badge"
                        style={{
                          background: STATUS_STYLES[client.status]?.bg || "#f5f5f5",
                          color: STATUS_STYLES[client.status]?.color || "#666",
                        }}
                      >
                        {client.status}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
