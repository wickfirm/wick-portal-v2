"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/Header";
import { STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

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

// Animated counter component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayValue}</>;
}

// Circular progress component
function CircularProgress({ value, max, size = 120, strokeWidth = 8, color = "#7c3aed", trackColor = "rgba(0,0,0,0.08)" }: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
    </svg>
  );
}

// Theme toggle component
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="theme-toggle"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setMounted(true);
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem("dashboard-theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("dashboard-theme", newTheme ? "dark" : "light");
  };

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
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: "#64748b" }}>
            <div className="loading-spinner" />
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(user.role);
  const firstName = user.name?.split(" ")[0] || "there";

  const overdueCount = taskData?.taskSummary?.overdue || 0;
  const todayCount = taskData?.taskSummary?.dueToday || 0;
  const totalActive = taskData?.taskSummary?.total || 0;

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 20}px)`,
    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

        .dash {
          --bg-primary: #f8fafc;
          --bg-secondary: #ffffff;
          --bg-tertiary: #f1f5f9;
          --bg-hover: #e2e8f0;
          --text-primary: #0f172a;
          --text-secondary: #334155;
          --text-muted: #64748b;
          --text-faint: #94a3b8;
          --border: #e2e8f0;
          --border-hover: #cbd5e1;
          --shadow: rgba(0, 0, 0, 0.04);
          --shadow-hover: rgba(0, 0, 0, 0.08);
          --accent: #7c3aed;
          --accent-light: #a78bfa;
          --accent-bg: rgba(124, 58, 237, 0.08);
          --gradient-bg: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.08), transparent);
          --progress-track: rgba(0, 0, 0, 0.06);
          min-height: 100vh;
          background: var(--bg-primary);
          position: relative;
          overflow-x: hidden;
          transition: all 0.3s ease;
        }

        .dash.dark {
          --bg-primary: #0a0a0f;
          --bg-secondary: rgba(255,255,255,0.03);
          --bg-tertiary: rgba(255,255,255,0.05);
          --bg-hover: rgba(255,255,255,0.08);
          --text-primary: #ffffff;
          --text-secondary: rgba(255,255,255,0.8);
          --text-muted: rgba(255,255,255,0.5);
          --text-faint: rgba(255,255,255,0.3);
          --border: rgba(255,255,255,0.06);
          --border-hover: rgba(255,255,255,0.12);
          --shadow: rgba(0, 0, 0, 0.2);
          --shadow-hover: rgba(0, 0, 0, 0.4);
          --accent-bg: rgba(124, 58, 237, 0.15);
          --gradient-bg: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.15), transparent);
          --progress-track: rgba(255,255,255,0.1);
          background: linear-gradient(180deg, #0a0a0f 0%, #0f0f18 50%, #0a0a0f 100%);
        }

        .dash::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 600px;
          background: var(--gradient-bg);
          pointer-events: none;
          z-index: 0;
        }

        .dash-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 32px 64px;
          position: relative;
          z-index: 1;
        }

        /* Theme Toggle */
        .theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .theme-toggle:hover {
          background: var(--bg-hover);
          border-color: var(--border-hover);
          color: var(--accent);
        }

        /* Header Section */
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .dash-greeting h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 36px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .dash-greeting h1 span {
          background: linear-gradient(135deg, #7c3aed, #a78bfa, #c4b5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dash-greeting p {
          font-size: 15px;
          color: var(--text-muted);
          margin: 0;
        }

        .dash-actions {
          display: flex;
          gap: 10px;
        }

        .dash-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .dash-btn:hover {
          background: var(--bg-hover);
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }

        .dash-btn.primary {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border-color: transparent;
          color: #fff;
        }

        .dash-btn.primary:hover {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.35);
        }

        /* Bento Grid */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: minmax(100px, auto);
          gap: 16px;
        }

        .bento-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dash.dark .bento-card {
          backdrop-filter: blur(20px);
        }

        .bento-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-hover), transparent);
        }

        .bento-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px var(--shadow-hover);
        }

        .bento-card.clickable {
          cursor: pointer;
        }

        /* Stat Cards */
        .stat-card {
          grid-column: span 3;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .stat-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 42px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-muted);
        }

        .stat-trend {
          position: absolute;
          top: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .stat-trend.up {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .dash.dark .stat-trend.up {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .stat-trend.down {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .dash.dark .stat-trend.down {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        /* Time Card */
        .time-card {
          grid-column: span 4;
          grid-row: span 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: var(--accent-bg);
        }

        .dash.dark .time-card {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(139, 92, 246, 0.05));
        }

        .time-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 64px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
          position: absolute;
        }

        .time-label {
          font-size: 14px;
          color: var(--text-muted);
          margin-top: 16px;
        }

        .time-target {
          font-size: 13px;
          color: var(--text-faint);
          margin-top: 4px;
        }

        /* Tasks Card */
        .tasks-card {
          grid-column: span 8;
          grid-row: span 2;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .card-link {
          font-size: 13px;
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .card-link:hover {
          color: var(--accent-light);
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: var(--bg-tertiary);
          border: 1px solid transparent;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .task-item:hover {
          background: var(--bg-hover);
          border-color: var(--border);
          transform: translateX(4px);
        }

        .task-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .task-dot.overdue { background: #ef4444; box-shadow: 0 0 12px rgba(239, 68, 68, 0.4); }
        .task-dot.today { background: #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.4); }
        .task-dot.normal { background: #22c55e; }

        .task-content {
          flex: 1;
          min-width: 0;
        }

        .task-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .task-meta {
          font-size: 12px;
          color: var(--text-muted);
        }

        .task-priority {
          font-size: 10px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Projects Card */
        .projects-card {
          grid-column: span 6;
          grid-row: span 2;
        }

        .project-item {
          display: block;
          padding: 16px;
          background: var(--bg-tertiary);
          border: 1px solid transparent;
          border-radius: 12px;
          text-decoration: none;
          margin-bottom: 10px;
          transition: all 0.2s ease;
        }

        .project-item:last-child {
          margin-bottom: 0;
        }

        .project-item:hover {
          background: var(--bg-hover);
          border-color: var(--border);
        }

        .project-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .project-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .project-client {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .project-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .project-progress {
          height: 4px;
          background: var(--progress-track);
          border-radius: 2px;
          overflow: hidden;
        }

        .project-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        .project-progress-text {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Clients Card */
        .clients-card {
          grid-column: span 6;
          grid-row: span 2;
        }

        .client-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 0;
          text-decoration: none;
          border-bottom: 1px solid var(--border);
          transition: all 0.2s ease;
        }

        .client-item:last-child {
          border-bottom: none;
        }

        .client-item:hover {
          padding-left: 8px;
        }

        .client-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          color: #fff;
          flex-shrink: 0;
        }

        .client-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .client-industry {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* Activity Card */
        .activity-card {
          grid-column: span 4;
          grid-row: span 2;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .activity-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .activity-text strong {
          color: var(--text-primary);
          font-weight: 500;
        }

        .activity-time {
          font-size: 11px;
          color: var(--text-faint);
          margin-top: 4px;
        }

        /* Alert Banner */
        .alert-banner {
          grid-column: span 12;
          display: flex;
          gap: 16px;
          padding: 20px 24px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 16px;
          align-items: center;
        }

        .dash.dark .alert-banner {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
          border-color: rgba(239, 68, 68, 0.2);
        }

        .alert-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dash.dark .alert-icon {
          background: rgba(239, 68, 68, 0.15);
        }

        .alert-content {
          flex: 1;
        }

        .alert-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .alert-text {
          font-size: 14px;
          color: var(--text-muted);
        }

        .alert-action {
          padding: 10px 20px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }

        .dash.dark .alert-action {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .alert-action:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .dash.dark .alert-action:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.4);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted);
          font-size: 14px;
        }

        .empty-state svg {
          stroke: var(--text-faint);
        }

        /* Loading Spinner */
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .stat-card { grid-column: span 6; }
          .time-card { grid-column: span 6; }
          .tasks-card { grid-column: span 6; }
          .projects-card { grid-column: span 6; }
          .clients-card { grid-column: span 6; }
          .activity-card { grid-column: span 6; }
        }

        @media (max-width: 768px) {
          .dash-header { flex-direction: column; gap: 20px; }
          .stat-card { grid-column: span 6; }
          .time-card { grid-column: span 12; }
          .tasks-card { grid-column: span 12; }
          .projects-card { grid-column: span 12; }
          .clients-card { grid-column: span 12; }
          .activity-card { grid-column: span 12; }
          .alert-banner { grid-column: span 12; flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className={`dash ${isDark ? 'dark' : ''}`}>
        <Header />

        <main className="dash-main">
          {/* Header */}
          <div className="dash-header" style={anim(0.05)}>
            <div className="dash-greeting">
              <h1>{getGreeting()}, <span>{firstName}</span></h1>
              <p>{getDateString()}</p>
            </div>
            <div className="dash-actions">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              {isAdmin && (
                <Link href="/clients/new" className="dash-btn primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Client
                </Link>
              )}
              <Link href="/tasks" className="dash-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Tasks
              </Link>
              <Link href="/timesheet" className="dash-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Timesheet
              </Link>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="bento-grid">
            {/* Alert Banner (if overdue tasks) */}
            {!loading && overdueCount > 0 && (
              <div className="alert-banner" style={anim(0.1)}>
                <div className="alert-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="alert-content">
                  <div className="alert-title">{overdueCount} Overdue Task{overdueCount > 1 ? 's' : ''}</div>
                  <div className="alert-text">You have tasks that need immediate attention</div>
                </div>
                <Link href="/tasks" className="alert-action">View Tasks</Link>
              </div>
            )}

            {/* Stat Cards */}
            <Link href="/clients" className="bento-card stat-card clickable" style={anim(0.15)}>
              <div className="stat-icon" style={{ background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(139, 92, 246, 0.08))" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="stat-value">{loading ? "-" : <AnimatedNumber value={stats?.clientCount || 0} />}</div>
              <div className="stat-label">Active Clients</div>
              <div className="stat-trend up">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                </svg>
                +12%
              </div>
            </Link>

            <Link href="/projects" className="bento-card stat-card clickable" style={anim(0.2)}>
              <div className="stat-icon" style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(74, 222, 128, 0.08))" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="stat-value">{loading ? "-" : <AnimatedNumber value={stats?.activeProjects || 0} />}</div>
              <div className="stat-label">Active Projects</div>
              <div className="stat-trend up">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                </svg>
                +8%
              </div>
            </Link>

            <Link href="/tasks" className="bento-card stat-card clickable" style={anim(0.25)}>
              <div className="stat-icon" style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.08))" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="stat-value">{loading ? "-" : <AnimatedNumber value={totalActive} />}</div>
              <div className="stat-label">Open Tasks</div>
              {todayCount > 0 && (
                <div className="stat-trend down" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
                  {todayCount} due today
                </div>
              )}
            </Link>

            {/* Time Logged Today */}
            <div className="bento-card time-card" style={anim(0.3)}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress
                  value={timeToday}
                  max={8}
                  size={160}
                  strokeWidth={10}
                  color="#7c3aed"
                  trackColor={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}
                />
                <div className="time-value">{loading ? "-" : timeToday}h</div>
              </div>
              <div className="time-label">Logged Today</div>
              <div className="time-target">8h daily target</div>
            </div>

            {/* Tasks Needing Attention */}
            <div className="bento-card tasks-card" style={anim(0.35)}>
              <div className="card-header">
                <h3 className="card-title">Needs Attention</h3>
                <Link href="/tasks" className="card-link">View all →</Link>
              </div>
              {loading ? (
                <div className="empty-state"><div className="loading-spinner" /></div>
              ) : !taskData || (taskData.overdueTasks.length === 0 && taskData.dueTodayTasks.length === 0) ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <div>All caught up! No urgent tasks.</div>
                </div>
              ) : (
                <div className="task-list">
                  {taskData.overdueTasks.slice(0, 4).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`} className="task-item">
                      <div className="task-dot overdue" />
                      <div className="task-content">
                        <div className="task-name">{task.name}</div>
                        <div className="task-meta">{task.client.name} · Overdue</div>
                      </div>
                      {task.priority && (
                        <span className="task-priority" style={{
                          background: PRIORITY_STYLES[task.priority]?.bg || "rgba(0,0,0,0.05)",
                          color: PRIORITY_STYLES[task.priority]?.color || "#64748b",
                        }}>{task.priority}</span>
                      )}
                    </Link>
                  ))}
                  {taskData.dueTodayTasks.slice(0, 3).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`} className="task-item">
                      <div className="task-dot today" />
                      <div className="task-content">
                        <div className="task-name">{task.name}</div>
                        <div className="task-meta">{task.client.name} · Due today</div>
                      </div>
                      {task.priority && (
                        <span className="task-priority" style={{
                          background: PRIORITY_STYLES[task.priority]?.bg || "rgba(0,0,0,0.05)",
                          color: PRIORITY_STYLES[task.priority]?.color || "#64748b",
                        }}>{task.priority}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Projects */}
            <div className="bento-card projects-card" style={anim(0.4)}>
              <div className="card-header">
                <h3 className="card-title">Recent Projects</h3>
                <Link href="/projects" className="card-link">View all →</Link>
              </div>
              {loading ? (
                <div className="empty-state"><div className="loading-spinner" /></div>
              ) : !recentData?.recentProjects?.length ? (
                <div className="empty-state">No projects yet</div>
              ) : (
                recentData.recentProjects.slice(0, 3).map((project) => {
                  const completed = project.stages.filter((s) => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`} className="project-item">
                      <div className="project-top">
                        <div>
                          <div className="project-name">{project.name}</div>
                          <div className="project-client">{project.client.nickname || project.client.name}</div>
                        </div>
                        <span className="project-badge" style={{
                          background: STATUS_STYLES[project.status]?.bg || "rgba(0,0,0,0.05)",
                          color: STATUS_STYLES[project.status]?.color || "#64748b",
                        }}>{project.status.replace(/_/g, " ")}</span>
                      </div>
                      <div className="project-progress">
                        <div className="project-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="project-progress-text">
                        <span>{completed} of {total} stages</span>
                        <span>{pct}%</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Recent Clients */}
            <div className="bento-card clients-card" style={anim(0.45)}>
              <div className="card-header">
                <h3 className="card-title">Recent Clients</h3>
                <Link href="/clients" className="card-link">View all →</Link>
              </div>
              {loading ? (
                <div className="empty-state"><div className="loading-spinner" /></div>
              ) : !recentData?.recentClients?.length ? (
                <div className="empty-state">No clients yet</div>
              ) : (
                recentData.recentClients.slice(0, 4).map((client) => {
                  const colors = [
                    "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    "linear-gradient(135deg, #ec4899, #be185d)",
                    "linear-gradient(135deg, #06b6d4, #0891b2)",
                    "linear-gradient(135deg, #f59e0b, #d97706)",
                    "linear-gradient(135deg, #22c55e, #16a34a)",
                  ];
                  const colorIdx = client.name.charCodeAt(0) % colors.length;
                  return (
                    <Link key={client.id} href={`/clients/${client.id}`} className="client-item">
                      <div className="client-avatar" style={{ background: colors[colorIdx] }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="client-name">{client.nickname || client.name}</div>
                        <div className="client-industry">{client.industry || client.status}</div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Activity Feed */}
            <div className="bento-card activity-card" style={anim(0.5)}>
              <div className="card-header">
                <h3 className="card-title">Activity</h3>
              </div>
              {!activity || activity.length === 0 ? (
                <div className="empty-state">No recent activity</div>
              ) : (
                activity.slice(0, 5).map((a) => (
                  <div key={a.id} className="activity-item">
                    <div className="activity-dot" style={{
                      background: a.activityType === "task_complete" ? "#22c55e"
                        : a.activityType === "sod" ? "#7c3aed"
                        : a.activityType === "eod" ? "#f59e0b"
                        : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
                    }} />
                    <div>
                      <div className="activity-text">
                        <strong>{a.user.name || "Someone"}</strong>{" "}
                        {a.activityType === "sod" ? "started their day"
                          : a.activityType === "eod" ? "wrapped up"
                          : a.activityType === "task_complete" ? "completed a task"
                          : a.activityType === "focus_change" ? "changed focus"
                          : a.content || "did something"}
                      </div>
                      <div className="activity-time">{timeAgo(a.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
