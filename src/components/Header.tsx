"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { theme } from "@/lib/theme";
import NotificationBell from "./NotificationBell";

// Icon mapping
const ICONS: Record<string, string> = {
  "Dashboard": "📊", "Daily": "📅", "HR": "👔", "Lead Qualifier": "🎯",
  "Clients": "👤", "Projects": "📁", "Tasks": "✓", "Finance": "💰",
  "Media Hub": "🎬", "Timesheet": "⏱️", "Team": "👥", "Agencies": "🏢",
  "Analytics": "📈", "Settings": "⚙️", "Tenants": "🏢", "Users": "👥",
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role || "";
  const [collapsed, setCollapsed] = useState(false);

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
        width: collapsed ? 60 : 220,
        background: theme.colors.bgSecondary,
        borderRight: `1px solid ${theme.colors.borderLight}`,
        position: "fixed",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s",
        zIndex: 1000,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "16px 12px" : "16px 20px",
          borderBottom: `1px solid ${theme.colors.borderLight}`,
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <Link href="/dashboard">
            <img src="/Wick-logo-black.png" alt="Wick" style={{ height: collapsed ? 28 : 32 }} />
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "12px 16px" : "12px 20px",
                textDecoration: "none",
                color: isActive(item.href) ? theme.colors.primary : theme.colors.textSecondary,
                background: isActive(item.href) ? theme.colors.primaryBg : "transparent",
                borderLeft: isActive(item.href) ? `3px solid ${theme.colors.primary}` : "3px solid transparent",
                fontSize: 14,
                fontWeight: isActive(item.href) ? 600 : 400,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => !isActive(item.href) && (e.currentTarget.style.background = theme.colors.bgTertiary)}
              onMouseLeave={(e) => !isActive(item.href) && (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 18 }}>{ICONS[item.label] || "•"}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: 12,
            border: "none",
            borderTop: `1px solid ${theme.colors.borderLight}`,
            background: "transparent",
            cursor: "pointer",
            fontSize: 18,
            color: theme.colors.textMuted,
          }}
        >
          {collapsed ? "→" : "←"}
        </button>
      </aside>

      {/* Top Bar */}
      <header style={{
        marginLeft: collapsed ? 60 : 220,
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
        transition: "margin-left 0.2s",
      }}>
        {/* Search */}
        <div style={{ flex: 1, maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Search..."
            style={{
              width: "100%",
              padding: "8px 12px",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 6,
              fontSize: 14,
              background: theme.colors.bgPrimary,
            }}
          />
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <NotificationBell />
          <Link href="/settings/account" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: theme.colors.primary,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}>
              {user?.name?.charAt(0) || "U"}
            </div>
            <div style={{ fontSize: 14 }}>
              <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{user?.name || "User"}</div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{userRole.replace("_", " ")}</div>
            </div>
          </Link>
        </div>
      </header>

      {/* Content spacer */}
      <div style={{ marginLeft: collapsed ? 60 : 220, transition: "margin-left 0.2s" }} />
    </>
  );
}
