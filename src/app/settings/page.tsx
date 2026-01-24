"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

// Loading skeleton
function SettingsPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header Skeleton */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 140, height: 36, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
          <div style={{ width: 280, height: 20, background: theme.colors.bgSecondary, borderRadius: 6 }} />
        </div>

        {/* Settings Cards Skeleton */}
        <div style={{ display: "grid", gap: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: theme.colors.bgTertiary }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "40%", height: 24, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ width: "70%", height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return <SettingsPageSkeleton />;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) return null;

  const user = session.user as any;

  const settingsItems = [
    {
      title: "Account",
      description: "Manage your profile and change your password",
      href: "/settings/account",
      icon: "👤",
      color: theme.colors.purple,
      roles: ["SUPER_ADMIN", "ADMIN", "MEMBER"],
    },
    {
      title: "HR Settings",
      description: "Configure leave policies and working hours",
      href: "/settings/hr",
      icon: "👥",
      color: "#10B981",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Agencies",
      description: "Manage agencies that service your clients",
      href: "/settings/agencies",
      icon: "🏢",
      color: theme.colors.warning,
      roles: ["SUPER_ADMIN"],
    },
    {
      title: "Rates",
      description: "Manage team member hourly and billing rates",
      href: "/settings/rates",
      icon: "💰",
      color: theme.colors.success,
      roles: ["SUPER_ADMIN"],
    },
    {
      title: "Stage Templates",
      description: "Configure default project stages for each service type",
      href: "/settings/stage-templates",
      icon: "📋",
      color: theme.colors.primary,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Onboarding Templates",
      description: "Set up default onboarding checklists for new clients",
      href: "/settings/onboarding",
      icon: "✅",
      color: theme.colors.info,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Task Categories",
      description: "Manage categories for client tasks",
      href: "/settings/tasks",
      icon: "📁",
      color: theme.colors.warning,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  // Filter settings based on user role
  const visibleItems = settingsItems.filter(item => item.roles.includes(user.role));

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Settings</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Configure your agency portal</p>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                background: theme.colors.bgSecondary,
                padding: 24,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.borderMedium;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = theme.shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.borderLight;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: item.color + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, margin: 0, marginBottom: 4 }}>
                  {item.title}
                </h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: 14, margin: 0 }}>
                  {item.description}
                </p>
              </div>
              <div style={{ color: theme.colors.textMuted, fontSize: 18 }}>→</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
