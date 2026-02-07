"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { theme, STATUS_STYLES } from "@/lib/theme";

// Proposal status styles
const PROPOSAL_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: theme.colors.bgTertiary, color: theme.colors.textSecondary },
  SENT: { bg: theme.colors.infoBg, color: theme.colors.info },
  VIEWED: { bg: theme.colors.warningBg, color: theme.colors.warning },
  NEGOTIATING: { bg: "#fff3e0", color: "#e65100" },
  ACCEPTED: { bg: theme.colors.successBg, color: theme.colors.success },
  DECLINED: { bg: theme.colors.errorBg, color: theme.colors.error },
  EXPIRED: { bg: theme.colors.bgTertiary, color: theme.colors.textMuted },
};

const icons = {
  document: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  money: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  send: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  chevron: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  emptyDoc: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

type Proposal = {
  id: string;
  title: string;
  projectType: string;
  status: string;
  currency: string;
  total: number;
  startupPrice: number | null;
  ongoingPrice: number | null;
  viewCount: number;
  lastViewedAt: string | null;
  sentAt: string | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  client: { id: string; name: string; nickname: string | null };
  createdByUser: { id: string; name: string };
  _count: { items: number; comments: number };
};

type Stats = {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  declined: number;
  totalValue: number;
  wonValue: number;
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

function ProposalsPageSkeleton() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ width: 200, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
          <div style={{ width: 300, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
        </div>
        <div style={{ width: 160, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.bgTertiary, marginBottom: 12 }} />
            <div style={{ width: 48, height: 28, background: theme.colors.bgTertiary, borderRadius: 6 }} />
          </div>
        ))}
      </div>
      <div style={{ background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ padding: "18px 22px", borderBottom: i < 4 ? `1px solid ${theme.colors.bgTertiary}` : "none", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, background: theme.colors.bgTertiary, borderRadius: 12 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: 200, height: 18, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: 280, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProposalsPage() {
  const { status } = useSession();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const res = await fetch("/api/proposals");
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  const proposals: Proposal[] = data?.proposals || [];
  const stats: Stats = data?.stats || { total: 0, draft: 0, sent: 0, accepted: 0, declined: 0, totalValue: 0, wonValue: 0 };

  // Filter & search
  const filtered = proposals.filter((p) => {
    if (filter !== "ALL" && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.client.name.toLowerCase().includes(q) ||
        p.projectType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (isLoading) return <ProposalsPageSkeleton />;

  const statCards = [
    { label: "Total Proposals", value: stats.total, icon: icons.document, color: theme.colors.primary, bg: theme.colors.primaryBg },
    { label: "Sent / In Progress", value: stats.sent, icon: icons.send, color: theme.colors.info, bg: theme.colors.infoBg },
    { label: "Accepted", value: stats.accepted, icon: icons.check, color: theme.colors.success, bg: theme.colors.successBg },
    { label: "Pipeline Value", value: formatCurrency(stats.totalValue, "AED"), icon: icons.money, color: theme.colors.warning, bg: theme.colors.warningBg },
  ];

  const filterTabs = [
    { key: "ALL", label: "All" },
    { key: "DRAFT", label: "Drafts" },
    { key: "SENT", label: "Sent" },
    { key: "VIEWED", label: "Viewed" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "DECLINED", label: "Declined" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, marginBottom: 4 }}>
            Proposals
          </h1>
          <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0 }}>
            Create, send, and track client proposals
          </p>
        </div>
        <Link
          href="/proposals/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: theme.gradients.primary,
            color: "#fff",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: theme.shadows.button,
            transition: "all 0.15s ease",
          }}
        >
          {icons.plus}
          New Proposal
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <div
            key={i}
            style={{
              background: theme.colors.bgSecondary,
              padding: "18px 20px",
              borderRadius: 14,
              border: `1px solid ${theme.colors.borderLight}`,
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: card.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: card.color,
              }}>
                {card.icon}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>
                {card.value}
              </div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 500 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                color: filter === tab.key ? theme.colors.primary : theme.colors.textSecondary,
                background: filter === tab.key ? theme.colors.primaryBg : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: theme.colors.bgSecondary,
          borderRadius: 8,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <span style={{ color: theme.colors.textMuted }}>{icons.search}</span>
          <input
            type="text"
            placeholder="Search proposals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: theme.colors.textPrimary,
              width: 180,
            }}
          />
        </div>
      </div>

      {/* Proposals List */}
      {filtered.length === 0 ? (
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 14,
          border: `1px solid ${theme.colors.borderLight}`,
          padding: "60px 20px",
          textAlign: "center",
        }}>
          <div style={{ color: theme.colors.textMuted, marginBottom: 12 }}>{icons.emptyDoc}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            {search || filter !== "ALL" ? "No proposals match your filters" : "No proposals yet"}
          </div>
          <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 20 }}>
            {search || filter !== "ALL" ? "Try adjusting your search or filter" : "Create your first proposal to get started"}
          </div>
          {!search && filter === "ALL" && (
            <Link
              href="/proposals/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                background: theme.gradients.primary,
                color: "#fff",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              {icons.plus} Create Proposal
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 14,
          border: `1px solid ${theme.colors.borderLight}`,
          overflow: "hidden",
        }}>
          {filtered.map((proposal, i) => {
            const statusStyle = PROPOSAL_STATUS_STYLES[proposal.status] || PROPOSAL_STATUS_STYLES.DRAFT;
            return (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 22px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  gap: 16,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = theme.colors.bgPrimary;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Client Initial */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: theme.colors.primaryBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.colors.primary,
                  flexShrink: 0,
                }}>
                  {proposal.client.name.charAt(0).toUpperCase()}
                </div>

                {/* Proposal Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary }}>
                      {proposal.title}
                    </span>
                    <span style={{
                      padding: "2px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {proposal.status}
                    </span>
                    {proposal.version > 1 && (
                      <span style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 500 }}>
                        v{proposal.version}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: theme.colors.textSecondary }}>
                    <span>{proposal.client.nickname || proposal.client.name}</span>
                    <span style={{ color: theme.colors.textMuted }}>·</span>
                    <span>{proposal.projectType.replace(/_/g, " ")}</span>
                    <span style={{ color: theme.colors.textMuted }}>·</span>
                    <span>{timeAgo(proposal.updatedAt)}</span>
                    {proposal.viewCount > 0 && (
                      <>
                        <span style={{ color: theme.colors.textMuted }}>·</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          {icons.eye} {proposal.viewCount}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.colors.textPrimary }}>
                    {formatCurrency(proposal.total, proposal.currency)}
                  </div>
                  {proposal.startupPrice && (
                    <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                      Startup: {formatCurrency(proposal.startupPrice, proposal.currency)}
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <div style={{ color: theme.colors.textMuted, flexShrink: 0 }}>
                  {icons.chevron}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
