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
  status: string;
  client: { id: string; name: string };
};

type TaskData = {
  overdueTasks: Task[];
  dueTodayTasks: Task[];
  taskSummary: {
    total: number;
    overdue: number;
    dueToday: number;
    completedThisWeek: number;
  };
};

type Project = {
  id: string;
  name: string;
  status: string;
  client: { id: string; name: string; nickname: string | null };
  stages: { id: string; isCompleted: boolean }[];
};

type Client = {
  id: string;
  name: string;
  nickname: string | null;
  status: string;
  industry: string | null;
};

type Activity = {
  id: string;
  activityType: string;
  content: string | null;
  createdAt: string;
  user: { name: string | null };
};

type RecentData = {
  recentProjects: Project[];
  recentClients: Client[];
};

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function activityIcon(type: string): string {
  switch (type) {
    case "sod": return "sunrise";
    case "eod": return "sunset";
    case "task_complete": return "check";
    case "focus_change": return "focus";
    default: return "activity";
  }
}

// Mini sparkline SVG component (decorative, shows a trend line)
function Sparkline({ color, trend }: { color: string; trend: "up" | "down" | "flat" }) {
  const paths = {
    up: "M0 20 L8 16 L16 18 L24 12 L32 14 L40 8 L48 4",
    down: "M0 4 L8 8 L16 6 L24 12 L32 14 L40 18 L48 20",
    flat: "M0 12 L8 10 L16 14 L24 11 L32 13 L40 10 L48 12",
  };
  return (
    <svg width="48" height="24" viewBox="0 0 48 24" fill="none" style={{ opacity: 0.6 }}>
      <path d={paths[trend]} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Stat card accent configs
const STAT_CONFIGS = [
  { bg: "rgba(118,82,124,0.08)", border: "rgba(118,82,124,0.12)", color: "#76527c", trend: "up" as const },
  { bg: "rgba(52,168,83,0.08)", border: "rgba(52,168,83,0.12)", color: "#34a853", trend: "up" as const },
  { bg: "rgba(64,107,115,0.08)", border: "rgba(64,107,115,0.12)", color: "#3d6b73", trend: "flat" as const },
  { bg: "rgba(138,96,48,0.08)", border: "rgba(138,96,48,0.12)", color: "#8a6030", trend: "up" as const },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => { setMounted(true); }, []);

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

  const stats: Stats | undefined = data?.stats;
  const taskData: TaskData | undefined = data?.tasks;
  const recentData: RecentData | undefined = data?.recent;
  const activity: Activity[] = data?.activity || [];
  const timeToday: number = data?.timeToday || 0;
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

  const overdueCount = taskData?.taskSummary?.overdue || 0;
  const todayCount = taskData?.taskSummary?.dueToday || 0;
  const completedWeek = taskData?.taskSummary?.completedThisWeek || 0;
  const totalActive = taskData?.taskSummary?.total || 0;

  const statCards = [
    {
      label: "Active Clients",
      value: stats?.clientCount || 0,
      href: "/clients",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      config: STAT_CONFIGS[0],
    },
    {
      label: "Active Projects",
      value: stats?.activeProjects || 0,
      href: "/projects",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
      config: STAT_CONFIGS[1],
    },
    {
      label: "Open Tasks",
      value: totalActive,
      href: "/tasks",
      subtitle: overdueCount > 0 ? `${overdueCount} overdue` : undefined,
      subtitleColor: overdueCount > 0 ? theme.colors.error : undefined,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      config: STAT_CONFIGS[2],
    },
    {
      label: isSuperAdmin ? "Team Members" : "Total Projects",
      value: isSuperAdmin ? (stats?.teamCount || 0) : (stats?.projectCount || 0),
      href: isSuperAdmin ? "/team" : "/projects",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isSuperAdmin ? (
            <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>
          ) : (
            <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></>
          )}
        </svg>
      ),
      config: STAT_CONFIGS[3],
    },
  ];

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  return (
    <>
      <style>{`
        .db-main {
          font-family: 'DM Sans', -apple-system, sans-serif;
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 28px 48px;
        }

        /* --- Top Section: Greeting + Quick Actions --- */
        .db-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .db-greeting h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          font-weight: 400;
          color: ${theme.colors.textPrimary};
          margin: 0 0 4px 0;
        }
        .db-greeting p {
          font-size: 14px;
          color: ${theme.colors.textMuted};
          margin: 0;
        }
        .db-actions {
          display: flex;
          gap: 8px;
        }
        .db-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: ${theme.colors.bgSecondary};
          border: 1px solid ${theme.colors.borderLight};
          border-radius: 10px;
          color: ${theme.colors.textSecondary};
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .db-action-btn:hover {
          border-color: ${theme.colors.primary};
          color: ${theme.colors.primary};
          box-shadow: 0 2px 8px rgba(118,82,124,0.1);
        }
        .db-action-btn.primary {
          background: ${theme.colors.primary};
          border-color: ${theme.colors.primary};
          color: #fff;
        }
        .db-action-btn.primary:hover {
          background: ${theme.colors.primaryDark};
          border-color: ${theme.colors.primaryDark};
          color: #fff;
          box-shadow: 0 4px 12px rgba(118,82,124,0.25);
        }

        /* --- Focus Banner (overdue/today summary) --- */
        .db-focus {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .db-focus-card {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1px solid;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .db-focus-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .db-focus-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .db-focus-num {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          line-height: 1;
        }
        .db-focus-label {
          font-size: 12px;
          margin-top: 2px;
        }

        /* --- Stat Cards --- */
        .db-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .db-stat {
          background: ${theme.colors.bgSecondary};
          border-radius: 14px;
          padding: 20px 22px;
          text-decoration: none;
          color: inherit;
          border: 1px solid ${theme.colors.borderLight};
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .db-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          border-color: transparent;
        }
        .db-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        .db-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .db-stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          color: ${theme.colors.textPrimary};
          line-height: 1;
          margin-bottom: 4px;
        }
        .db-stat-label {
          font-size: 13px;
          color: ${theme.colors.textMuted};
        }
        .db-stat-sub {
          font-size: 11px;
          font-weight: 500;
          margin-top: 4px;
        }

        /* --- Grid Layout: Main + Sidebar --- */
        .db-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
        }
        .db-grid-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .db-grid-side {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* --- Section Cards --- */
        .db-card {
          background: ${theme.colors.bgSecondary};
          border-radius: 14px;
          border: 1px solid ${theme.colors.borderLight};
          overflow: hidden;
        }
        .db-card-head {
          padding: 16px 20px;
          border-bottom: 1px solid ${theme.colors.bgTertiary};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .db-card-title {
          font-size: 14px;
          font-weight: 600;
          color: ${theme.colors.textPrimary};
          margin: 0;
        }
        .db-card-link {
          font-size: 12px;
          color: ${theme.colors.primary};
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .db-card-link:hover {
          color: ${theme.colors.primaryDark};
        }

        /* --- Task Rows --- */
        .db-task-row {
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          transition: background 0.12s;
        }
        .db-task-row:hover { background: ${theme.colors.bgPrimary}; }
        .db-task-row + .db-task-row { border-top: 1px solid ${theme.colors.bgTertiary}; }
        .db-task-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .db-task-name {
          font-size: 13px;
          font-weight: 500;
          color: ${theme.colors.textPrimary};
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .db-task-client {
          font-size: 11px;
          color: ${theme.colors.textMuted};
        }
        .db-task-priority {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        /* --- Project Rows --- */
        .db-proj-row {
          padding: 14px 20px;
          display: block;
          text-decoration: none;
          color: inherit;
          transition: background 0.12s;
        }
        .db-proj-row:hover { background: ${theme.colors.bgPrimary}; }
        .db-proj-row + .db-proj-row { border-top: 1px solid ${theme.colors.bgTertiary}; }
        .db-proj-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .db-proj-name {
          font-size: 13px;
          font-weight: 500;
          color: ${theme.colors.textPrimary};
        }
        .db-proj-client {
          font-size: 11px;
          color: ${theme.colors.textMuted};
          margin-top: 1px;
        }
        .db-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .db-progress {
          height: 4px;
          background: ${theme.colors.bgTertiary};
          border-radius: 2px;
          overflow: hidden;
        }
        .db-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${theme.colors.primary}, #d8ee91);
          border-radius: 2px;
          transition: width 0.4s ease;
        }

        /* --- Client Rows --- */
        .db-client-row {
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          transition: background 0.12s;
        }
        .db-client-row:hover { background: ${theme.colors.bgPrimary}; }
        .db-client-row + .db-client-row { border-top: 1px solid ${theme.colors.bgTertiary}; }
        .db-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }
        .db-client-name {
          font-size: 13px;
          font-weight: 500;
          color: ${theme.colors.textPrimary};
        }
        .db-client-sub {
          font-size: 11px;
          color: ${theme.colors.textMuted};
        }

        /* --- Activity Feed --- */
        .db-activity-row {
          padding: 10px 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .db-activity-row + .db-activity-row { border-top: 1px solid ${theme.colors.bgTertiary}; }
        .db-activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${theme.colors.primary};
          flex-shrink: 0;
          margin-top: 5px;
        }
        .db-activity-text {
          font-size: 12px;
          color: ${theme.colors.textSecondary};
          line-height: 1.4;
        }
        .db-activity-text strong {
          color: ${theme.colors.textPrimary};
          font-weight: 500;
        }
        .db-activity-time {
          font-size: 11px;
          color: ${theme.colors.textMuted};
          margin-top: 2px;
        }

        /* --- Hours Card --- */
        .db-hours {
          padding: 22px 20px;
          text-align: center;
        }
        .db-hours-value {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          color: ${theme.colors.primary};
          line-height: 1;
        }
        .db-hours-label {
          font-size: 12px;
          color: ${theme.colors.textMuted};
          margin-top: 6px;
        }
        .db-hours-bar {
          margin-top: 16px;
          height: 6px;
          background: ${theme.colors.bgTertiary};
          border-radius: 3px;
          overflow: hidden;
        }
        .db-hours-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        /* --- Empty State --- */
        .db-empty {
          padding: 36px 20px;
          text-align: center;
          color: ${theme.colors.textMuted};
          font-size: 13px;
        }

        /* --- Responsive --- */
        @media (max-width: 1024px) {
          .db-grid { grid-template-columns: 1fr; }
          .db-grid-side { flex-direction: row; }
          .db-grid-side > * { flex: 1; }
        }
        @media (max-width: 768px) {
          .db-stats { grid-template-columns: repeat(2, 1fr); }
          .db-top { flex-direction: column; gap: 16px; }
          .db-focus { flex-direction: column; }
          .db-grid-side { flex-direction: column; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />

        <main className="db-main">
          {/* Top: Greeting + Quick Actions */}
          <div className="db-top" style={anim(0.05)}>
            <div className="db-greeting">
              <h1>{getGreeting()}, {firstName}</h1>
              <p>{getDateString()}</p>
            </div>
            <div className="db-actions">
              <Link href="/clients/new" className="db-action-btn primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Client
              </Link>
              <Link href="/tasks" className="db-action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/></svg>
                Tasks
              </Link>
              <Link href="/timesheet" className="db-action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Timesheet
              </Link>
            </div>
          </div>

          {/* Focus Banner: Overdue + Due Today + Completed This Week */}
          {!loading && (overdueCount > 0 || todayCount > 0 || completedWeek > 0) && (
            <div className="db-focus" style={anim(0.1)}>
              {overdueCount > 0 && (
                <Link href="/tasks" className="db-focus-card" style={{ background: theme.colors.errorBg, borderColor: "rgba(234,67,53,0.15)" }}>
                  <div className="db-focus-icon" style={{ background: "rgba(234,67,53,0.12)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.error} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </div>
                  <div>
                    <div className="db-focus-num" style={{ color: theme.colors.error }}>{overdueCount}</div>
                    <div className="db-focus-label" style={{ color: "#c62828" }}>Overdue tasks</div>
                  </div>
                </Link>
              )}
              {todayCount > 0 && (
                <Link href="/tasks" className="db-focus-card" style={{ background: theme.colors.warningBg, borderColor: "rgba(249,171,0,0.15)" }}>
                  <div className="db-focus-icon" style={{ background: "rgba(249,171,0,0.12)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.warning} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </div>
                  <div>
                    <div className="db-focus-num" style={{ color: "#92400E" }}>{todayCount}</div>
                    <div className="db-focus-label" style={{ color: "#92400E" }}>Due today</div>
                  </div>
                </Link>
              )}
              {completedWeek > 0 && (
                <Link href="/tasks" className="db-focus-card" style={{ background: theme.colors.successBg, borderColor: "rgba(52,168,83,0.15)" }}>
                  <div className="db-focus-icon" style={{ background: "rgba(52,168,83,0.12)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.success} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  </div>
                  <div>
                    <div className="db-focus-num" style={{ color: theme.colors.success }}>{completedWeek}</div>
                    <div className="db-focus-label" style={{ color: "#1b5e20" }}>Completed this week</div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Stat Cards */}
          <div className="db-stats" style={anim(0.15)}>
            {statCards.map((s, i) => (
              <Link key={i} href={s.href} className="db-stat">
                <div className="db-stat-top">
                  <div className="db-stat-icon" style={{ background: s.config.bg }}>
                    <span style={{ color: s.config.color }}>{s.icon}</span>
                  </div>
                  <Sparkline color={s.config.color} trend={s.config.trend} />
                </div>
                <div className="db-stat-value">{loading ? "-" : s.value}</div>
                <div className="db-stat-label">{s.label}</div>
                {"subtitle" in s && s.subtitle && (
                  <div className="db-stat-sub" style={{ color: s.subtitleColor }}>{s.subtitle}</div>
                )}
              </Link>
            ))}
          </div>

          {/* Main Grid: Content + Sidebar */}
          <div className="db-grid" style={anim(0.25)}>
            {/* --- Left Column --- */}
            <div className="db-grid-main">
              {/* Task Alerts (combined) */}
              {!loading && taskData && (taskData.overdueTasks.length > 0 || taskData.dueTodayTasks.length > 0) && (
                <div className="db-card">
                  <div className="db-card-head">
                    <h3 className="db-card-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.error} strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: -2, marginRight: 8 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Needs Attention
                    </h3>
                    <Link href="/tasks" className="db-card-link">View all &rarr;</Link>
                  </div>
                  {taskData.overdueTasks.slice(0, 5).map((task) => (
                    <Link key={task.id} href={`/clients/${task.client.id}`} className="db-task-row">
                      <div className="db-task-dot" style={{ background: theme.colors.error }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="db-task-name">{task.name}</div>
                        <div className="db-task-client">{task.client.name} &middot; {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "No date"}</div>
                      </div>
                      {task.priority && (
                        <span className="db-task-priority" style={{
                          background: PRIORITY_STYLES[task.priority]?.bg || "#f5f5f5",
                          color: PRIORITY_STYLES[task.priority]?.color || "#666",
                        }}>{task.priority}</span>
                      )}
                    </Link>
                  ))}
                  {taskData.dueTodayTasks.slice(0, 3).map((task) => (
                    <Link key={task.id} href={`/clients/${task.client.id}`} className="db-task-row">
                      <div className="db-task-dot" style={{ background: theme.colors.warning }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="db-task-name">{task.name}</div>
                        <div className="db-task-client">{task.client.name} &middot; Due today</div>
                      </div>
                      {task.priority && (
                        <span className="db-task-priority" style={{
                          background: PRIORITY_STYLES[task.priority]?.bg || "#f5f5f5",
                          color: PRIORITY_STYLES[task.priority]?.color || "#666",
                        }}>{task.priority}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Recent Projects */}
              <div className="db-card">
                <div className="db-card-head">
                  <h3 className="db-card-title">Recent Projects</h3>
                  <Link href="/projects" className="db-card-link">View all &rarr;</Link>
                </div>
                {loading ? (
                  <div className="db-empty">Loading...</div>
                ) : !recentData?.recentProjects?.length ? (
                  <div className="db-empty">No projects yet</div>
                ) : (
                  recentData.recentProjects.map((project) => {
                    const completed = project.stages.filter((s) => s.isCompleted).length;
                    const total = project.stages.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`} className="db-proj-row">
                        <div className="db-proj-top">
                          <div>
                            <div className="db-proj-name">{project.name}</div>
                            <div className="db-proj-client">{project.client.nickname || project.client.name}</div>
                          </div>
                          <span className="db-badge" style={{
                            background: STATUS_STYLES[project.status]?.bg || "#f5f5f5",
                            color: STATUS_STYLES[project.status]?.color || "#666",
                          }}>{project.status.replace(/_/g, " ")}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="db-progress" style={{ flex: 1 }}>
                            <div className="db-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 500, minWidth: 28, textAlign: "right" }}>{pct}%</span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* --- Right Sidebar --- */}
            <div className="db-grid-side">
              {/* Hours Logged Today */}
              <div className="db-card">
                <div className="db-hours">
                  <div className="db-hours-value">{loading ? "-" : timeToday}h</div>
                  <div className="db-hours-label">Logged today</div>
                  <div className="db-hours-bar">
                    <div className="db-hours-fill" style={{
                      width: `${Math.min((timeToday / 8) * 100, 100)}%`,
                      background: timeToday >= 8
                        ? theme.colors.success
                        : timeToday >= 4
                          ? `linear-gradient(90deg, ${theme.colors.primary}, #d8ee91)`
                          : theme.colors.textMuted,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: theme.colors.textMuted }}>0h</span>
                    <span style={{ fontSize: 10, color: theme.colors.textMuted }}>8h target</span>
                  </div>
                </div>
              </div>

              {/* Recent Clients */}
              <div className="db-card">
                <div className="db-card-head">
                  <h3 className="db-card-title">Recent Clients</h3>
                  <Link href="/clients" className="db-card-link">View all &rarr;</Link>
                </div>
                {loading ? (
                  <div className="db-empty">Loading...</div>
                ) : !recentData?.recentClients?.length ? (
                  <div className="db-empty">No clients yet</div>
                ) : (
                  recentData.recentClients.map((client) => {
                    const avatarColors = ["#76527c", "#5f4263", "#3d6b73", "#8a6030", "#34a853"];
                    const colorIdx = client.name.charCodeAt(0) % avatarColors.length;
                    return (
                      <Link key={client.id} href={`/clients/${client.id}`} className="db-client-row">
                        <div className="db-avatar" style={{ background: avatarColors[colorIdx] }}>
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="db-client-name">{client.nickname || client.name}</div>
                          <div className="db-client-sub">{client.industry || client.status}</div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Activity Feed */}
              <div className="db-card">
                <div className="db-card-head">
                  <h3 className="db-card-title">Activity</h3>
                </div>
                {!activity || activity.length === 0 ? (
                  <div className="db-empty">No recent activity</div>
                ) : (
                  activity.slice(0, 6).map((a) => (
                    <div key={a.id} className="db-activity-row">
                      <div className="db-activity-dot" style={{
                        background: a.activityType === "task_complete" ? theme.colors.success
                          : a.activityType === "sod" ? theme.colors.primary
                          : a.activityType === "eod" ? theme.colors.warning
                          : theme.colors.textMuted,
                      }} />
                      <div>
                        <div className="db-activity-text">
                          <strong>{a.user.name || "Someone"}</strong>{" "}
                          {a.activityType === "sod" ? "started their day"
                            : a.activityType === "eod" ? "wrapped up for the day"
                            : a.activityType === "task_complete" ? "completed a task"
                            : a.activityType === "focus_change" ? "changed focus"
                            : a.content || "did something"}
                        </div>
                        <div className="db-activity-time">{timeAgo(a.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
