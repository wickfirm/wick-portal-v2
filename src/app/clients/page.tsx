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

// Animated number component
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, hasAnimated]);

  return <>{displayValue}</>;
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [hideChurned, setHideChurned] = useState(true);

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
    staleTime: 0,
    refetchOnMount: "always",
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
        queryClient.setQueryData<ClientsData>(["clients"], (old) => {
          if (!old) return old;
          const updatedClients = old.clients.map(c =>
            c.id === clientId ? { ...c, pinned: !currentPinned } : c
          );
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

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const userRole = (session?.user as any)?.role;
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(userRole);

  if (status === "loading") return <ClientsPageSkeleton />;
  if (!session) return null;
  if (isLoading) return <ClientsPageSkeleton />;
  if (error) return <ClientsError error={error as Error} retry={() => refetch()} />;
  if (!data) return <ClientsError error={new Error("No data received")} retry={() => refetch()} />;

  const { clients, stats, isAdmin: isAdminFromApi } = data;

  const filteredClients = clients.filter(client => {
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

  const avatarColors = [
    "linear-gradient(135deg, #7c3aed, #6d28d9)",
    "linear-gradient(135deg, #ec4899, #be185d)",
    "linear-gradient(135deg, #06b6d4, #0891b2)",
    "linear-gradient(135deg, #f59e0b, #d97706)",
    "linear-gradient(135deg, #22c55e, #16a34a)",
    "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  ];

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .clients-page {
          min-height: 100vh;
          background: ${theme.colors.bgPrimary};
        }
        .clients-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 24px 48px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .page-header.mounted { animation-delay: 0s; }
        .page-title {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          font-weight: 400;
          color: ${theme.colors.textPrimary};
          margin: 0 0 6px 0;
        }
        .page-subtitle {
          color: ${theme.colors.textMuted};
          font-size: 14px;
          margin: 0;
        }
        .new-client-btn {
          background: ${theme.gradients.primary};
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(118, 82, 124, 0.3);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .new-client-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(118, 82, 124, 0.4);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: ${theme.colors.bgSecondary};
          padding: 20px;
          border-radius: 16px;
          border: 1px solid ${theme.colors.borderLight};
          opacity: 0;
          animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          cursor: default;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
          border-color: ${theme.colors.primary}30;
        }
        .stat-card.mounted:nth-child(1) { animation-delay: 0.1s; }
        .stat-card.mounted:nth-child(2) { animation-delay: 0.15s; }
        .stat-card.mounted:nth-child(3) { animation-delay: 0.2s; }
        .stat-card.mounted:nth-child(4) { animation-delay: 0.25s; }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.1);
        }
        .stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: ${theme.colors.textPrimary};
          line-height: 1;
        }
        .stat-label {
          font-size: 13px;
          color: ${theme.colors.textSecondary};
          font-weight: 500;
          margin-top: 8px;
        }
        .filters-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: center;
          opacity: 0;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .filters-row.mounted { animation-delay: 0.3s; }
        .search-wrapper {
          flex: 1;
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: ${theme.colors.textMuted};
          display: flex;
          align-items: center;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 12px;
          border: 1px solid ${theme.colors.borderLight};
          background: ${theme.colors.bgSecondary};
          color: ${theme.colors.textPrimary};
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }
        .search-input:focus {
          border-color: ${theme.colors.primary};
          box-shadow: 0 0 0 3px ${theme.colors.primary}15;
        }
        .filter-btn {
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid ${theme.colors.borderLight};
          background: ${theme.colors.bgSecondary};
          color: ${theme.colors.textSecondary};
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          background: ${theme.colors.bgTertiary};
        }
        .filter-btn.active {
          background: ${theme.gradients.primary};
          border: none;
          color: white;
          box-shadow: 0 4px 15px rgba(118, 82, 124, 0.3);
        }
        .filter-btn.active.churned {
          background: ${theme.colors.error};
        }
        .clients-list {
          background: ${theme.colors.bgSecondary};
          border-radius: 20px;
          border: 1px solid ${theme.colors.borderLight};
          overflow: hidden;
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .clients-list.mounted { animation-delay: 0.35s; }
        .client-row {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid ${theme.colors.bgTertiary};
          text-decoration: none;
          color: inherit;
          opacity: 0;
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .client-row:last-child { border-bottom: none; }
        .client-row:hover {
          background: linear-gradient(90deg, ${theme.colors.primaryBg}50, transparent);
          padding-left: 28px;
        }
        .client-row:hover .client-avatar {
          transform: scale(1.08);
        }
        .client-row:hover .chevron-icon {
          transform: translateX(4px);
          opacity: 1;
        }
        .client-avatar {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 20px;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .client-info {
          flex: 1;
          min-width: 0;
        }
        .client-name {
          font-size: 16px;
          font-weight: 600;
          color: ${theme.colors.textPrimary};
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .status-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .client-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 13px;
          color: ${theme.colors.textMuted};
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .project-count {
          text-align: right;
          flex-shrink: 0;
        }
        .project-number {
          font-size: 24px;
          font-weight: 700;
          color: ${theme.colors.textPrimary};
          font-family: 'DM Serif Display', serif;
        }
        .project-label {
          font-size: 12px;
          color: ${theme.colors.textSecondary};
        }
        .pin-btn {
          background: transparent;
          border: none;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          color: ${theme.colors.textMuted};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .pin-btn:hover {
          background: ${theme.colors.bgTertiary};
          color: ${theme.colors.primary};
        }
        .pin-btn.pinned {
          background: ${theme.colors.primaryBg};
          color: ${theme.colors.primary};
        }
        .chevron-icon {
          color: ${theme.colors.textMuted};
          flex-shrink: 0;
          opacity: 0.5;
          transition: all 0.3s ease;
        }
        .empty-state {
          background: ${theme.colors.bgSecondary};
          border-radius: 20px;
          border: 1px solid ${theme.colors.borderLight};
          padding: 80px;
          text-align: center;
          opacity: 0;
          animation: fadeIn 0.6s ease forwards;
        }
        .empty-state.mounted { animation-delay: 0.3s; }
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .filters-row { flex-wrap: wrap; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 16px; align-items: flex-start; }
        }
      `}</style>

      <div className="clients-page">
        <Header />

        <main className="clients-main">
          {/* Page Header */}
          <div className={`page-header ${mounted ? 'mounted' : ''}`}>
            <div>
              <h1 className="page-title">Clients</h1>
              <p className="page-subtitle">Manage your client relationships</p>
            </div>
            {isAdmin && (
              <Link href="/clients/new" className="new-client-btn">
                {icons.plus} New Client
              </Link>
            )}
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            {statCards.map((card, idx) => (
              <div key={card.label} className={`stat-card ${mounted ? 'mounted' : ''}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="stat-value">
                    <AnimatedNumber value={card.value} />
                  </div>
                </div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Filters and Search */}
          <div className={`filters-row ${mounted ? 'mounted' : ''}`}>
            <div className="search-wrapper">
              <div className="search-icon">{icons.search}</div>
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            {isAdminFromApi && (
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 12,
                border: `1px solid ${theme.colors.borderLight}`,
                background: theme.colors.bgSecondary,
                fontSize: 13,
                color: theme.colors.textSecondary,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
                <input
                  type="checkbox"
                  checked={hideChurned}
                  onChange={(e) => setHideChurned(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: theme.colors.primary, cursor: "pointer" }}
                />
                Hide churned
              </label>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {(isAdminFromApi ? ["ALL", "ACTIVE", "ONBOARDING", "LEAD", "CHURNED"] : ["ALL", "ACTIVE", "ONBOARDING", "LEAD"]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setFilter(s);
                    if (s === "CHURNED") setHideChurned(false);
                  }}
                  className={`filter-btn ${filter === s ? 'active' : ''} ${filter === s && s === "CHURNED" ? 'churned' : ''}`}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Clients List */}
          {filteredClients.length === 0 ? (
            <div className={`empty-state ${mounted ? 'mounted' : ''}`}>
              <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
                {icons.usersEmpty}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
                {search || filter !== "ALL" ? "No clients found" : "No clients yet"}
              </h3>
              <p style={{ color: theme.colors.textSecondary, marginBottom: 24, fontSize: 14 }}>
                {search || filter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first client"}
              </p>
              {!search && filter === "ALL" && (
                <Link href="/clients/new" className="new-client-btn" style={{ display: "inline-flex" }}>
                  {icons.plus} Add Client
                </Link>
              )}
            </div>
          ) : (
            <div className={`clients-list ${mounted ? 'mounted' : ''}`}>
              {filteredClients.map((client, idx) => {
                const activeProjects = client.projects.filter(p => p.status === "IN_PROGRESS").length;
                const colorIdx = client.name.charCodeAt(0) % avatarColors.length;
                return (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="client-row"
                    style={{ animationDelay: mounted ? `${0.4 + idx * 0.05}s` : '0s' }}
                  >
                    <div className="client-avatar" style={{ background: avatarColors[colorIdx] }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="client-info">
                      <h3 className="client-name">
                        {client.name}
                        <span className="status-badge" style={{
                          background: STATUS_STYLES[client.status]?.bg || theme.colors.bgTertiary,
                          color: STATUS_STYLES[client.status]?.color || theme.colors.textSecondary,
                        }}>
                          {client.status}
                        </span>
                      </h3>
                      <div className="client-meta">
                        {client.industry && (
                          <span className="meta-item">{icons.building} {client.industry}</span>
                        )}
                        {client.email && (
                          <span className="meta-item">{icons.mail} {client.email}</span>
                        )}
                        {client.phone && (
                          <span className="meta-item">{icons.phone} {client.phone}</span>
                        )}
                      </div>
                    </div>

                    <div className="project-count">
                      <div className="project-number">{client.projects.length}</div>
                      <div className="project-label">
                        {activeProjects > 0 ? `${activeProjects} active` : "projects"}
                      </div>
                    </div>

                    <button
                      onClick={(e) => togglePin(client.id, client.pinned, e)}
                      title={client.pinned ? "Unpin client" : "Pin client to top"}
                      className={`pin-btn ${client.pinned ? 'pinned' : ''}`}
                    >
                      {client.pinned ? icons.pinFilled : icons.pin}
                    </button>

                    <div className="chevron-icon">{icons.chevron}</div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
