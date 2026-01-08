"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { theme } from "@/lib/theme";
import TimerWidget from "./TimerWidget";

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const userName = user?.name || "";
  const userRole = user?.role || "";

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/clients", label: "Clients" },
    { href: "/projects", label: "Projects" },
    { href: "/timesheet", label: "Timesheet" },
    { href: "/team", label: "Team" },
    { href: "/analytics", label: "Analytics" },
    { href: "/settings", label: "Settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
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
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
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
          <span style={{ fontWeight: 600, fontSize: 18, color: theme.colors.textPrimary }}>Wick Portal</span>
        </Link>
        
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
        <TimerWidget />
        
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
