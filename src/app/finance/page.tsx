"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type ProjectProfitability = {
  project: {
    id: string;
    name: string;
    budget: number;
    pricingModel: string;
    fixedFeeAmount: number | null;
    client: {
      id: string;
      name: string;
      nickname: string | null;
    };
  };
  hours: {
    total: number;
  };
  costs: {
    labor: number;
    expenses: number;
    total: number;
  };
  revenue: {
    labor: number;
    expenses: number;
    fixedFee: number;
    total: number;
  };
  profit: {
    amount: number;
    margin: number;
  };
  budget: {
    allocated: number;
    used: number;
    utilization: number;
    remaining: number;
  };
};

export default function FinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [profitability, setProfitability] = useState<Record<string, ProjectProfitability>>({});
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());

  // Filter state
  const [filterClient, setFilterClient] = useState<string>("ALL");
  const [filterPricingModel, setFilterPricingModel] = useState<string>("ALL");
  const [filterProfitability, setFilterProfitability] = useState<string>("ALL"); // ALL, PROFITABLE, LOSS

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status]);

  async function loadData() {
    setLoading(true);
    try {
      // Load all projects
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      // Extract unique clients
      const uniqueClients = Array.from(
        new Map(projectsData.map((p: any) => [p.client.id, p.client])).values()
      );
      setClients(uniqueClients as any[]);

      // Collapse all clients by default
      const allClientIds = new Set<string>(uniqueClients.map((c: any) => c.id));
      setCollapsedClients(allClientIds);

      // Load profitability for each project
      const profitabilityPromises = projectsData.map(async (project: any) => {
        const res = await fetch(`/api/finance/project-profitability/${project.id}`);
        const data = await res.json();
        return { projectId: project.id, data };
      });

      const profitabilityResults = await Promise.all(profitabilityPromises);
      const profitabilityMap: Record<string, ProjectProfitability> = {};
      profitabilityResults.forEach((result) => {
        profitabilityMap[result.projectId] = result.data;
      });

      setProfitability(profitabilityMap);
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleClientCollapse(clientId: string) {
    setCollapsedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  }

  function clearFilters() {
    setFilterClient("ALL");
    setFilterPricingModel("ALL");
    setFilterProfitability("ALL");
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          {/* Loading Skeleton */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ width: 300, height: 32, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: 400, height: 20, background: theme.colors.bgTertiary, borderRadius: 4 }} />
          </div>

          {/* Filters Skeleton */}
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 20,
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ width: 150, height: 36, background: theme.colors.bgTertiary, borderRadius: 6 }} />
              ))}
            </div>
          </div>

          {/* Overview Cards Skeleton */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: 24, 
            marginBottom: 32 
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.lg,
                padding: 24,
                height: 120,
              }}>
                <div style={{ width: 100, height: 16, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 12 }} />
                <div style={{ width: 140, height: 32, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            overflow: "hidden",
          }}>
            <div style={{ padding: 24, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
              <div style={{ width: 200, height: 24, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
            <div style={{ padding: 24 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ width: "100%", height: 48, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  // Apply filters
  const filteredProjects = projects.filter((project) => {
    const data = profitability[project.id];
    if (!data) return false;

    // Client filter
    if (filterClient !== "ALL" && project.client.id !== filterClient) return false;

    // Pricing model filter
    if (filterPricingModel !== "ALL" && data.project.pricingModel !== filterPricingModel) return false;

    // Profitability filter
    if (filterProfitability === "PROFITABLE" && data.profit.amount <= 0) return false;
    if (filterProfitability === "LOSS" && data.profit.amount >= 0) return false;

    return true;
  });

  // Group projects by client
  const projectsByClient = filteredProjects.reduce((acc: Record<string, any[]>, project) => {
    const clientId = project.client.id;
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(project);
    return acc;
  }, {});

  // Calculate totals
  const totals = Object.values(profitability)
    .filter((p) => filteredProjects.some((proj) => proj.id === p.project.id))
    .reduce(
      (acc, p) => ({
        revenue: acc.revenue + p.revenue.total,
        cost: acc.cost + p.costs.total,
        profit: acc.profit + p.profit.amount,
        hours: acc.hours + p.hours.total,
      }),
      { revenue: 0, cost: 0, profit: 0, hours: 0 }
    );

  const overallMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  const activeFilterCount = [
    filterClient !== "ALL",
    filterPricingModel !== "ALL",
    filterProfitability !== "ALL",
  ].filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Finance Dashboard
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Monitor profitability, costs, and budget utilization
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: theme.borderRadius.lg,
          padding: 20,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Client:</label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${theme.colors.borderLight}`,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Clients</option>
                {clients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.nickname || client.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Pricing:</label>
              <select
                value={filterPricingModel}
                onChange={(e) => setFilterPricingModel(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${theme.colors.borderLight}`,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Models</option>
                <option value="FIXED_FEE">Fixed Fee</option>
                <option value="TIME_AND_MATERIALS">Time & Materials</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Status:</label>
              <select
                value={filterProfitability}
                onChange={(e) => setFilterProfitability(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${theme.colors.borderLight}`,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Projects</option>
                <option value="PROFITABLE">Profitable</option>
                <option value="LOSS">Loss</option>
              </select>
            </div>

            {activeFilterCount > 0 && (
              <>
                <div style={{ marginLeft: "auto", fontSize: 13, color: theme.colors.textMuted }}>
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </div>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 6,
                    border: `1px solid ${theme.colors.borderMedium}`,
                    background: theme.colors.bgPrimary,
                    color: theme.colors.primary,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: 24, 
          marginBottom: 32 
        }}>
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
              Total Revenue
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: theme.colors.success }}>
              ${totals.revenue.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
              Total Costs
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: theme.colors.error }}>
              ${totals.cost.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
              Net Profit
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: totals.profit >= 0 ? theme.colors.success : theme.colors.error }}>
              ${totals.profit.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
              Profit Margin
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: overallMargin >= 20 ? theme.colors.success : theme.colors.warning }}>
              {overallMargin.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Projects Grouped by Client */}
        {Object.entries(projectsByClient).length === 0 ? (
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 64,
            textAlign: "center",
            color: theme.colors.textMuted,
          }}>
            No projects match the current filters
          </div>
        ) : (
          Object.entries(projectsByClient).map(([clientId, clientProjects]) => {
            const client = clients.find((c) => c.id === clientId);
            if (!client) return null;

            const isCollapsed = collapsedClients.has(clientId);

            // Calculate client totals
            const clientTotals = clientProjects.reduce(
              (acc, project) => {
                const data = profitability[project.id];
                if (!data) return acc;
                return {
                  revenue: acc.revenue + data.revenue.total,
                  cost: acc.cost + data.costs.total,
                  profit: acc.profit + data.profit.amount,
                };
              },
              { revenue: 0, cost: 0, profit: 0 }
            );

            return (
              <div
                key={clientId}
                style={{
                  background: theme.colors.bgSecondary,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: theme.borderRadius.lg,
                  overflow: "hidden",
                  marginBottom: 24,
                }}
              >
                {/* Client Header */}
                <div
                  style={{
                    padding: 24,
                    borderBottom: isCollapsed ? "none" : `1px solid ${theme.colors.borderLight}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span 
                      onClick={() => toggleClientCollapse(clientId)}
                      style={{ 
                        fontSize: 20, 
                        color: theme.colors.textSecondary,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      {isCollapsed ? "▶" : "▼"}
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                          {client.nickname || client.name}
                        </h2>
                        <Link
                          href={`/finance/clients/${clientId}`}
                          style={{
                            padding: "4px 10px",
                            fontSize: 11,
                            background: theme.colors.primary,
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            textDecoration: "none",
                            display: "inline-block",
                            fontWeight: 500,
                          }}
                        >
                          Client Details
                        </Link>
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
                        {clientProjects.length} project{clientProjects.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>Revenue</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.success }}>
                        ${clientTotals.revenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>Cost</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.error }}>
                        ${clientTotals.cost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>Profit</div>
                      <div style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        color: clientTotals.profit >= 0 ? theme.colors.success : theme.colors.error 
                      }}>
                        ${clientTotals.profit.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projects Table */}
                {!isCollapsed && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: theme.colors.bgTertiary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Project
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Pricing Model
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Hours
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Revenue
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Costs
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Profit
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Margin
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Budget Used
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientProjects.map((project) => {
                          const data = profitability[project.id];
                          if (!data) return null;

                          return (
                            <tr key={project.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                              <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                                {project.name}
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 13 }}>
                                <span style={{
                                  padding: "4px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: data.project.pricingModel === "FIXED_FEE" ? theme.colors.infoBg : theme.colors.warningBg,
                                  color: data.project.pricingModel === "FIXED_FEE" ? theme.colors.info : "#92400E",
                                }}>
                                  {data.project.pricingModel === "FIXED_FEE" ? "Fixed Fee" : "T&M"}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.textSecondary, textAlign: "right" }}>
                                {data.hours.total.toFixed(1)}h
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.success, textAlign: "right", fontWeight: 500 }}>
                                ${data.revenue.total.toLocaleString()}
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.error, textAlign: "right", fontWeight: 500 }}>
                                ${data.costs.total.toLocaleString()}
                              </td>
                              <td style={{ 
                                padding: "12px 16px", 
                                fontSize: 14, 
                                textAlign: "right", 
                                fontWeight: 600,
                                color: data.profit.amount >= 0 ? theme.colors.success : theme.colors.error 
                              }}>
                                ${data.profit.amount.toLocaleString()}
                              </td>
                              <td style={{ 
                                padding: "12px 16px", 
                                fontSize: 14, 
                                textAlign: "right",
                                color: data.profit.margin >= 20 ? theme.colors.success : data.profit.margin >= 10 ? theme.colors.warning : theme.colors.error
                              }}>
                                {data.profit.margin.toFixed(1)}%
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.textSecondary, textAlign: "right" }}>
                                {data.budget.utilization.toFixed(0)}%
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <Link
                                  href={`/finance/projects/${project.id}`}
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: 12,
                                    background: theme.colors.primary,
                                    color: "white",
                                    border: "none",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    textDecoration: "none",
                                    display: "inline-block",
                                  }}
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
