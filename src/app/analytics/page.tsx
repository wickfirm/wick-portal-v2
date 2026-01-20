"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";
import AdminAnalyticsDashboard from "@/components/AdminAnalyticsDashboard";

type AnalyticsData = {
  clients: Array<{ id: string; name: string; status: string }>;
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  totalTasks: number;
  completedTasks: number;
  clientsByStatus: Array<{ status: string; _count: { status: number } }>;
  projectsByType: Array<{ serviceType: string; _count: { serviceType: number } }>;
  projectsByStatus: Array<{ status: string; _count: { status: number } }>;
  allMetrics: any[];
};

// Loading skeleton
function AnalyticsPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header Skeleton */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 140, height: 36, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
          <div style={{ width: 320, height: 20, background: theme.colors.bgSecondary, borderRadius: 6 }} />
        </div>

        {/* Stats Grid Skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 80, height: 40, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 120, height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 32 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: "50%", height: 24, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 16 }} />
              <div style={{ width: "100%", height: 200, background: theme.colors.bgTertiary, borderRadius: 8 }} />
            </div>
          ))}
        </div>

        {/* Large Chart Skeleton */}
        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <div style={{ width: "40%", height: 24, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 16 }} />
          <div style={{ width: "100%", height: 300, background: theme.colors.bgTertiary, borderRadius: 8 }} />
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch analytics data with React Query
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["analytics-data"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard");
          throw new Error("Access denied");
        }
        throw new Error("Failed to fetch analytics");
      }
      return res.json();
    },
    enabled: status === "authenticated",
    staleTime: 2 * 60 * 1000, // 2 minutes (analytics change frequently)
  });

  // Show loading state
  if (status === "loading" || isLoading) {
    return <AnalyticsPageSkeleton />;
  }

  // Don't render if not authenticated
  if (!session || !data) return null;

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 48 }}>
            <p style={{ color: theme.colors.error, fontSize: 16, marginBottom: 16 }}>
              Failed to load analytics data
            </p>
            <button
              onClick={() => window.location.reload()}
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
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <AdminAnalyticsDashboard
          clients={data.clients}
          totalProjects={data.totalProjects}
          completedProjects={data.completedProjects}
          inProgressProjects={data.inProgressProjects}
          totalTasks={data.totalTasks}
          completedTasks={data.completedTasks}
          clientsByStatus={data.clientsByStatus}
          projectsByType={data.projectsByType}
          projectsByStatus={data.projectsByStatus}
          allMetrics={data.allMetrics}
        />
      </main>
    </div>
  );
}
