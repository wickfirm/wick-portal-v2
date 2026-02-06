"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

const crmNavItems = [
  { href: "/crm", label: "Overview", icon: "dashboard" },
  { href: "/crm/leads", label: "All Leads", icon: "users" },
  { href: "/crm/pipeline", label: "Pipeline", icon: "kanban" },
  { href: "/crm/analytics", label: "Analytics", icon: "chart" },
];

const icons: Record<string, JSX.Element> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  kanban: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="4" height="16" rx="1" />
      <rect x="10" y="4" width="4" height="10" rx="1" />
      <rect x="16" y="4" width="4" height="14" rx="1" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Header />
      <div>
        {/* CRM Sub-navigation */}
      <div style={{
        background: theme.colors.bgSecondary,
        borderBottom: `1px solid ${theme.colors.borderLight}`,
        marginBottom: 0,
      }}>
        <div style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 32,
          height: 52,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            fontSize: 15,
            color: theme.colors.textPrimary,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>CRM</span>
          </div>
          <nav style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            {crmNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/crm" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                    background: isActive ? theme.colors.primaryBg : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {icons[item.icon]}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* CRM Content */}
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: 24,
      }}>
        {children}
      </div>
      </div>
    </>
  );
}
