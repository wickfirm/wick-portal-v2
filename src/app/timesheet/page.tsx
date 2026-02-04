"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import TimesheetGrid from "./timesheet-grid";
import { BarChart, DonutChart, Sparkline } from "@/components/MetricsChart";
import { theme } from "@/lib/theme";

type TimesheetData = {
  timeEntries: any[];
  clients: any[];
  weekDates: string[];
  weekStart: string;
  weekEnd: string;
  viewUser: any;
  teamMembers: any[];
  canViewOthers: boolean;
  monthSummary?: {
    totalsByProject: { projectId: string; projectName: string; clientName: string; totalSeconds: number }[];
    totalsByDay: { date: string; totalSeconds: number }[];
    totalBillable: number;
    totalNonBillable: number;
    dailyAverage: number;
    isMonthView: boolean;
  };
};

type ViewMode = "week" | "month";

// Overtime thresholds
const DAILY_OVERTIME_SECONDS = 8 * 3600; // 8 hours
const WEEKLY_OVERTIME_SECONDS = 40 * 3600; // 40 hours

// Format seconds to h:mm
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

// Format seconds to readable "Xh Ym"
function formatHoursReadable(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// Loading skeleton
function TimesheetPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ width: 200, height: 36, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ width: 300, height: 20, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
        </div>
        {/* Stat cards skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, borderRadius: 12, padding: 20, height: 100 }}>
              <div style={{ width: 60, height: 16, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: 80, height: 28, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ background: theme.colors.bgSecondary, borderRadius: 12, padding: 32, height: 400 }}>
          <div style={{ width: "100%", height: "100%", background: theme.colors.bgTertiary, borderRadius: 8 }} />
        </div>
      </main>
    </div>
  );
}

// Error component
function TimesheetError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{
          background: theme.colors.errorBg,
          border: "1px solid " + theme.colors.error,
          borderRadius: theme.borderRadius.lg,
          padding: 48,
          textAlign: "center",
        }}>
          <div style={{ color: theme.colors.error, marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.error, marginBottom: 8 }}>
            Failed to load timesheet
          </h2>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={retry}
            style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "12px 24px",
              borderRadius: theme.borderRadius.md,
              border: "none",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, iconBg, label, value, subtitle, warning }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subtitle?: string;
  warning?: boolean;
}) {
  return (
    <div style={{
      background: theme.colors.bgSecondary,
      borderRadius: 12,
      padding: "18px 20px",
      border: "1px solid " + (warning ? theme.colors.error + "40" : theme.colors.borderLight),
      ...(warning ? { boxShadow: `0 0 0 1px ${theme.colors.error}20` } : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: theme.colors.textMuted, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 24,
            fontWeight: 400,
            color: warning ? theme.colors.error : theme.colors.textPrimary,
            lineHeight: 1,
          }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: warning ? theme.colors.error : theme.colors.textMuted, marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TimesheetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [week, setWeek] = useState(searchParams.get("week") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(searchParams.get("month") ? "month" : "week");

  // Sync state with URL params when they change
  useEffect(() => {
    setWeek(searchParams.get("week") || "");
    setMonth(searchParams.get("month") || "");
    setUserId(searchParams.get("userId") || "");
    setViewMode(searchParams.get("month") ? "month" : "week");
  }, [searchParams]);

  // Mini calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Quick entry state
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [qeClient, setQeClient] = useState("");
  const [qeProject, setQeProject] = useState("");
  const [qeTask, setQeTask] = useState("");
  const [qeDate, setQeDate] = useState(new Date().toISOString().split("T")[0]);
  const [qeDuration, setQeDuration] = useState("");
  const [qeDescription, setQeDescription] = useState("");
  const [qeProjects, setQeProjects] = useState<any[]>([]);
  const [qeTasks, setQeTasks] = useState<any[]>([]);
  const [isQeSubmitting, setIsQeSubmitting] = useState(false);

  // History state
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Build query string
  const queryString = new URLSearchParams();
  if (viewMode === "month" && month) {
    queryString.set("month", month);
  } else if (week) {
    queryString.set("week", week);
  }
  if (userId) queryString.set("userId", userId);
  const queryStr = queryString.toString();

  // Fetch timesheet data with React Query
  const { data, isLoading, error, refetch } = useQuery<TimesheetData>({
    queryKey: ["timesheet", viewMode, week, month, userId],
    queryFn: async () => {
      const url = `/api/timesheet${queryStr ? `?${queryStr}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch timesheet data");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  // Fetch calendar activity data
  const calMonthStr = `${calendarMonth.year}-${(calendarMonth.month + 1).toString().padStart(2, "0")}`;
  const { data: calendarData } = useQuery<{ dailyTotals: Record<string, number> }>({
    queryKey: ["calendar-activity", calMonthStr, userId],
    queryFn: async () => {
      const params = new URLSearchParams({ month: calMonthStr });
      if (userId) params.set("userId", userId);
      const res = await fetch(`/api/timesheet/calendar-activity?${params}`);
      if (!res.ok) throw new Error("Failed to fetch calendar activity");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  // Fetch weekly history
  const { data: historyData } = useQuery<{ weeks: { weekStart: string; weekEnd: string; totalSeconds: number; billableSeconds: number; entryCount: number; dailyHours: number[]; hasOvertime: boolean }[] }>({
    queryKey: ["timesheet-history", userId],
    queryFn: async () => {
      const params = new URLSearchParams({ weeks: "12" });
      if (userId) params.set("userId", userId);
      const res = await fetch(`/api/timesheet/history?${params}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  // Quick entry: load projects when client changes
  useEffect(() => {
    if (qeClient) {
      setQeProject("");
      setQeTask("");
      setQeProjects([]);
      setQeTasks([]);
      fetch(`/api/projects?clientId=${qeClient}`)
        .then((r) => r.json())
        .then(setQeProjects)
        .catch(console.error);
    }
  }, [qeClient]);

  // Quick entry: load tasks when project changes
  useEffect(() => {
    if (qeProject && qeClient) {
      setQeTask("");
      setQeTasks([]);
      fetch(`/api/clients/${qeClient}/tasks?projectId=${qeProject}`)
        .then((r) => r.json())
        .then((d) => setQeTasks(Array.isArray(d) ? d : []))
        .catch(console.error);
    }
  }, [qeProject, qeClient]);

  if (status === "loading") return <TimesheetPageSkeleton />;
  if (!session) return null;
  if (isLoading) return <TimesheetPageSkeleton />;
  if (error) return <TimesheetError error={error as Error} retry={() => refetch()} />;
  if (!data) return <TimesheetError error={new Error("No data received")} retry={() => refetch()} />;

  const { weekDates, weekStart, weekEnd, viewUser, teamMembers, canViewOthers, timeEntries, clients } = data;

  // Format week range
  const startDate = new Date(weekStart);
  const endDate = new Date(weekEnd);
  const formatWeekRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
  };

  const formatMonthLabel = () => {
    if (month) {
      const [y, m] = month.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Group entries by client/project/task
  const entriesByRow: Record<string, any> = {};
  timeEntries.forEach((entry: any) => {
    const rowKey = `${entry.project.client.id}-${entry.project.id}-${entry.task?.id || "notask"}`;
    if (!entriesByRow[rowKey]) {
      entriesByRow[rowKey] = {
        client: entry.project.client,
        project: entry.project,
        task: entry.task || { id: "notask", name: "No Task" },
        entries: {},
        total: 0,
      };
    }
    const dateKey = new Date(entry.date).toISOString().split("T")[0];
    if (!entriesByRow[rowKey].entries[dateKey]) {
      entriesByRow[rowKey].entries[dateKey] = [];
    }
    entriesByRow[rowKey].entries[dateKey].push({
      id: entry.id,
      duration: entry.duration,
      description: entry.description,
      billable: entry.billable || true,
      source: entry.source || "MANUAL",
    });
    entriesByRow[rowKey].total += entry.duration;
  });

  const serializedEntries = Object.entries(entriesByRow).map(([key, data]) => ({
    key,
    client: data.client,
    project: data.project,
    task: data.task,
    entries: data.entries,
    total: data.total,
  }));

  // Filter
  const filteredEntries = searchQuery.trim()
    ? serializedEntries.filter((row) => {
        const query = searchQuery.toLowerCase();
        return (
          row.client?.name?.toLowerCase().includes(query) ||
          row.client?.nickname?.toLowerCase().includes(query) ||
          row.project?.name?.toLowerCase().includes(query) ||
          row.task?.name?.toLowerCase().includes(query)
        );
      })
    : serializedEntries;

  // Calculate stats
  const totalSeconds = timeEntries.reduce((sum: number, e: any) => sum + e.duration, 0);
  const billableSeconds = timeEntries.filter((e: any) => e.billable).reduce((sum: number, e: any) => sum + e.duration, 0);
  const nonBillableSeconds = totalSeconds - billableSeconds;

  // Daily totals for overtime check
  const dailyTotals: Record<string, number> = {};
  timeEntries.forEach((entry: any) => {
    const dateKey = new Date(entry.date).toISOString().split("T")[0];
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + entry.duration;
  });

  const hasOvertimeDay = Object.values(dailyTotals).some((v) => v > DAILY_OVERTIME_SECONDS);
  const hasOvertimeWeek = totalSeconds > WEEKLY_OVERTIME_SECONDS;
  const workingDays = Object.keys(dailyTotals).filter((k) => dailyTotals[k] > 0).length;
  const dailyAvg = workingDays > 0 ? totalSeconds / workingDays : 0;

  // Navigation
  const goToPreviousWeek = () => {
    const prev = new Date(startDate);
    prev.setDate(prev.getDate() - 7);
    router.push(`/timesheet?week=${prev.toISOString().split("T")[0]}${userId ? "&userId=" + userId : ""}`);
  };
  const goToNextWeek = () => {
    const next = new Date(startDate);
    next.setDate(next.getDate() + 7);
    router.push(`/timesheet?week=${next.toISOString().split("T")[0]}${userId ? "&userId=" + userId : ""}`);
  };
  const goToCurrentWeek = () => {
    router.push(`/timesheet${userId ? "?userId=" + userId : ""}`);
  };
  const goToPreviousMonth = () => {
    const d = month ? new Date(month + "-01") : new Date();
    d.setMonth(d.getMonth() - 1);
    const m = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    setMonth(m);
    router.push(`/timesheet?month=${m}${userId ? "&userId=" + userId : ""}`);
  };
  const goToNextMonth = () => {
    const d = month ? new Date(month + "-01") : new Date();
    d.setMonth(d.getMonth() + 1);
    const m = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    setMonth(m);
    router.push(`/timesheet?month=${m}${userId ? "&userId=" + userId : ""}`);
  };
  const goToCurrentMonth = () => {
    const now = new Date();
    const m = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    setMonth(m);
    router.push(`/timesheet?month=${m}${userId ? "&userId=" + userId : ""}`);
  };

  const switchToWeek = () => {
    setViewMode("week");
    router.push(`/timesheet${userId ? "?userId=" + userId : ""}`);
  };
  const switchToMonth = () => {
    setViewMode("month");
    const now = new Date();
    const m = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    setMonth(m);
    router.push(`/timesheet?month=${m}${userId ? "&userId=" + userId : ""}`);
  };

  const currentUser = session.user as any;

  // ── Calendar helpers ──
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function getMonthGrid(year: number, mo: number): Date[][] {
    const first = new Date(year, mo, 1);
    const day = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - ((day === 0 ? 7 : day) - 1)); // Monday start
    const weeks: Date[][] = [];
    const cursor = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
      const wk: Date[] = [];
      for (let d = 0; d < 7; d++) {
        wk.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(wk);
    }
    return weeks;
  }

  function getWeekStartDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  }

  function getActivityColor(seconds: number): string {
    if (!seconds || seconds === 0) return "transparent";
    const h = seconds / 3600;
    if (h < 2) return theme.colors.primary + "18";
    if (h < 4) return theme.colors.primary + "35";
    if (h < 6) return theme.colors.primary + "60";
    if (h < 8) return theme.colors.primary + "90";
    return theme.colors.primary;
  }

  function getActivityTextColor(seconds: number): string {
    if (!seconds || seconds === 0) return theme.colors.textPrimary;
    const h = seconds / 3600;
    if (h < 4) return theme.colors.textPrimary;
    return "white";
  }

  // ── Parse duration for quick entry ──
  function parseDurationInput(value: string): number | null {
    const colonMatch = value.match(/^(\d+):(\d{1,2})$/);
    if (colonMatch) return parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60;
    const decimalMatch = value.match(/^(\d+(?:\.\d+)?)$/);
    if (decimalMatch) {
      const num = parseFloat(decimalMatch[1]);
      if (num < 24) return Math.round(num * 3600);
      return Math.round(num * 60);
    }
    return null;
  }

  // ── Quick entry submit ──
  const handleQuickEntry = async () => {
    const duration = parseDurationInput(qeDuration);
    if (!duration || duration <= 0) { alert("Invalid duration. Use h:mm format (e.g., 1:30)"); return; }
    if (!qeClient || !qeProject || !qeTask || !qeDate) { alert("Please fill all required fields"); return; }

    setIsQeSubmitting(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: qeClient, projectId: qeProject, taskId: qeTask, date: qeDate, duration, description: qeDescription || null, billable: true }),
      });
      if (res.ok) {
        setShowQuickEntry(false);
        setQeClient(""); setQeProject(""); setQeTask(""); setQeDuration(""); setQeDescription("");
        setQeDate(new Date().toISOString().split("T")[0]);
        refetch();
      } else {
        const err = await res.json();
        alert("Failed: " + (err.error || "Unknown error"));
      }
    } catch { alert("Network error"); }
    finally { setIsQeSubmitting(false); }
  };

  // ── CSV Export ──
  const exportToCSV = () => {
    const headers = ["Date", "Client", "Project", "Task", "Duration (hours)", "Description", "Billable", "Source"];
    const rows = timeEntries.map((e: any) => [
      new Date(e.date).toISOString().split("T")[0],
      e.project?.client?.name || e.client?.name || "",
      e.project?.name || "",
      e.task?.name || "",
      (e.duration / 3600).toFixed(2),
      (e.description || "").replace(/"/g, '""'),
      e.billable ? "Yes" : "No",
      e.source || "MANUAL",
    ]);
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", viewMode === "month" ? `timesheet-${month}.csv` : `timesheet-${weekStart.split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canEdit = !userId || userId === currentUser.id || canViewOthers;
  const currentWeekStartKey = getWeekStartDate(startDate);
  const todayStr = new Date().toISOString().split("T")[0];

  // Only show overtime alerts for ADMIN and SUPER_ADMIN
  const canSeeOvertimeAlerts = ["ADMIN", "SUPER_ADMIN"].includes(currentUser.role);

  // Month summary charts data
  const monthSummary = data.monthSummary;
  const projectChartData = monthSummary?.totalsByProject?.map((p) => ({
    label: p.projectName,
    value: Math.round(p.totalSeconds / 3600 * 10) / 10,
  })) || [];
  const billableDonutData = [
    { label: "Billable", value: billableSeconds, color: theme.colors.success },
    { label: "Non-Billable", value: nonBillableSeconds, color: theme.colors.textMuted },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 28,
              fontWeight: 400,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: 4,
            }}>
              Timesheet
            </h1>
            {viewUser && userId && userId !== currentUser.id && (
              <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0 }}>
                Viewing: {viewUser.name || viewUser.email}
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* View Toggle */}
            <div style={{
              display: "flex",
              background: theme.colors.bgTertiary,
              borderRadius: theme.borderRadius.md,
              padding: 3,
            }}>
              <button
                onClick={switchToWeek}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: viewMode === "week" ? theme.colors.bgSecondary : "transparent",
                  color: viewMode === "week" ? theme.colors.textPrimary : theme.colors.textMuted,
                  fontSize: 13,
                  fontWeight: viewMode === "week" ? 600 : 400,
                  cursor: "pointer",
                  boxShadow: viewMode === "week" ? theme.shadows.sm : "none",
                }}
              >
                Week
              </button>
              <button
                onClick={switchToMonth}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: viewMode === "month" ? theme.colors.bgSecondary : "transparent",
                  color: viewMode === "month" ? theme.colors.textPrimary : theme.colors.textMuted,
                  fontSize: 13,
                  fontWeight: viewMode === "month" ? 600 : 400,
                  cursor: "pointer",
                  boxShadow: viewMode === "month" ? theme.shadows.sm : "none",
                }}
              >
                Month
              </button>
            </div>

            {/* Team Member Dropdown */}
            {canViewOthers && teamMembers.length > 0 && (
              <select
                value={userId}
                onChange={(e) => {
                  const newUserId = e.target.value;
                  const base = viewMode === "month" && month ? `?month=${month}` : week ? `?week=${week}` : "";
                  const sep = base ? "&" : "?";
                  router.push(`/timesheet${base}${newUserId ? `${sep}userId=${newUserId}` : ""}`);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: theme.borderRadius.sm,
                  border: "1px solid " + theme.colors.borderLight,
                  background: theme.colors.bgSecondary,
                  color: theme.colors.textPrimary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <option value="">My Timesheet</option>
                {teamMembers.map((member: any) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
          <StatCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>}
            iconBg={theme.colors.primary}
            label="Total Hours"
            value={formatDuration(totalSeconds)}
            subtitle={`${formatHoursReadable(totalSeconds)} logged`}
            warning={canSeeOvertimeAlerts && hasOvertimeWeek}
          />
          <StatCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            iconBg={theme.colors.success}
            label="Billable"
            value={formatDuration(billableSeconds)}
            subtitle={totalSeconds > 0 ? `${Math.round((billableSeconds / totalSeconds) * 100)}% of total` : "0%"}
          />
          <StatCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            iconBg={theme.colors.info}
            label="Daily Average"
            value={formatDuration(Math.round(dailyAvg))}
            subtitle={`${workingDays} working day${workingDays !== 1 ? "s" : ""}`}
          />
          {/* Overtime card - only shown to ADMIN and SUPER_ADMIN */}
          {canSeeOvertimeAlerts && (
            <StatCard
              icon={hasOvertimeDay || hasOvertimeWeek
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>}
              iconBg={hasOvertimeDay || hasOvertimeWeek ? theme.colors.error : theme.colors.success}
              label="Overtime"
              value={hasOvertimeDay || hasOvertimeWeek ? "Detected" : "None"}
              subtitle={hasOvertimeWeek ? `${formatDuration(totalSeconds - WEEKLY_OVERTIME_SECONDS)} over 40h` : hasOvertimeDay ? "8h+ on a day" : "Within limits"}
              warning={hasOvertimeDay || hasOvertimeWeek}
            />
          )}
        </div>

        {/* Overtime Banner - only shown to ADMIN and SUPER_ADMIN */}
        {canSeeOvertimeAlerts && hasOvertimeWeek && (
          <div style={{
            background: theme.colors.errorBg,
            border: "1px solid " + theme.colors.error + "40",
            borderRadius: theme.borderRadius.md,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.error} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.error }}>
              Weekly overtime detected — {formatDuration(totalSeconds)} logged ({formatDuration(totalSeconds - WEEKLY_OVERTIME_SECONDS)} over 40h limit)
            </span>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search by client, project, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: theme.borderRadius.md,
              border: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
              fontSize: 14,
              outline: "none",
            }}
          />
          {searchQuery && (
            <div style={{ marginTop: 6, fontSize: 13, color: theme.colors.textSecondary }}>
              Showing {filteredEntries.length} of {serializedEntries.length} entries
            </div>
          )}
        </div>

        {/* Navigation Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          background: theme.colors.bgSecondary,
          borderRadius: 12,
          border: "1px solid " + theme.colors.borderLight,
          padding: "8px 12px",
        }}>
          {/* Left: Prev / Date / Next */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={viewMode === "month" ? goToPreviousMonth : goToPreviousWeek}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: theme.colors.textSecondary,
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 150ms, color 150ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgTertiary; e.currentTarget.style.color = theme.colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textSecondary; }}
              title={viewMode === "month" ? "Previous month" : "Previous week"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
            </button>

            <div style={{
              padding: "6px 16px",
              minWidth: 200,
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.colors.textPrimary,
                lineHeight: 1.2,
              }}>
                {viewMode === "month" ? formatMonthLabel() : formatWeekRange(startDate, endDate)}
              </div>
            </div>

            <button
              onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: theme.colors.textSecondary,
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 150ms, color 150ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgTertiary; e.currentTarget.style.color = theme.colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textSecondary; }}
              title={viewMode === "month" ? "Next month" : "Next week"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
            </button>
          </div>

          {/* Right: Calendar toggle + Export + Today */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: showCalendar ? "1px solid " + theme.colors.primary + "40" : "1px solid " + theme.colors.borderLight,
                background: showCalendar ? theme.colors.primary + "12" : "transparent",
                color: showCalendar ? theme.colors.primary : theme.colors.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 150ms",
              }}
              title={showCalendar ? "Hide calendar" : "Show calendar"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>

            <button
              onClick={exportToCSV}
              disabled={timeEntries.length === 0}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "1px solid " + theme.colors.borderLight,
                background: "transparent",
                color: timeEntries.length === 0 ? theme.colors.textMuted : theme.colors.textSecondary,
                cursor: timeEntries.length === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 150ms",
                opacity: timeEntries.length === 0 ? 0.4 : 1,
              }}
              onMouseEnter={(e) => { if (timeEntries.length > 0) e.currentTarget.style.background = theme.colors.bgTertiary; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              title="Export as CSV"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>

            <button
              onClick={viewMode === "month" ? goToCurrentMonth : goToCurrentWeek}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                background: theme.colors.primary + "12",
                color: theme.colors.primary,
                border: "1px solid " + theme.colors.primary + "25",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 150ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.primary + "20"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.primary + "12"; }}
            >
              Today
            </button>
          </div>
        </div>

        {/* Mini Calendar Heatmap */}
        {showCalendar && (
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            border: "1px solid " + theme.colors.borderLight,
            padding: 16,
            marginBottom: 16,
            maxWidth: 320,
          }}>
            {/* Calendar month header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button
                onClick={() => {
                  const nm = calendarMonth.month === 0 ? 11 : calendarMonth.month - 1;
                  const ny = calendarMonth.month === 0 ? calendarMonth.year - 1 : calendarMonth.year;
                  setCalendarMonth({ year: ny, month: nm });
                }}
                style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: theme.colors.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>
                {MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
              </span>
              <button
                onClick={() => {
                  const nm = calendarMonth.month === 11 ? 0 : calendarMonth.month + 1;
                  const ny = calendarMonth.month === 11 ? calendarMonth.year + 1 : calendarMonth.year;
                  setCalendarMonth({ year: ny, month: nm });
                }}
                style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: theme.colors.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
              </button>
            </div>

            {/* Day of week headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: theme.colors.textMuted, padding: "4px 0" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {getMonthGrid(calendarMonth.year, calendarMonth.month).flat().map((date, i) => {
                const dateKey = date.toISOString().split("T")[0];
                const seconds = calendarData?.dailyTotals?.[dateKey] || 0;
                const isCurrentMonth = date.getMonth() === calendarMonth.month;
                const isToday = dateKey === todayStr;
                const dayWeekStart = getWeekStartDate(date);
                const isCurrentWeek = dayWeekStart === currentWeekStartKey;
                const bg = getActivityColor(seconds);
                const textColor = getActivityTextColor(seconds);

                return (
                  <div
                    key={i}
                    onClick={() => {
                      const ws = getWeekStartDate(date);
                      router.push(`/timesheet?week=${ws}${userId ? "&userId=" + userId : ""}`);
                    }}
                    title={seconds > 0 ? `${(seconds / 3600).toFixed(1)}h logged` : "No time logged"}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: isToday ? 700 : seconds > 0 ? 600 : 400,
                      color: !isCurrentMonth ? theme.colors.textMuted + "60" : textColor,
                      background: !isCurrentMonth ? "transparent" : bg,
                      borderRadius: 6,
                      cursor: "pointer",
                      border: isCurrentWeek && isCurrentMonth ? `2px solid ${theme.colors.primary}` : isToday ? `1px solid ${theme.colors.primary}60` : "1px solid transparent",
                      transition: "transform 100ms",
                      opacity: isCurrentMonth ? 1 : 0.3,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; e.currentTarget.style.zIndex = "5"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.zIndex = "1"; }}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: theme.colors.textMuted }}>Less</span>
              {[0, 2, 4, 6, 8].map((h) => (
                <div key={h} style={{ width: 14, height: 14, borderRadius: 3, background: getActivityColor(h * 3600), border: "1px solid " + theme.colors.borderLight }} />
              ))}
              <span style={{ fontSize: 10, color: theme.colors.textMuted }}>More</span>
            </div>
          </div>
        )}

        {/* Timesheet Grid */}
        <TimesheetGrid
          weekDates={weekDates}
          entries={filteredEntries}
          clients={clients}
          userId={userId || currentUser.id}
          canEdit={canEdit}
          dailyOvertimeThreshold={DAILY_OVERTIME_SECONDS}
          weeklyOvertimeThreshold={WEEKLY_OVERTIME_SECONDS}
        />

        {/* Month View Reports */}
        {viewMode === "month" && monthSummary && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 22,
              fontWeight: 400,
              color: theme.colors.textPrimary,
              marginBottom: 16,
            }}>
              Monthly Reports
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Hours by Project */}
              <div style={{
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
                padding: 20,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginTop: 0, marginBottom: 16 }}>
                  Hours by Project
                </h3>
                {projectChartData.length > 0 ? (
                  <BarChart data={projectChartData} color={theme.colors.primary} height={200} />
                ) : (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted, fontSize: 14 }}>
                    No project data
                  </div>
                )}
              </div>

              {/* Billable vs Non-Billable */}
              <div style={{
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginTop: 0, marginBottom: 16, alignSelf: "flex-start" }}>
                  Billable vs Non-Billable
                </h3>
                {totalSeconds > 0 ? (
                  <DonutChart data={billableDonutData} size={180} thickness={32} format="number" />
                ) : (
                  <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted, fontSize: 14 }}>
                    No data
                  </div>
                )}
                <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.colors.textSecondary }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: theme.colors.success }} />
                    Billable: {formatHoursReadable(billableSeconds)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.colors.textSecondary }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: theme.colors.textMuted }} />
                    Non-Billable: {formatHoursReadable(nonBillableSeconds)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Weeks History */}
        {viewMode === "week" && historyData && historyData.weeks.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22,
                fontWeight: 400,
                color: theme.colors.textPrimary,
                margin: 0,
              }}>
                Recent Weeks
              </h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid " + theme.colors.borderLight,
                  background: theme.colors.bgSecondary,
                  color: theme.colors.textSecondary,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {showHistory ? "Hide" : "Show"}
              </button>
            </div>

            {showHistory && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {historyData.weeks.map((w) => {
                  const isThisWeek = w.weekStart === currentWeekStartKey;
                  const wStart = new Date(w.weekStart);
                  const wEnd = new Date(w.weekEnd);
                  const sameMonth = wStart.getMonth() === wEnd.getMonth();
                  const rangeLabel = sameMonth
                    ? `${wStart.toLocaleDateString("en-US", { month: "short" })} ${wStart.getDate()}-${wEnd.getDate()}`
                    : `${wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${wEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                  const billableHours = (w.billableSeconds / 3600).toFixed(1);

                  return (
                    <div
                      key={w.weekStart}
                      onClick={() => router.push(`/timesheet?week=${w.weekStart}${userId ? "&userId=" + userId : ""}`)}
                      style={{
                        background: isThisWeek ? theme.colors.primary + "08" : theme.colors.bgSecondary,
                        border: `1px solid ${isThisWeek ? theme.colors.primary + "50" : theme.colors.borderLight}`,
                        borderRadius: 12,
                        padding: 16,
                        cursor: "pointer",
                        transition: "transform 150ms, box-shadow 150ms",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      {/* Overtime indicator - only for admins */}
                      {canSeeOvertimeAlerts && w.hasOvertime && (
                        <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: theme.colors.error }} title="Overtime week" />
                      )}

                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>
                        {rangeLabel}
                        {isThisWeek && (
                          <span style={{ marginLeft: 8, fontSize: 10, color: theme.colors.primary, fontWeight: 700, letterSpacing: "0.5px" }}>CURRENT</span>
                        )}
                      </div>

                      <div style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 28,
                        fontWeight: 400,
                        color: canSeeOvertimeAlerts && w.hasOvertime ? theme.colors.error : theme.colors.textPrimary,
                        lineHeight: 1,
                        marginBottom: 6,
                      }}>
                        {formatDuration(w.totalSeconds)}
                      </div>

                      <div style={{ display: "flex", gap: 10, fontSize: 12, color: theme.colors.textMuted, marginBottom: 10 }}>
                        <span style={{ color: theme.colors.success, fontWeight: 500 }}>{billableHours}h billable</span>
                        <span>{w.entryCount} entries</span>
                      </div>

                      <Sparkline
                        data={w.dailyHours}
                        color={canSeeOvertimeAlerts && w.hasOvertime ? theme.colors.error : theme.colors.primary}
                        width={248}
                        height={24}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quick Entry FAB + Modal */}
      {canEdit && !showQuickEntry && (
        <button
          onClick={() => setShowQuickEntry(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: theme.gradients.primary,
            color: "white",
            border: "none",
            fontSize: 28,
            fontWeight: 300,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(118,82,124,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 998,
            transition: "transform 150ms, box-shadow 150ms",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(118,82,124,0.45)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(118,82,124,0.35)"; }}
          title="Quick add time entry"
        >
          +
        </button>
      )}

      {showQuickEntry && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setShowQuickEntry(false)}
        >
          <div
            style={{ background: theme.colors.bgSecondary, borderRadius: 16, padding: 24, width: 440, maxWidth: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: theme.colors.textPrimary, margin: 0 }}>
                Quick Log Time
              </h2>
              <button onClick={() => setShowQuickEntry(false)} style={{ background: "none", border: "none", fontSize: 22, color: theme.colors.textMuted, cursor: "pointer", lineHeight: 1, padding: 0 }}>
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>Client *</label>
                <select value={qeClient} onChange={(e) => { setQeClient(e.target.value); setQeProject(""); setQeTask(""); }} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + theme.colors.borderLight, fontSize: 14 }}>
                  <option value="">Select client...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.nickname || c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>Project *</label>
                <select value={qeProject} onChange={(e) => { setQeProject(e.target.value); setQeTask(""); }} disabled={!qeClient} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + theme.colors.borderLight, fontSize: 14, opacity: qeClient ? 1 : 0.5 }}>
                  <option value="">Select project...</option>
                  {qeProjects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>Task *</label>
                <select value={qeTask} onChange={(e) => setQeTask(e.target.value)} disabled={!qeProject} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + theme.colors.borderLight, fontSize: 14, opacity: qeProject ? 1 : 0.5 }}>
                  <option value="">Select task...</option>
                  {qeTasks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>Date *</label>
                  <input type="date" value={qeDate} onChange={(e) => setQeDate(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + theme.colors.borderLight, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>Duration * (h:mm)</label>
                  <input type="text" value={qeDuration} onChange={(e) => setQeDuration(e.target.value)} placeholder="1:30" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + theme.colors.borderLight, fontSize: 14 }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>Description</label>
                <textarea value={qeDescription} onChange={(e) => setQeDescription(e.target.value)} placeholder="What did you work on?" rows={2} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid " + theme.colors.borderLight, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowQuickEntry(false)} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid " + theme.colors.borderLight, background: theme.colors.bgTertiary, color: theme.colors.textSecondary, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleQuickEntry} disabled={isQeSubmitting} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: theme.gradients.primary, color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: isQeSubmitting ? 0.5 : 1 }}>
                {isQeSubmitting ? "Logging..." : "Log Time"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
