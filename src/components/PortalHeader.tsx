"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PortalHeader({ userName }: { userName?: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/projects", label: "Projects" },
    { href: "/portal/tasks", label: "Tasks" },
    { href: "/portal/metrics", label: "Metrics" },
  ];

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          <span style={{ fontWeight: 600, fontSize: 18, color: "#1a1a1a" }}>Client Portal</span>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <span style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{userName}</span>
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
            border: "1px solid #e8eaed"
          }}
        >
          Sign out
        </Link>
      </div>
    </header>
  );
}
