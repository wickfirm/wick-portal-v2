"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { Icons } from "@/components/icons";
import OnboardingManager from "./onboarding-manager";
import ClientResources from "./client-resources";
import TeamManager from "./team-manager";
import AgenciesManager from "./agencies-manager";
import DeleteClientButton from "./delete-client-button";
import ClientCalendar from "./client-calendar";
import KeyDatesManager from "./key-dates-manager";
import { theme, STATUS_STYLES } from "@/lib/theme";

type ClientDetailTabsProps = {
  client: {
    id: string;
    name: string;
    nickname: string | null;
    status: string;
    industry: string | null;
    website: string | null;
    primaryContact: string | null;
    primaryEmail: string | null;
    monthlyRetainer: number | null;
    createdAt: string;
    agencies: Array<{ id: string; name: string }>;
  };
  onboarding: Array<any>;
  resources: Array<any>;
  team: Array<any>;
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    serviceType: string;
    startDate: string | null;
    endDate: string | null;
    budget: number | null;
    completionPercentage: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  userRole: string;
  canManageTeam: boolean;
  canAddProjects: boolean;
  canSeeBudget: boolean;
};

// Animated number component (optimized)
const AnimatedNumber = memo(({ value, duration = 800 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
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
  }, [value, duration]);

  return <>{displayValue}</>;
});
AnimatedNumber.displayName = "AnimatedNumber";

// Enhanced stat card component (memoized for performance)
const StatCard = memo(({
  value,
  label,
  icon: Icon,
  color,
  delay
}: {
  value: number | string;
  label: string;
  icon: any;
  color: string;
  delay: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: 20,
        padding: 24,
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transform: isMounted ? "translateY(0)" : "translateY(20px)",
        opacity: isMounted ? 1 : 0,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: isHovered ? "0 12px 40px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: theme.gradients.primary,
        opacity: isHovered ? 1 : 0,
        transition: "opacity 0.3s",
      }} />

      {/* Icon in top right */}
      <div style={{
        position: "absolute",
        top: 20,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 14,
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isHovered ? 0.8 : 0.4,
        transform: isHovered ? "scale(1.1)" : "scale(1)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        color: color,
      }}>
        <Icon size={24} />
      </div>

      {/* Content */}
      <div style={{
        fontSize: 40,
        fontWeight: 700,
        color: theme.colors.textPrimary,
        marginBottom: 8,
        fontFamily: "'DM Serif Display', serif",
      }}>
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </div>
      <div style={{
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: 500
      }}>
        {label}
      </div>
    </div>
  );
});
StatCard.displayName = "StatCard";

// Enhanced status badge (memoized)
const StatusBadge = memo(({ status }: { status: string }) => {
  const statusConfig = STATUS_STYLES[status] || { bg: theme.colors.bgTertiary, color: theme.colors.textMuted };

  return (
    <span style={{
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: statusConfig.bg,
      color: statusConfig.color,
      boxShadow: `0 4px 12px ${statusConfig.color}20`,
      letterSpacing: "0.02em",
    }}>
      {status}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

// Loading skeleton for tab content transitions
const TabContentSkeleton = () => (
  <div style={{
    animation: "pulse 1.5s ease-in-out infinite",
  }}>
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          background: theme.colors.bgSecondary,
          borderRadius: 20,
          padding: 24,
          height: 140,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <div style={{ width: "60%", height: 40, background: theme.colors.bgTertiary, borderRadius: 8, marginBottom: 12 }} />
          <div style={{ width: "40%", height: 14, background: theme.colors.bgTertiary, borderRadius: 6 }} />
        </div>
      ))}
    </div>
    <div style={{
      background: theme.colors.bgSecondary,
      borderRadius: 20,
      padding: 28,
      border: `1px solid ${theme.colors.borderLight}`,
    }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div style={{ width: "70%", height: 16, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 10 }} />
          <div style={{ width: "50%", height: 12, background: theme.colors.bgTertiary, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  </div>
);

// Tab content wrapper with transition
const TabContent = memo(({ children, isTransitioning }: { children: React.ReactNode; isTransitioning: boolean }) => (
  <div style={{
    opacity: isTransitioning ? 0 : 1,
    transform: isTransitioning ? "translateY(10px)" : "translateY(0)",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  }}>
    {children}
  </div>
));
TabContent.displayName = "TabContent";

export default function ClientDetailTabsEnhanced({
  client,
  onboarding,
  resources,
  team,
  projects,
  userRole,
  canManageTeam,
  canAddProjects,
  canSeeBudget,
}: ClientDetailTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle tab content transitions
  useEffect(() => {
    setIsTransitioning(true);
    setContentKey(prev => prev + 1);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Memoize expensive calculations
  const stats = useMemo(() => ({
    totalTasks: projects.reduce((sum, p) => sum + p.totalTasks, 0),
    completedTasks: projects.reduce((sum, p) => sum + p.completedTasks, 0),
    activeProjects: projects.filter(p => p.status === "IN_PROGRESS" || p.status === "ACTIVE").length,
    completedOnboarding: onboarding.filter(i => i.isCompleted).length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
  }), [projects, onboarding]);

  const tabs = useMemo(() => [
    { id: "overview", label: "Overview", icon: Icons.Overview },
    { id: "projects", label: "Projects", icon: Icons.Projects, count: projects.length },
    {
      id: "onboarding",
      label: "Onboarding",
      icon: Icons.CheckCircle,
      count: onboarding.filter(i => !i.isCompleted).length,
      highlight: client.status === "ONBOARDING" || client.status === "LEAD"
    },
    { id: "calendar", label: "Calendar", icon: Icons.Calendar },
    { id: "key-dates", label: "Key Dates", icon: Icons.Target },
    { id: "team", label: "Team", icon: Icons.Users, count: team.length },
    { id: "resources", label: "Resources", icon: Icons.Paperclip, count: resources.length },
  ], [projects.length, onboarding, team.length, resources.length, client.status]);

  const setActiveTab = (tabId: string) => {
    // Instant visual feedback - no waiting for router
    const newUrl = `/clients/${client.id}?tab=${tabId}`;
    window.history.pushState({}, '', newUrl);

    // Trigger transition immediately
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 24px",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        {/* Enhanced Breadcrumb */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20
        }}>
          <Link
            href="/clients"
            style={{
              color: theme.colors.textMuted,
              textDecoration: "none",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textMuted}
          >
            <Icons.ChevronLeft size={16} />
            Clients
          </Link>
          <Icons.ChevronRight size={14} style={{ color: theme.colors.borderMedium }} />
          <span style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: 600 }}>
            {client.name}
          </span>
        </nav>

        {/* Enhanced Hero Section */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {/* Enhanced Avatar with Gradient Border */}
              <div style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                padding: 4,
                background: theme.gradients.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(118, 82, 124, 0.2)",
              }}>
                <div style={{
                  width: 88,
                  height: 88,
                  borderRadius: 20,
                  background: theme.gradients.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 32,
                }}>
                  {(client.nickname || client.name).charAt(0).toUpperCase()}
                </div>
              </div>

              <div>
                <h1 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 36,
                  fontWeight: 400,
                  color: theme.colors.textPrimary,
                  margin: 0,
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                }}>
                  {client.name}
                  {client.nickname && (
                    <span style={{ fontWeight: 400, color: theme.colors.textMuted, marginLeft: 12, fontSize: 28 }}>
                      ({client.nickname})
                    </span>
                  )}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <StatusBadge status={client.status} />
                  {client.agencies.map(agency => (
                    <span key={agency.id} style={{
                      padding: "6px 12px",
                      background: theme.colors.infoBg,
                      color: theme.colors.info,
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <Icons.Building size={14} />
                      {agency.name}
                    </span>
                  ))}
                  {client.industry && (
                    <span style={{
                      fontSize: 13,
                      color: theme.colors.textMuted,
                      padding: "6px 12px",
                      background: theme.colors.bgTertiary,
                      borderRadius: 20,
                      fontWeight: 500,
                    }}>
                      {client.industry}
                    </span>
                  )}
                  {client.website && (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        color: theme.colors.primary,
                        textDecoration: "none",
                        padding: "6px 12px",
                        background: theme.colors.primaryBg,
                        borderRadius: 20,
                        fontWeight: 500,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.colors.primary;
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme.colors.primaryBg;
                        e.currentTarget.style.color = theme.colors.primary;
                      }}
                    >
                      🔗 {client.website.replace("https://", "").replace("http://", "")}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons with Better Hierarchy */}
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href={`/clients/${client.id}/tasks`}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  background: theme.colors.bgSecondary,
                  border: `1.5px solid ${theme.colors.borderMedium}`,
                  color: theme.colors.textPrimary,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.borderMedium;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Tasks
              </Link>
              <Link
                href={`/clients/${client.id}/metrics`}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  background: theme.colors.bgSecondary,
                  border: `1.5px solid ${theme.colors.borderMedium}`,
                  color: theme.colors.textPrimary,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.success;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.borderMedium;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Metrics
              </Link>
              <Link
                href={`/clients/${client.id}/edit`}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  background: theme.gradients.primary,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 4px 16px rgba(118, 82, 124, 0.3)",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(118, 82, 124, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(118, 82, 124, 0.3)";
                }}
              >
                Edit Client
              </Link>
              {userRole === "SUPER_ADMIN" && (
                <DeleteClientButton clientId={client.id} clientName={client.name} />
              )}
            </div>
          </div>
        </div>

        {/* Modern Pill-Style Tabs */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 16,
          padding: 6,
          display: "inline-flex",
          gap: 4,
          marginBottom: 32,
          border: `1px solid ${theme.colors.borderLight}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          position: "relative",
        }}>
          {/* Loading indicator */}
          {isTransitioning && (
            <div style={{
              position: "absolute",
              bottom: -2,
              left: 6,
              right: 6,
              height: 2,
              background: theme.gradients.primary,
              borderRadius: 2,
              animation: "slideProgress 0.3s ease-out",
            }} />
          )}
          <style>{`
            @keyframes slideProgress {
              from { width: 0%; opacity: 0; }
              to { width: 100%; opacity: 1; }
            }
          `}</style>
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 20px",
                  background: activeTab === tab.id
                    ? theme.gradients.primary
                    : "transparent",
                  border: "none",
                  borderRadius: 12,
                  color: activeTab === tab.id ? "white" : theme.colors.textSecondary,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: activeTab === tab.id
                    ? "0 4px 12px rgba(118, 82, 124, 0.3)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = theme.colors.bgTertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span style={{
                    background: activeTab === tab.id
                      ? "rgba(255,255,255,0.2)"
                      : tab.highlight
                        ? theme.colors.warningBg
                        : theme.colors.bgTertiary,
                    color: activeTab === tab.id
                      ? "white"
                      : tab.highlight
                        ? theme.colors.warning
                        : theme.colors.textMuted,
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 20,
                    textAlign: "center",
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {isTransitioning ? (
          <TabContentSkeleton />
        ) : (
          <>
            {activeTab === "overview" && (
              <TabContent isTransitioning={false}>
                <div style={{ display: "grid", gap: 28 }}>
            {/* Enhanced Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
              <StatCard
                value={projects.length}
                label="Total Projects"
                icon={Icons.Layers}
                color={theme.colors.primary}
                delay={100}
              />
              <StatCard
                value={stats.activeProjects}
                label="Active Projects"
                icon={Icons.Activity}
                color={theme.colors.info}
                delay={150}
              />
              <StatCard
                value={`${stats.completedTasks}/${stats.totalTasks}`}
                label="Tasks Completed"
                icon={Icons.CheckSquare}
                color={theme.colors.success}
                delay={200}
              />
              <StatCard
                value={`${stats.completedOnboarding}/${onboarding.length}`}
                label="Onboarding Done"
                icon={Icons.CheckCircle}
                color={theme.colors.warning}
                delay={250}
              />
            </div>

            {/* Contact & Financial Details with Glassmorphism */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 20,
                padding: 28,
              }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                  <Icons.Users size={22} style={{ color: theme.colors.primary }} />
                  Contact Information
                </h2>
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>
                      Primary Contact
                    </div>
                    <div style={{ fontSize: 15, color: theme.colors.textPrimary, fontWeight: 500 }}>
                      {client.primaryContact || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>
                      Email
                    </div>
                    <div style={{ fontSize: 15, color: theme.colors.textPrimary, fontWeight: 500 }}>
                      {client.primaryEmail || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 6 }}>
                      Client Since
                    </div>
                    <div style={{ fontSize: 15, color: theme.colors.textPrimary, fontWeight: 500 }}>
                      {new Date(client.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 20,
                padding: 28,
              }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                  <Icons.DollarSign size={22} style={{ color: theme.colors.success }} />
                  Financial Details
                </h2>
                <div style={{ display: "grid", gap: 20 }}>
                  {canSeeBudget && client.monthlyRetainer && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 8 }}>
                        Monthly Retainer
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.success, fontFamily: "'DM Serif Display', serif" }}>
                        ${client.monthlyRetainer.toLocaleString()}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 8 }}>
                      Total Project Budget
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: theme.colors.textPrimary, fontFamily: "'DM Serif Display', serif" }}>
                      ${stats.totalBudget.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agencies */}
            <AgenciesManager clientId={client.id} initialAgencies={client.agencies} />
          </div>
        </TabContent>
      )}

      {activeTab === "projects" && (
        <TabContent isTransitioning={false}>
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              padding: "24px 28px",
              borderBottom: "1px solid " + theme.colors.borderLight,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                <Icons.Projects size={22} style={{ color: theme.colors.primary }} />
                Projects ({projects.length})
              </h2>
              {canAddProjects && (
                <Link
                  href={`/projects/new?clientId=${client.id}`}
                  style={{
                    background: theme.gradients.primary,
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: 12,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    boxShadow: "0 4px 12px rgba(118, 82, 124, 0.3)",
                    transition: "all 0.2s",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(118, 82, 124, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(118, 82, 124, 0.3)";
                  }}
                >
                  + Add Project
                </Link>
              )}
            </div>

            {projects.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: theme.colors.textMuted }}>
                <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center", opacity: 0.5 }}>
                  <Icons.Projects size={64} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
                  No projects yet
                </div>
                <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
                  Create your first project to get started
                </div>
              </div>
            ) : (
              <div>
                {projects.map((project, idx) => (
                  <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      padding: "20px 28px",
                      borderBottom: idx < projects.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${theme.colors.primaryBg}50`;
                      e.currentTarget.style.paddingLeft = "32px";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.paddingLeft = "28px";
                    }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: theme.colors.textPrimary, fontSize: 16, marginBottom: 4 }}>
                            {project.name}
                          </div>
                          <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                            {project.serviceType.replace("_", " ")} • {project.completedTasks}/{project.totalTasks} tasks
                          </div>
                        </div>
                        <StatusBadge status={project.status} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, height: 8, background: theme.colors.bgTertiary, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: project.completionPercentage + "%",
                            background: theme.gradients.progress,
                            borderRadius: 4,
                            transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                          }} />
                        </div>
                        <span style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 600, minWidth: 45 }}>
                          {project.completionPercentage}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabContent>
      )}

      {activeTab === "onboarding" && (
        <TabContent isTransitioning={false}>
          <OnboardingManager
            clientId={client.id}
            clientStatus={client.status}
            initialItems={onboarding}
          />
        </TabContent>
      )}

      {activeTab === "team" && (
        <TabContent isTransitioning={false}>
          <TeamManager
            clientId={client.id}
            initialTeam={team}
            canEdit={canManageTeam}
          />
        </TabContent>
      )}

      {activeTab === "resources" && (
        <TabContent isTransitioning={false}>
          <ClientResources
            clientId={client.id}
            initialResources={resources}
          />
        </TabContent>
      )}

      {activeTab === "calendar" && (
        <TabContent isTransitioning={false}>
          <ClientCalendar clientId={client.id} />
        </TabContent>
      )}

      {activeTab === "key-dates" && (
        <TabContent isTransitioning={false}>
          <KeyDatesManager clientId={client.id} />
        </TabContent>
      )}
    </>
  )}
      </main>
    </div>
  );
}
