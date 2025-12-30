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
    <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <span style={{ fontWeight: "bold", fontSize: 20, color: "#333" }}>Wick Portal</span>
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
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {userName && <span style={{ color: "#666" }}>{userName}</span>}
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>
          Sign out
        </Link>
      </div>
    </header>
  );
}
