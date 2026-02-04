"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  pinned?: boolean;
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

// SVG Icons
const icons = {
  layers: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  activity: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  checkCircle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  pauseCircle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  alertTriangle: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

// Loading skeleton component
function ProjectsPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ width: 160, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ width: 280, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
          <div style={{ width: 150, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.bgTertiary }} />
                <div style={{ width: 48, height: 28, background: theme.colors.bgTertiary, borderRadius: 6 }} />
              </div>
              <div style={{ width: 120, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ padding: "18px 22px", borderBottom: i < 4 ? `1px solid ${theme.colors.bgTertiary}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <div style={{ width: 200, height: 18, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: 150, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
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
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{
          background: theme.colors.errorBg,
          border: `1px solid ${theme.colors.error}20`,
          borderRadius: 16,
          padding: 56,
          textAlign: "center",
        }}>
          <div style={{ color: theme.colors.error, marginBottom: 16, display: "flex", justifyContent: "center" }}>
            {icons.alertTriangle}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.error, marginBottom: 8 }}>
            Failed to load projects
          </h2>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 24, fontSize: 14 }}>
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={retry}
            style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: theme.shadows.button,
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
  const [mounted, setMounted] = useState(false);

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ProjectsData>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects/list");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  const handlePinToggle = async (projectId: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });

      if (res.ok) {
        // Optimistically update the cache
        queryClient.setQueryData<ProjectsData>(["projects"], (old) => {
          if (!old) return old;
          const updatedProjects = old.projects.map(p =>
            p.id === projectId ? { ...p, pinned } : p
          );
          // Re-sort: pinned first, then by name
          updatedProjects.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.name.localeCompare(b.name);
          });
          return { ...old, projects: updatedProjects };
        });
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  if (status === "loading") return <ProjectsPageSkeleton />;
  if (!session) return null;
  if (isLoading) return <ProjectsPageSkeleton />;
  if (error) return <ProjectsError error={error as Error} retry={() => refetch()} />;
  if (!data) return <ProjectsError error={new Error("No data received")} retry={() => refetch()} />;

  const { projects, stats, isAdmin } = data;

  const statCards = [
    { label: "Total Projects", value: stats.total, icon: icons.layers, color: theme.colors.primary, bg: theme.colors.primaryBg },
    { label: "In Progress", value: stats.inProgress, icon: icons.activity, color: theme.colors.info, bg: theme.colors.infoBg },
    { label: "Completed", value: stats.completed, icon: icons.checkCircle, color: theme.colors.success, bg: theme.colors.successBg },
    { label: "On Hold", value: stats.onHold, icon: icons.pauseCircle, color: theme.colors.error, bg: theme.colors.errorBg },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, ...anim(0.05) }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>
              Projects
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
              Track and manage all your projects
            </p>
          </div>
          {isAdmin && (
            <Link href="/projects/new" style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "10px 22px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: theme.shadows.button,
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              {icons.plus} New Project
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28, ...anim(0.1) }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: theme.colors.bgSecondary,
                padding: "18px 20px",
                borderRadius: 14,
                border: `1px solid ${theme.colors.borderLight}`,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1 }}>
                  {card.value}
                </div>
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 500 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Projects List */}
        <div style={anim(0.15)}>
          <ProjectsList projects={projects} isAdmin={isAdmin} onPinToggle={handlePinToggle} />
        </div>
      </main>
    </div>
  );
}
