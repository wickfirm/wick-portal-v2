"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  };
};

// Loading skeleton component
function ClientsPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header Skeleton */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ width: 140, height: 36, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ width: 260, height: 20, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
          <div style={{ width: 140, height: 44, background: theme.colors.bgSecondary, borderRadius: 8 }} />
        </div>

        {/* Stats Skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 60, height: 36, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 100, height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          ))}
        </div>

        {/* Clients List Skeleton */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ padding: "20px 24px", borderBottom: i < 5 ? "1px solid " + theme.colors.bgTertiary : "none", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, background: theme.colors.bgTertiary, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 180, height: 20, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: 240, height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
              <div style={{ width: 80, height: 24, background: theme.colors.bgTertiary, borderRadius: 12 }} />
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
      
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ 
          background: theme.colors.errorBg, 
          border: "1px solid " + theme.colors.error, 
          borderRadius: theme.borderRadius.lg, 
          padding: 48, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.error, marginBottom: 8 }}>
            Failed to load clients
          </h2>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={retry}
            style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "12px 24px",
              borderRadius: theme.borderRadius.md,
              border: "none",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch clients data with React Query
  const { data, isLoading, error, refetch } = useQuery<ClientsData>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients/list");
      if (!res.ok) {
        throw new Error("Failed to fetch clients");
      }
      return res.json();
    },
    enabled: status === "authenticated",
  });

  // Show loading state while checking authentication
  if (status === "loading") {
    return <ClientsPageSkeleton />;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) return null;

  // Show loading skeleton while fetching data
  if (isLoading) {
    return <ClientsPageSkeleton />;
  }

  // Show error state
  if (error) {
    return <ClientsError error={error as Error} retry={() => refetch()} />;
  }

  // Show error if no data
  if (!data) {
    return <ClientsError error={new Error("No data received")} retry={() => refetch()} />;
  }

  const { clients, stats } = data;

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesFilter = filter === "ALL" || client.status === filter;
    const matchesSearch = !search || 
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Clients</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage your client relationships</p>
          </div>
          <Link href="/clients/new" style={{
            background: theme.gradients.primary,
            color: "white",
            padding: "12px 24px",
            borderRadius: theme.borderRadius.md,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: theme.shadows.button
          }}>
            <span style={{ fontSize: 18 }}>+</span> New Client
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Clients</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.success }}>{stats.active}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Active</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.info }}>{stats.onboarding}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Onboarding</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.warning }}>{stats.leads}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Leads</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: theme.borderRadius.md,
              border: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
              fontSize: 14,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            {["ALL", "ACTIVE", "ONBOARDING", "LEAD"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: "12px 20px",
                  borderRadius: theme.borderRadius.md,
                  border: "1px solid " + theme.colors.borderLight,
                  background: filter === status ? theme.gradients.primary : theme.colors.bgSecondary,
                  color: filter === status ? "white" : theme.colors.textPrimary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Clients List */}
        {filteredClients.length === 0 ? (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            borderRadius: theme.borderRadius.lg, 
            border: "1px solid " + theme.colors.borderLight, 
            padding: 64, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
              {search || filter !== "ALL" ? "No clients found" : "No clients yet"}
            </h3>
            <p style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>
              {search || filter !== "ALL" 
                ? "Try adjusting your search or filters"
                : "Get started by adding your first client"}
            </p>
            {!search && filter === "ALL" && (
              <Link href="/clients/new" style={{
                display: "inline-block",
                background: theme.gradients.primary,
                color: "white",
                padding: "12px 24px",
                borderRadius: theme.borderRadius.md,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 14,
              }}>
                Add Client
              </Link>
            )}
          </div>
        ) : (
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            {filteredClients.map((client, idx) => {
              const activeProjects = client.projects.filter(p => p.status === "IN_PROGRESS").length;
              return (
                <Link key={client.id} href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ 
                    padding: "20px 24px", 
                    borderBottom: idx < filteredClients.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    transition: "background 0.15s",
                  }}>
                    <div style={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: 12, 
                      background: theme.gradients.accent, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      color: "white", 
                      fontWeight: 600, 
                      fontSize: 20,
                      flexShrink: 0,
                    }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                          {client.name}
                        </h3>
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 500, 
                          padding: "4px 10px", 
                          borderRadius: 20, 
                          background: STATUS_STYLES[client.status]?.bg || theme.colors.bgTertiary, 
                          color: STATUS_STYLES[client.status]?.color || theme.colors.textSecondary 
                        }}>
                          {client.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: theme.colors.textMuted }}>
                        {client.industry && <span>🏢 {client.industry}</span>}
                        {client.email && <span>📧 {client.email}</span>}
                        {client.phone && <span>📞 {client.phone}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary }}>{client.projects.length}</div>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                        {activeProjects > 0 ? `${activeProjects} active` : "projects"}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
