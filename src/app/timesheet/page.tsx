"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/Header";
import TimesheetGrid from "./timesheet-grid";
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
};

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

        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, padding: 32 }}>
          <div style={{ width: "100%", height: 400, background: theme.colors.bgTertiary, borderRadius: 8 }} />
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
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
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

export default function TimesheetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [week, setWeek] = useState(searchParams.get("week") || "");
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Build query string
  const queryString = new URLSearchParams();
  if (week) queryString.set("week", week);
  if (userId) queryString.set("userId", userId);
  const queryStr = queryString.toString();

  // Fetch timesheet data with React Query
  const { data, isLoading, error, refetch } = useQuery<TimesheetData>({
    queryKey: ["timesheet", week, userId],
    queryFn: async () => {
      const url = `/api/timesheet${queryStr ? `?${queryStr}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch timesheet data");
      }
      return res.json();
    },
    enabled: status === "authenticated",
  });

  // Show loading state while checking authentication
  if (status === "loading") {
    return <TimesheetPageSkeleton />;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) return null;

  // Show loading skeleton while fetching data
  if (isLoading) {
    return <TimesheetPageSkeleton />;
  }

  // Show error state
  if (error) {
    return <TimesheetError error={error as Error} retry={() => refetch()} />;
  }

  // Show error if no data
  if (!data) {
    return <TimesheetError error={new Error("No data received")} retry={() => refetch()} />;
  }

  const { weekDates, weekStart, weekEnd, viewUser, teamMembers, canViewOthers, timeEntries, clients } = data;

  // Format week range for display
  const startDate = new Date(weekStart);
  const endDate = new Date(weekEnd);
  const formatWeekRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
  };

  // Group entries by client/project/task
  const entriesByRow: Record<string, any> = {};
  timeEntries.forEach((entry: any) => {
    const rowKey = `${entry.project.client.id}-${entry.project.id}-${entry.task?.id || 'notask'}`;
    
    if (!entriesByRow[rowKey]) {
      entriesByRow[rowKey] = {
        client: entry.project.client,
        project: entry.project,
        task: entry.task || { id: 'notask', name: 'No Task' },
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
      source: entry.source || 'MANUAL',
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

  // Filter entries based on search query
  const filteredEntries = searchQuery.trim()
    ? serializedEntries.filter((row) => {
        const query = searchQuery.toLowerCase();
        const clientMatch = row.client?.name?.toLowerCase().includes(query) || 
                           row.client?.nickname?.toLowerCase().includes(query);
        const projectMatch = row.project?.name?.toLowerCase().includes(query);
        const taskMatch = row.task?.name?.toLowerCase().includes(query);
        return clientMatch || projectMatch || taskMatch;
      })
    : serializedEntries;

  // Navigation functions
  const goToPreviousWeek = () => {
    const prevWeek = new Date(startDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const newUrl = `/timesheet?week=${prevWeek.toISOString().split("T")[0]}${userId ? "&userId=" + userId : ""}`;
    router.push(newUrl);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(startDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const newUrl = `/timesheet?week=${nextWeek.toISOString().split("T")[0]}${userId ? "&userId=" + userId : ""}`;
    router.push(newUrl);
  };

  const goToCurrentWeek = () => {
    const newUrl = `/timesheet${userId ? "?userId=" + userId : ""}`;
    router.push(newUrl);
  };

  const currentUser = session.user as any;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, margin: 0, marginBottom: 4 }}>
              Weekly Timesheet
            </h1>
            {viewUser && userId && userId !== currentUser.id && (
              <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0 }}>
                Viewing: {viewUser.name || viewUser.email}
              </p>
            )}
          </div>

          {canViewOthers && teamMembers.length > 0 && (
            <select
              value={userId}
              onChange={(e) => {
                const newUserId = e.target.value;
                const newUrl = `/timesheet${week ? `?week=${week}` : ""}${newUserId ? `${week ? "&" : "?"}userId=${newUserId}` : ""}`;
                router.push(newUrl);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: theme.borderRadius.sm,
                border: "1px solid " + theme.colors.borderLight,
                background: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <option value="">My Timesheet</option>
              {teamMembers.map((member: any) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search by client, project, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: theme.borderRadius.md,
              border: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
              fontSize: 14,
              outline: "none",
            }}
          />
          {searchQuery && (
            <div style={{ 
              marginTop: 8, 
              fontSize: 13, 
              color: theme.colors.textSecondary 
            }}>
              Showing {filteredEntries.length} of {serializedEntries.length} entries
            </div>
          )}
        </div>

        {/* Week Navigation */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={goToPreviousWeek}
            style={{
              padding: "8px 12px",
              borderRadius: theme.borderRadius.sm,
              border: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgPrimary,
              color: theme.colors.textSecondary,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Previous
          </button>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            padding: "8px 16px", 
            background: theme.colors.bgTertiary, 
            borderRadius: theme.borderRadius.md 
          }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>📅</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary }}>
              {formatWeekRange(startDate, endDate)}
            </span>
          </div>
          
          <button
            onClick={goToNextWeek}
            style={{
              padding: "8px 12px",
              borderRadius: theme.borderRadius.sm,
              border: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgPrimary,
              color: theme.colors.textSecondary,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Next →
          </button>

          <button
            onClick={goToCurrentWeek}
            style={{
              padding: "8px 16px",
              borderRadius: theme.borderRadius.sm,
              background: theme.colors.infoBg,
              color: theme.colors.info,
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
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
        />
      </main>
    </div>
  );
}
