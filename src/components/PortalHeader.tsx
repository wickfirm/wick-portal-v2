"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { theme } from "@/lib/theme";

export default function PortalHeader({ userName }: { userName?: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/onboarding", label: "Onboarding" },
    { href: "/portal/projects", label: "Projects" },
    { href: "/portal/tasks", label: "Tasks" },
    { href: "/portal/metrics", label: "Metrics" },
    { href: "/portal/team", label: "Team" },
    { href: "/portal/resources", label: "Resources" },
  ];

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            background: theme.gradients.accent,
            borderRadius: theme.borderRadius.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: 14
          }}>
            W
          </div>
          <span style={{ fontWeight: 600, fontSize: 18, color: theme.colors.textPrimary }}>Client Portal</span>
        </div>
        
        <nav style={{ display: "flex", gap: 4 }}>
          {navItems.map((item) => (
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
        {userName && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>{userName}</span>
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
            border: `1px solid ${theme.colors.borderLight}`
          }}
        >
          Sign out
        </Link>
      </div>
    </header>
  );
}
