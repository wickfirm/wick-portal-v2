"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

// SVG icons for each settings section
const settingsIcons: Record<string, JSX.Element> = {
  Account: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Notifications: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  "HR Settings": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Agencies: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Rates: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  "Stage Templates": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  "Onboarding Templates": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  "Task Categories": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  "Service Types": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
};

// Loading skeleton
function SettingsPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 140, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
          <div style={{ width: 280, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 22, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: theme.colors.bgTertiary }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "40%", height: 20, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ width: "70%", height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
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

  if (status === "loading") return <SettingsPageSkeleton />;
  if (!session) return null;

  const user = session.user as any;

  const settingsItems = [
    { title: "Account", description: "Manage your profile and change your password", href: "/settings/account", color: theme.colors.purple, roles: ["SUPER_ADMIN", "ADMIN", "MEMBER"] },
    { title: "Notifications", description: "Control how and when you receive notifications", href: "/notifications/preferences", color: theme.colors.info, roles: ["SUPER_ADMIN", "ADMIN", "MEMBER"] },
    { title: "HR Settings", description: "Configure leave policies and working hours", href: "/settings/hr", color: "#10B981", roles: ["SUPER_ADMIN", "ADMIN"] },
    { title: "Agencies", description: "Manage agencies that service your clients", href: "/settings/agencies", color: theme.colors.warning, roles: ["SUPER_ADMIN"] },
    { title: "Rates", description: "Manage team member hourly and billing rates", href: "/settings/rates", color: theme.colors.success, roles: ["SUPER_ADMIN"] },
    { title: "Stage Templates", description: "Configure default project stages for each service type", href: "/settings/stage-templates", color: theme.colors.primary, roles: ["SUPER_ADMIN", "ADMIN"] },
    { title: "Onboarding Templates", description: "Set up default onboarding checklists for new clients", href: "/settings/onboarding", color: theme.colors.info, roles: ["SUPER_ADMIN", "ADMIN"] },
    { title: "Task Categories", description: "Manage categories for client tasks", href: "/settings/tasks", color: theme.colors.warning, roles: ["SUPER_ADMIN", "ADMIN"] },
    { title: "Service Types", description: "Manage the services your agency offers (SEO, Paid Media, etc.)", href: "/settings/service-types", color: "#6366F1", roles: ["SUPER_ADMIN", "ADMIN"] },
  ];

  const visibleItems = settingsItems.filter(item => item.roles.includes(user.role));

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 48px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>Settings</h1>
          <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>Configure your agency portal</p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                background: theme.colors.bgSecondary,
                padding: "20px 22px",
                borderRadius: 14,
                border: `1px solid ${theme.colors.borderLight}`,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
                e.currentTarget.style.borderColor = "transparent";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = theme.colors.borderLight;
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: item.color + "14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.color,
                flexShrink: 0,
              }}>
                {settingsIcons[item.title] || (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /></svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary, margin: "0 0 2px 0" }}>
                  {item.title}
                </h3>
                <p style={{ color: theme.colors.textMuted, fontSize: 13, margin: 0 }}>
                  {item.description}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
