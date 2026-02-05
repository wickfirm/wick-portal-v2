"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Header from "@/components/Header";
import { theme, STATUS_STYLES } from "@/lib/theme";

type Client = {
  id: string;
  name: string;
  nickname: string | null;
  status: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  pinned: boolean;
  projects: {
    id: string;
    status: string;
  }[];
};

type ClientsData = {
  clients: Client[];
  stats: {
    total: number;
    active: number;
    onboarding: number;
    leads: number;
    churned: number;
  };
  isAdmin: boolean;
};

// SVG Icons
const icons = {
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  checkCircle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  loader: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  building: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  mail: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  alertTriangle: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  usersEmpty: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  chevron: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  pin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  ),
  pinFilled: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  ),
};

// Loading skeleton component
function ClientsPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ width: 140, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ width: 260, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
          <div style={{ width: 140, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.bgTertiary }} />
                <div style={{ width: 48, height: 28, background: theme.colors.bgTertiary, borderRadius: 6 }} />
              </div>
              <div style={{ width: 100, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ padding: "18px 22px", borderBottom: i < 5 ? `1px solid ${theme.colors.bgTertiary}` : "none", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, background: theme.colors.bgTertiary, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 180, height: 18, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: 240, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
              <div style={{ width: 60, height: 24, background: theme.colors.bgTertiary, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Error component
function ClientsError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{
          background: theme.colors.errorBg,
          border: `1px solid ${theme.colors.error}20`,
          borderRadius: 16,
          padding: 56,
          textAlign: "center",
        }}>
          <div style={{ color: theme.colors.error, marginBottom: 16, display: "flex", justifyContent: "center" }}>
            {icons.alertTriangle}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.error, marginBottom: 8 }}>
            Failed to load clients
          </h2>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 24, fontSize: 14 }}>
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={retry}
            style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: theme.shadows.button,
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [hideChurned, setHideChurned] = useState(true); // Default: hide churned clients

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 20}px)`,
    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  // Row animation for list items - staggered effect
  const rowAnim = (index: number, baseDelay: number = 0.2) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateX(${mounted ? 0 : -12}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + Math.min(index * 0.04, 0.4)}s`,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ClientsData>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients/list");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    enabled: status === "authenticated",
  });

  const togglePin = async (clientId: string, currentPinned: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentPinned }),
      });

      if (res.ok) {
        // Optimistically update the cache
        queryClient.setQueryData<ClientsData>(["clients"], (old) => {
          if (!old) return old;
          const updatedClients = old.clients.map(c =>
            c.id === clientId ? { ...c, pinned: !currentPinned } : c
          );
          // Re-sort: pinned first, then by name
          updatedClients.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.name.localeCompare(b.name);
          });
          return { ...old, clients: updatedClients };
        });
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  const userRole = (session?.user as any)?.role;
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(userRole);

  if (status === "loading") return <ClientsPageSkeleton />;
  if (!session) return null;
  if (isLoading) return <ClientsPageSkeleton />;
  if (error) return <ClientsError error={error as Error} retry={() => refetch()} />;
  if (!data) return <ClientsError error={new Error("No data received")} retry={() => refetch()} />;

  const { clients, stats, isAdmin: isAdminFromApi } = data;

  const filteredClients = clients.filter(client => {
    // Hide churned clients if checkbox is checked (only relevant for admins)
    if (hideChurned && client.status === "CHURNED") return false;

    const matchesFilter = filter === "ALL" || client.status === filter;
    const matchesSearch = !search ||
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statCards = [
    { label: "Total Clients", value: stats.total, icon: icons.users, color: theme.colors.primary, bg: theme.colors.primaryBg },
    { label: "Active", value: stats.active, icon: icons.checkCircle, color: theme.colors.success, bg: theme.colors.successBg },
    { label: "Onboarding", value: stats.onboarding, icon: icons.loader, color: theme.colors.info, bg: theme.colors.infoBg },
    { label: "Leads", value: stats.leads, icon: icons.target, color: theme.colors.warning, bg: theme.colors.warningBg },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, ...anim(0.05) }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>
              Clients
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
              Manage your client relationships
            </p>
          </div>
          {isAdmin && (
            <Link href="/clients/new" style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "10px 22px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: theme.shadows.button,
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              {icons.plus} New Client
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {statCards.map((card, cardIdx) => (
            <div
              key={card.label}
              style={{
                background: theme.colors.bgSecondary,
                padding: "18px 20px",
                borderRadius: 14,
                border: `1px solid ${theme.colors.borderLight}`,
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                ...anim(0.08 + cardIdx * 0.05),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1 }}>
                  {card.value}
                </div>
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 500 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", ...anim(0.15) }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.colors.textMuted, display: "flex", alignItems: "center" }}>
              {icons.search}
            </div>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px 10px 40px",
                borderRadius: 10,
                border: `1px solid ${theme.colors.borderLight}`,
                background: theme.colors.bgSecondary,
                color: theme.colors.textPrimary,
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.borderLight}
            />
          </div>
          {/* Hide Churned checkbox (admins only) */}
          {isAdminFromApi && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${theme.colors.borderLight}`,
                background: theme.colors.bgSecondary,
                fontSize: 13,
                color: theme.colors.textSecondary,
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={hideChurned}
                onChange={(e) => setHideChurned(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: theme.colors.primary,
                  cursor: "pointer",
                }}
              />
              Hide churned
            </label>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            {(isAdminFromApi ? ["ALL", "ACTIVE", "ONBOARDING", "LEAD", "CHURNED"] : ["ALL", "ACTIVE", "ONBOARDING", "LEAD"]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setFilter(s);
                  // If selecting CHURNED filter, automatically uncheck hide churned
                  if (s === "CHURNED") setHideChurned(false);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: filter === s ? "none" : `1px solid ${theme.colors.borderLight}`,
                  background: filter === s ? (s === "CHURNED" ? theme.colors.error : theme.gradients.primary) : theme.colors.bgSecondary,
                  color: filter === s ? "white" : theme.colors.textSecondary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: filter === s ? theme.shadows.button : "none",
                }}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Clients List */}
        <div style={anim(0.2)}>
        {filteredClients.length === 0 ? (
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 16,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: 64,
            textAlign: "center",
          }}>
            <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
              {icons.usersEmpty}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
              {search || filter !== "ALL" ? "No clients found" : "No clients yet"}
            </h3>
            <p style={{ color: theme.colors.textSecondary, marginBottom: 24, fontSize: 14 }}>
              {search || filter !== "ALL"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first client"}
            </p>
            {!search && filter === "ALL" && (
              <Link href="/clients/new" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: theme.gradients.primary,
                color: "white",
                padding: "10px 22px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 14,
                boxShadow: theme.shadows.button,
              }}>
                {icons.plus} Add Client
              </Link>
            )}
          </div>
        ) : (
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 16, border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden" }}>
            {filteredClients.map((client, idx) => {
              const activeProjects = client.projects.filter(p => p.status === "IN_PROGRESS").length;
              return (
                <Link key={client.id} href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit", display: "block", ...rowAnim(idx) }}>
                  <div
                    style={{
                      padding: "18px 22px",
                      borderBottom: idx < filteredClients.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.colors.bgPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: theme.gradients.wick,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 18,
                      flexShrink: 0,
                    }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                          {client.name}
                        </h3>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: STATUS_STYLES[client.status]?.bg || theme.colors.bgTertiary,
                          color: STATUS_STYLES[client.status]?.color || theme.colors.textSecondary,
                        }}>
                          {client.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: theme.colors.textMuted }}>
                        {client.industry && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {icons.building} {client.industry}
                          </span>
                        )}
                        {client.email && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {icons.mail} {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {icons.phone} {client.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Project Count */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary }}>{client.projects.length}</div>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                        {activeProjects > 0 ? `${activeProjects} active` : "projects"}
                      </div>
                    </div>

                    {/* Pin Button */}
                    <button
                      onClick={(e) => togglePin(client.id, client.pinned, e)}
                      title={client.pinned ? "Unpin client" : "Pin client to top"}
                      style={{
                        background: client.pinned ? theme.colors.primaryBg : "transparent",
                        border: "none",
                        padding: 8,
                        borderRadius: 8,
                        cursor: "pointer",
                        color: client.pinned ? theme.colors.primary : theme.colors.textMuted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        if (!client.pinned) {
                          e.currentTarget.style.background = theme.colors.bgTertiary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!client.pinned) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {client.pinned ? icons.pinFilled : icons.pin}
                    </button>

                    {/* Chevron */}
                    <div style={{ color: theme.colors.textMuted, flexShrink: 0 }}>
                      {icons.chevron}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
