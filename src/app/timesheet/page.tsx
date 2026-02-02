"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import TimesheetGrid from "./timesheet-grid";
import { BarChart, DonutChart } from "@/components/MetricsChart";
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
            warning={hasOvertimeWeek}
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
        </div>

        {/* Overtime Banner */}
        {hasOvertimeWeek && (
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

          {/* Right: Today button */}
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

        {/* Timesheet Grid */}
        <TimesheetGrid
          weekDates={weekDates}
          entries={filteredEntries}
          clients={clients}
          userId={userId || currentUser.id}
          canEdit={!userId || userId === currentUser.id || canViewOthers}
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
      </main>
    </div>
  );
}
