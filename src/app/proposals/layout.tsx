"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

const proposalNavItems = [
  { href: "/proposals", label: "All Proposals", icon: "list" },
  { href: "/proposals/new", label: "New Proposal", icon: "plus" },
];

const icons: Record<string, JSX.Element> = {
  list: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
};

export default function ProposalsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Header />
      <div>
        {/* Proposals Sub-navigation */}
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Proposals</span>
            </div>
            <nav style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              {proposalNavItems.map((item) => {
                const isActive = item.href === "/proposals"
                  ? pathname === "/proposals"
                  : pathname?.startsWith(item.href);
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

        {/* Content */}
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
