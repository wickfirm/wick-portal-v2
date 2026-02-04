"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="crm-layout">
      {/* CRM Sub-navigation */}
      <div className="crm-subnav">
        <div className="crm-subnav-inner">
          <div className="crm-subnav-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>CRM</span>
          </div>
          <nav className="crm-subnav-links">
            {crmNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/crm" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`crm-subnav-link ${isActive ? "active" : ""}`}
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
      <div className="crm-content">
        {children}
      </div>

      <style jsx>{`
        .crm-layout {
          min-height: calc(100vh - 64px);
        }

        .crm-subnav {
          background: var(--card-bg, #fff);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          position: sticky;
          top: 64px;
          z-index: 40;
        }

        .crm-subnav-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          gap: 32px;
          height: 52px;
        }

        .crm-subnav-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 15px;
          color: var(--text-primary, #111827);
        }

        .crm-subnav-title svg {
          color: var(--primary-color, #7c3aed);
        }

        .crm-subnav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .crm-subnav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .crm-subnav-link:hover {
          background: var(--hover-bg, #f3f4f6);
          color: var(--text-primary, #111827);
        }

        .crm-subnav-link.active {
          background: var(--primary-light, #ede9fe);
          color: var(--primary-color, #7c3aed);
        }

        .crm-subnav-link svg {
          flex-shrink: 0;
        }

        .crm-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }

        @media (max-width: 768px) {
          .crm-subnav-inner {
            padding: 0 16px;
            gap: 16px;
            overflow-x: auto;
          }

          .crm-subnav-title span {
            display: none;
          }

          .crm-subnav-link span {
            display: none;
          }

          .crm-subnav-link {
            padding: 8px 10px;
          }

          .crm-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
