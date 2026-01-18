"use client";

import { usePathname } from "next/navigation";

// Inside the component, add:
const pathname = usePathname();
const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
const isPlatformAdminRoute = pathname?.startsWith("/platform-admin");

// Replace the navigation links section with:
{!isPlatformAdmin ? (
  // Regular agency navigation
  <>
    <Link
      href="/dashboard"
      style={{
        color: pathname === "/dashboard" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/dashboard" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Dashboard
    </Link>
    <Link
      href="/clients"
      style={{
        color: pathname?.startsWith("/clients") ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname?.startsWith("/clients") ? 600 : 400,
        fontSize: 15,
      }}
    >
      Clients
    </Link>
    <Link
      href="/projects"
      style={{
        color: pathname?.startsWith("/projects") ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname?.startsWith("/projects") ? 600 : 400,
        fontSize: 15,
      }}
    >
      Projects
    </Link>
    <Link
      href="/timesheet"
      style={{
        color: pathname === "/timesheet" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/timesheet" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Timesheet
    </Link>
    <Link
      href="/team"
      style={{
        color: pathname === "/team" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/team" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Team
    </Link>
    <Link
      href="/agencies"
      style={{
        color: pathname === "/agencies" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/agencies" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Agencies
    </Link>
    <Link
      href="/analytics"
      style={{
        color: pathname === "/analytics" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/analytics" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Analytics
    </Link>
    <Link
      href="/settings"
      style={{
        color: pathname === "/settings" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/settings" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Settings
    </Link>
  </>
) : (
  // Platform Admin navigation
  <>
    <Link
      href="/platform-admin"
      style={{
        color: pathname === "/platform-admin" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/platform-admin" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Dashboard
    </Link>
    <Link
      href="/platform-admin/agencies"
      style={{
        color: pathname === "/platform-admin/agencies" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/platform-admin/agencies" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Agencies
    </Link>
    <Link
      href="/platform-admin/users"
      style={{
        color: pathname === "/platform-admin/users" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/platform-admin/users" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Users
    </Link>
    <Link
      href="/platform-admin/analytics"
      style={{
        color: pathname === "/platform-admin/analytics" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/platform-admin/analytics" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Analytics
    </Link>
    <Link
      href="/settings"
      style={{
        color: pathname === "/settings" ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: "none",
        fontWeight: pathname === "/settings" ? 600 : 400,
        fontSize: 15,
      }}
    >
      Settings
    </Link>
  </>
)}
