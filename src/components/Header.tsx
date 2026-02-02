"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { theme } from "@/lib/theme";
import dynamic from "next/dynamic";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";

const TimerWidget = dynamic(() => import("./TimerWidget"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: 120,
      height: 36,
      borderRadius: 8,
      background: "transparent"
    }} />
  )
});

// SVG Icon components (Lucide-style, 20x20)
const icons: Record<string, JSX.Element> = {
  Dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Daily: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  HR: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  "Lead Qualifier": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Clients: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Projects: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Tasks: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Notes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><rect x="8" y="14" width="3" height="3" rx="0.5" /><rect x="13" y="14" width="3" height="3" rx="0.5" />
    </svg>
  ),
  Finance: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  "Media Hub": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  ),
  Timesheet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Team: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Agencies: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Analytics: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Tenants: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role || "";
  const [collapsed, setCollapsed] = useState(true);

  const isPlatformAdmin = userRole === "PLATFORM_ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isMember = userRole === "MEMBER";

  // Hide sidebar on public pages
  const isPublicPage = pathname?.startsWith("/login") ||
                       pathname?.startsWith("/widget") ||
                       pathname?.startsWith("/test");

  if (isPublicPage || !session) return null;

  // Navigation based on role
  const navItems = isPlatformAdmin ? [
    { href: "/platform-admin", label: "Dashboard" },
    { href: "/platform-admin/agencies", label: "Tenants" },
    { href: "/platform-admin/users", label: "Users" },
    { href: "/platform-admin/analytics", label: "Analytics" },
    { href: "/settings", label: "Settings" },
  ] : isMember ? [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/daily", label: "Daily" },
    { href: "/clients", label: "Clients" },
    { href: "/projects", label: "Projects" },
    { href: "/tasks", label: "Tasks" },
    { href: "/notes", label: "Notes" },
    { href: "/calendar", label: "Calendar" },
    { href: "/timesheet", label: "Timesheet" },
    { href: "/settings", label: "Settings" },
  ] : isSuperAdmin ? [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/daily", label: "Daily" },
    { href: "/dashboard/hr", label: "HR" },
    { href: "/lead-qualifier", label: "Lead Qualifier" },
    { href: "/clients", label: "Clients" },
    { href: "/projects", label: "Projects" },
    { href: "/tasks", label: "Tasks" },
    { href: "/notes", label: "Notes" },
    { href: "/calendar", label: "Calendar" },
    { href: "/finance", label: "Finance" },
    { href: "/media", label: "Media Hub" },
    { href: "/timesheet", label: "Timesheet" },
    { href: "/team", label: "Team" },
    { href: "/agencies", label: "Agencies" },
    { href: "/analytics", label: "Analytics" },
    { href: "/settings", label: "Settings" },
  ] : [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/daily", label: "Daily" },
    { href: "/dashboard/hr", label: "HR" },
    { href: "/clients", label: "Clients" },
    { href: "/projects", label: "Projects" },
    { href: "/tasks", label: "Tasks" },
    { href: "/notes", label: "Notes" },
    { href: "/calendar", label: "Calendar" },
    { href: "/timesheet", label: "Timesheet" },
    { href: "/team", label: "Team" },
    { href: "/analytics", label: "Analytics" },
    { href: "/settings", label: "Settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/platform-admin") return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 230,
        background: theme.colors.bgSecondary,
        borderRight: `1px solid ${theme.colors.borderLight}`,
        position: "fixed",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 1000,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "18px 14px" : "18px 22px",
          borderBottom: `1px solid ${theme.colors.borderLight}`,
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-start",
          alignItems: "center",
          minHeight: 60,
        }}>
          <Link href="/dashboard">
            <img src="/Wick-logo-black.png" alt="Wick" style={{ height: collapsed ? 32 : 38, transition: "height 0.2s" }} />
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: collapsed ? "10px 0" : "10px 14px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    textDecoration: "none",
                    color: active ? theme.colors.primary : theme.colors.textSecondary,
                    background: active ? theme.colors.primaryBg : "transparent",
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 450,
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = theme.colors.bgTertiary;
                      e.currentTarget.style.color = theme.colors.textPrimary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = theme.colors.textSecondary;
                    }
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    {icons[item.label] || (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /></svg>
                    )}
                  </span>
                  {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
                  {active && (
                    <div style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 3,
                      height: 20,
                      background: theme.colors.primary,
                      borderRadius: "0 3px 3px 0",
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: "14px 0",
            border: "none",
            borderTop: `1px solid ${theme.colors.borderLight}`,
            background: "transparent",
            cursor: "pointer",
            color: theme.colors.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textMuted}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(0)" : "rotate(180deg)", transition: "transform 0.2s" }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </aside>

      {/* Top Bar */}
      <header style={{
        marginLeft: collapsed ? 64 : 230,
        background: theme.colors.bgSecondary,
        borderBottom: `1px solid ${theme.colors.borderLight}`,
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 90,
        transition: "margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Search */}
        <GlobalSearch />

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <TimerWidget />
          <NotificationBell />
          <Link href="/settings/account" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}>
              {user?.name?.charAt(0) || "U"}
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ fontWeight: 500, color: theme.colors.textPrimary, lineHeight: 1.3 }}>{user?.name || "User"}</div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted, lineHeight: 1.3 }}>{userRole.replace("_", " ")}</div>
            </div>
          </Link>
        </div>
      </header>

      {/* Content spacer */}
      <div style={{ marginLeft: collapsed ? 64 : 230, transition: "margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </>
  );
}
