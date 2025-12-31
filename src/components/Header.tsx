"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ userName, userRole }: { userName?: string; userRole?: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/clients", label: "Clients" },
    { href: "/projects", label: "Projects" },
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
      background: "#ffffff",
      padding: "0 24px",
      borderBottom: "1px solid #e8eaed",
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
            background: "linear-gradient(135deg, #e85a4f, #f8b739)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: 14
          }}>
            W
          </div>
          <span style={{ fontWeight: 600, fontSize: 18, color: "#1a1a1a" }}>Wick Portal</span>
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
                color: isActive(item.href) ? "#e85a4f" : "#5f6368",
                background: isActive(item.href) ? "rgba(232, 90, 79, 0.08)" : "transparent",
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "linear-gradient(135deg, #e85a4f, #f8b739)",
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
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{userName}</div>
              {userRole && (
                <div style={{ fontSize: 11, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {userRole}
                </div>
              )}
            </div>
          </div>
        )}
        <Link 
          href="/api/auth/signout" 
          style={{ 
            color: "#5f6368", 
            textDecoration: "none", 
            fontSize: 14,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #e8eaed",
            transition: "all 150ms ease"
          }}
        >
          Sign out
        </Link>
      </div>
    </header>
  );
}
