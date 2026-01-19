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
  projects: any[];
  weekDates: string[];
  weekStart: string;
  weekEnd: string;
  weeklyTotal: number;
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ width: 200, height: 36, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ width: 300, height: 20, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 120, height: 44, background: theme.colors.bgSecondary, borderRadius: 8 }} />
            <div style={{ width: 120, height: 44, background: theme.colors.bgSecondary, borderRadius: 8 }} />
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

  const { weekDates, weekStart, weekEnd, weeklyTotal, viewUser, teamMembers, canViewOthers, timeEntries, projects } = data;

  // Format week range for display
  const startDate = new Date(weekStart);
  const endDate = new Date(weekEnd);
  const weekRange = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // Navigation functions
  const goToPreviousWeek = () => {
    const prevWeek = new Date(startDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setWeek(prevWeek.toISOString().split("T")[0]);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(startDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setWeek(nextWeek.toISOString().split("T")[0]);
  };

  const goToCurrentWeek = () => {
    setWeek("");
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
              Timesheet
            </h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
              {viewUser?.name || "Your"} timesheet for {weekRange}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {canViewOthers && teamMembers.length > 0 && (
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: theme.borderRadius.md,
                  border: "1px solid " + theme.colors.borderLight,
                  background: theme.colors.bgSecondary,
                  color: theme.colors.textPrimary,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <option value="">My Timesheet</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={goToPreviousWeek}
              style={{
                padding: "12px 20px",
                borderRadius: theme.borderRadius.md,
                border: "1px solid " + theme.colors.borderLight,
                background: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              ← Previous
            </button>

            <button
              onClick={goToCurrentWeek}
              style={{
                padding: "12px 20px",
                borderRadius: theme.borderRadius.md,
                border: "1px solid " + theme.colors.borderLight,
                background: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Today
            </button>

            <button
              onClick={goToNextWeek}
              style={{
                padding: "12px 20px",
                borderRadius: theme.borderRadius.md,
                border: "1px solid " + theme.colors.borderLight,
                background: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Weekly Total */}
        <div style={{ 
          background: theme.colors.bgSecondary, 
          borderRadius: theme.borderRadius.lg, 
          border: "1px solid " + theme.colors.borderLight, 
          padding: 20, 
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 }}>Weekly Total</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{weeklyTotal.toFixed(2)} hrs</div>
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
            {weekDates.map(d => new Date(d).toLocaleDateString("en-US", { weekday: "short" })).join(" • ")}
          </div>
        </div>

        {/* Timesheet Grid */}
        <TimesheetGrid
          timeEntries={timeEntries}
          projects={projects}
          weekDates={weekDates.map(d => new Date(d))}
          weekStart={startDate}
          weekEnd={endDate}
        />
      </main>
    </div>
  );
}
