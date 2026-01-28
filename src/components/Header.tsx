"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { theme } from "@/lib/theme";
import { useTenant } from "@/providers/tenant-provider";
import NotificationBell from "./NotificationBell";

// Lazy load TimerWidget so it doesn't block page load
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

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const userName = user?.name || "";
  const userRole = user?.role || "";
  const userAgencyId = user?.agencyId;
  const isPlatformAdmin = userRole === "PLATFORM_ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  
  // Get tenant config from context (passed from server, no flash!)
  const tenantConfig = useTenant();
  
  // Determine branding based on tenant config
  const brandName = tenantConfig.name;
  const brandLogo = tenantConfig.logoLetter;
  const brandColor = tenantConfig.colors.primary;

  // Show loading state to prevent navigation flash
  const isLoading = status === "loading";

  // Different navigation based on role
  const navItems = isPlatformAdmin ? [
    { href: "/platform-admin", label: "Dashboard" },
    { href: "/platform-admin/agencies", label: "Tenants" },
    { href: "/platform-admin/users", label: "Users" },
    { href: "/platform-admin/analytics", label: "Analytics" },
    { href: "/settings", label: "Settings" },
  ] : userRole === "MEMBER" ? [
    // MEMBERs see limited navigation (no HR, Media Hub)
    { href: "/dashboard", label: "Dashboard" },
    { href: "/daily", label: "Daily" },
    { href: "/clients", label: "Clients" },
    { href: "/projects", label: "Projects" },
    { href: "/tasks", label: "Tasks" },
    { href: "/timesheet", label: "Timesheet" },
    { href: "/settings", label: "Settings" },
  ] : isSuperAdmin ? [
    // SUPER_ADMINs see full navigation including Finance
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
    // ADMINs see navigation WITHOUT Lead Qualifier, Media Hub, Agencies, or Finance
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

  // Create gradient based on tenant colors
  const brandGradient = tenantConfig.colors.secondary
    ? `linear-gradient(135deg, ${brandColor}, ${tenantConfig.colors.secondary})`
    : `linear-gradient(135deg, ${brandColor}, ${brandColor})`;

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/platform-admin") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <header style={{
      background: theme.colors.bgSecondary,
      padding: "0 24px",
      borderBottom: `1px solid ${theme.colors.borderLight}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      height: 64,
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <img 
            src="/Wick-logo-black.png" 
            alt="Wick"
            style={{
              height: 28,
              width: "auto"
            }}
          />
        </Link>
        
        <nav style={{ display: "flex", gap: 4 }}>
          {!isLoading && navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                color: isActive(item.href) ? theme.colors.primary : theme.colors.textSecondary,
                background: isActive(item.href) ? `${theme.colors.primary}14` : "transparent",
                textDecoration: "none",
                transition: "all 150ms ease",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <TimerWidget />
        <NotificationBell />
        
        {userName && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: theme.gradients.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: 14
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>{userName}</div>
              {userRole && (
                <div style={{ fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {userRole.replace("_", " ")}
                </div>
              )}
            </div>
          </div>
        )}
        <Link 
          href="/auth/signout" 
          style={{ 
            color: theme.colors.textSecondary, 
            textDecoration: "none", 
            fontSize: 14,
            padding: "8px 12px",
            borderRadius: 6,
            border: `1px solid ${theme.colors.borderLight}`,
            transition: "all 150ms ease"
          }}
        >
          Sign out
        </Link>
      </div>
    </header>
  );
}
