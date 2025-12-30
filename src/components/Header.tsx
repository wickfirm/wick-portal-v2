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
    <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>
          Wick Portal
        </Link>
        <nav style={{ display: "flex", gap: 16 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: isActive(item.href) ? "#333" : "#666",
                textDecoration: "none",
                fontWeight: isActive(item.href) ? 500 : 400,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {userName && <span>{userName}</span>}
        {userRole && (
          <span style={{ background: "#eee", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
            {userRole}
          </span>
        )}
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>
          Sign out
        </Link>
      </div>
    </header>
  );
}
