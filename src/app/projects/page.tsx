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
  layersEmpty: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
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

// Animated number component
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, hasAnimated]);

  return <>{displayValue}</>;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ProjectsData>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects/list", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      const json = await res.json();
      console.log("🔍 Projects API Response:", json);
      console.log("📊 Projects Stats:", json.stats);
      console.log("📁 Projects count:", json.projects?.length);
      return json;
    },
    enabled: status === "authenticated",
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const handlePinToggle = async (projectId: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });

      if (res.ok) {
        queryClient.setQueryData<ProjectsData>(["projects"], (old) => {
          if (!old) return old;
          const updatedProjects = old.projects.map(p =>
            p.id === projectId ? { ...p, pinned } : p
          );
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

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (status === "loading") return <ProjectsPageSkeleton />;
  if (!session) return null;
  if (isLoading) return <ProjectsPageSkeleton />;
  if (error) return <ProjectsError error={error as Error} retry={() => refetch()} />;
  if (!data) return <ProjectsError error={new Error("No data received")} retry={() => refetch()} />;

  const { projects, stats, isAdmin } = data;

  console.log("🎯 Projects Data destructured:", { projects, stats, isAdmin });
  console.log("📈 Projects Stats values:", stats);

  const statCards = [
    { label: "Total Projects", value: stats.total, icon: icons.layers, color: theme.colors.primary, bg: theme.colors.primaryBg },
    { label: "In Progress", value: stats.inProgress, icon: icons.activity, color: theme.colors.info, bg: theme.colors.infoBg },
    { label: "Completed", value: stats.completed, icon: icons.checkCircle, color: theme.colors.success, bg: theme.colors.successBg },
    { label: "On Hold", value: stats.onHold, icon: icons.pauseCircle, color: theme.colors.error, bg: theme.colors.errorBg },
  ];

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .projects-page {
          min-height: 100vh;
          background: ${theme.colors.bgPrimary};
        }
        .projects-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 24px 48px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .page-header.mounted { animation-delay: 0s; }
        .page-title {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          font-weight: 400;
          color: ${theme.colors.textPrimary};
          margin: 0 0 6px 0;
        }
        .page-subtitle {
          color: ${theme.colors.textMuted};
          font-size: 14px;
          margin: 0;
        }
        .new-project-btn {
          background: ${theme.gradients.primary};
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(118, 82, 124, 0.3);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .new-project-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(118, 82, 124, 0.4);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: ${theme.colors.bgSecondary};
          padding: 20px;
          border-radius: 16px;
          border: 1px solid ${theme.colors.borderLight};
          opacity: 0;
          animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          cursor: default;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
          border-color: ${theme.colors.primary}30;
        }
        .stat-card.mounted:nth-child(1) { animation-delay: 0.1s; }
        .stat-card.mounted:nth-child(2) { animation-delay: 0.15s; }
        .stat-card.mounted:nth-child(3) { animation-delay: 0.2s; }
        .stat-card.mounted:nth-child(4) { animation-delay: 0.25s; }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.1);
        }
        .stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: ${theme.colors.textPrimary};
          line-height: 1;
        }
        .stat-label {
          font-size: 13px;
          color: ${theme.colors.textSecondary};
          font-weight: 500;
          margin-top: 8px;
        }
        .projects-list-wrapper {
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .projects-list-wrapper.mounted { animation-delay: 0.3s; }
        .empty-state {
          background: ${theme.colors.bgSecondary};
          border-radius: 20px;
          border: 1px solid ${theme.colors.borderLight};
          padding: 80px;
          text-align: center;
          opacity: 0;
          animation: fadeIn 0.6s ease forwards;
        }
        .empty-state.mounted { animation-delay: 0.3s; }
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 16px; align-items: flex-start; }
        }
      `}</style>

      <div className="projects-page">
        <Header />

        <main className="projects-main">
          {/* Page Header */}
          <div className={`page-header ${mounted ? 'mounted' : ''}`}>
            <div>
              <h1 className="page-title">Projects</h1>
              <p className="page-subtitle">Track and manage all your projects</p>
            </div>
            {isAdmin && (
              <Link href="/projects/new" className="new-project-btn">
                {icons.plus} New Project
              </Link>
            )}
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            {statCards.map((card) => (
              <div key={card.label} className={`stat-card ${mounted ? 'mounted' : ''}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="stat-value">
                    <AnimatedNumber value={card.value} />
                  </div>
                </div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Projects List */}
          {projects.length === 0 ? (
            <div className={`empty-state ${mounted ? 'mounted' : ''}`}>
              <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
                {icons.layersEmpty}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
                No projects yet
              </h3>
              <p style={{ color: theme.colors.textSecondary, marginBottom: 24, fontSize: 14 }}>
                Get started by creating your first project
              </p>
              {isAdmin && (
                <Link href="/projects/new" className="new-project-btn" style={{ display: "inline-flex" }}>
                  {icons.plus} Create Project
                </Link>
              )}
            </div>
          ) : (
            <div className={`projects-list-wrapper ${mounted ? 'mounted' : ''}`}>
              <ProjectsList projects={projects} isAdmin={isAdmin} onPinToggle={handlePinToggle} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
