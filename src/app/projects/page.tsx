"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/Header";
import ProjectsList from "./projects-list";
import { theme } from "@/lib/theme";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  serviceType: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
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

type ProjectsData = {
  projects: Project[];
  stats: {
    total: number;
    inProgress: number;
    completed: number;
    onHold: number;
  };
  isAdmin: boolean;
};

// Loading skeleton component
function ProjectsPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header Skeleton */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ width: 180, height: 36, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ width: 280, height: 20, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
          <div style={{ width: 150, height: 44, background: theme.colors.bgSecondary, borderRadius: 8 }} />
        </div>

        {/* Stats Skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 80, height: 36, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 120, height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          ))}
        </div>

        {/* Projects List Skeleton */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ padding: "20px 24px", borderBottom: i < 4 ? "1px solid " + theme.colors.bgTertiary : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <div style={{ width: 200, height: 20, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: 150, height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                </div>
                <div style={{ width: 80, height: 24, background: theme.colors.bgTertiary, borderRadius: 12 }} />
              </div>
              <div style={{ width: "100%", height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Error component
function ProjectsError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ 
          background: theme.colors.errorBg, 
          border: "1px solid " + theme.colors.error, 
          borderRadius: theme.borderRadius.lg, 
          padding: 48, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.error, marginBottom: 8 }}>
            Failed to load projects
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

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch projects data with React Query
  const { data, isLoading, error, refetch } = useQuery<ProjectsData>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects/list");
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      return res.json();
    },
    enabled: status === "authenticated", // Only fetch when authenticated
  });

  // Show loading state while checking authentication
  if (status === "loading") {
    return <ProjectsPageSkeleton />;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) return null;

  // Show loading skeleton while fetching data
  if (isLoading) {
    return <ProjectsPageSkeleton />;
  }

  // Show error state
  if (error) {
    return <ProjectsError error={error as Error} retry={() => refetch()} />;
  }

  // Show error if no data
  if (!data) {
    return <ProjectsError error={new Error("No data received")} retry={() => refetch()} />;
  }

  const { projects, stats, isAdmin } = data;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Projects</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Track and manage all your projects</p>
          </div>
          {isAdmin && (
            <Link href="/projects/new" style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "12px 24px",
              borderRadius: theme.borderRadius.md,
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: theme.shadows.button
            }}>
              <span style={{ fontSize: 18 }}>+</span> New Project
            </Link>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Projects</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.info }}>{stats.inProgress}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>In Progress</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.success }}>{stats.completed}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Completed</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.error }}>{stats.onHold}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>On Hold</div>
          </div>
        </div>

        {/* Projects List */}
        <ProjectsList projects={projects} isAdmin={isAdmin} />
      </main>
    </div>
  );
}
