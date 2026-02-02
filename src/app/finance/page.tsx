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
    pricingModel: string;
    fixedFeeAmount: number | null;
    client: {
      id: string;
      name: string;
      nickname: string | null;
    };
  };
  client: {
    id: string;
    name: string;
    nickname: string | null;
    revenueModel: string;
    pricingModel: string;
    monthlyRevenue: number | null;
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
    total: number;
  };
  profit: {
    amount: number;
    margin: number;
  };
};

const financeIcons = {
  revenue: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>),
  costs: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>),
  profit: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>),
  percent: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>),
};

export default function FinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [profitability, setProfitability] = useState<Record<string, ProjectProfitability>>({});
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  // Filter state
  const [filterClient, setFilterClient] = useState<string>("ALL");
  const [filterPricingModel, setFilterPricingModel] = useState<string>("ALL");
  const [filterProfitability, setFilterProfitability] = useState<string>("ALL");

  useEffect(() => { setMounted(true); }, []);

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
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      const uniqueClients = Array.from(
        new Map(projectsData.map((p: any) => [p.client.id, p.client])).values()
      );
      setClients(uniqueClients as any[]);

      const allClientIds = new Set<string>(uniqueClients.map((c: any) => c.id));
      setCollapsedClients(allClientIds);

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
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ width: 220, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ width: 340, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.bgTertiary }} />
                  <div style={{ width: 80, height: 28, background: theme.colors.bgTertiary, borderRadius: 6 }} />
                </div>
                <div style={{ width: 100, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 14, padding: 20, border: `1px solid ${theme.colors.borderLight}`, marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 14 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ width: 160, height: 44, background: theme.colors.bgTertiary, borderRadius: 10 }} />)}
            </div>
          </div>
          {[1, 2].map(i => (
            <div key={i} style={{ background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}`, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: 180, height: 22, background: theme.colors.bgTertiary, borderRadius: 6 }} />
                <div style={{ display: "flex", gap: 24 }}>
                  {[1, 2, 3].map(j => <div key={j} style={{ width: 70, height: 20, background: theme.colors.bgTertiary, borderRadius: 4 }} />)}
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  const filteredProjects = projects.filter((project) => {
    const data = profitability[project.id];
    if (!data) return false;

    if (filterClient !== "ALL" && project.client.id !== filterClient) return false;
    if (filterPricingModel !== "ALL" && data.project.pricingModel !== filterPricingModel) return false;
    if (filterProfitability === "PROFITABLE" && data.profit.amount <= 0) return false;
    if (filterProfitability === "LOSS" && data.profit.amount >= 0) return false;

    return true;
  });

  const projectsByClient = filteredProjects.reduce((acc: Record<string, any[]>, project) => {
    const clientId = project.client.id;
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(project);
    return acc;
  }, {});

  // Calculate totals - CLIENT-AWARE LOGIC
  const clientTotals: Record<string, { revenue: number; cost: number; hours: number; counted: boolean }> = {};
  
  filteredProjects.forEach((project) => {
    const data = profitability[project.id];
    if (!data) return;
    
    const clientId = project.client.id;
    if (!clientTotals[clientId]) {
      clientTotals[clientId] = { revenue: 0, cost: 0, hours: 0, counted: false };
    }
    
    // Always sum costs and hours
    clientTotals[clientId].cost += data.costs.total;
    clientTotals[clientId].hours += data.hours.total;
    
    // Revenue logic depends on client's revenue model
    if (data.client && data.client.revenueModel === "CLIENT_LEVEL") {
      // For CLIENT_LEVEL: use monthly revenue once per client
      if (!clientTotals[clientId].counted && data.client.monthlyRevenue) {
        clientTotals[clientId].revenue = data.client.monthlyRevenue;
        clientTotals[clientId].counted = true;
      }
    } else {
      // For PROJECT_BASED: sum each project's revenue
      clientTotals[clientId].revenue += data.revenue.total;
    }
  });
  
  // Calculate final totals
  const totals = Object.values(clientTotals).reduce(
    (acc, client) => ({
      revenue: acc.revenue + client.revenue,
      cost: acc.cost + client.cost,
      hours: acc.hours + client.hours,
    }),
    { revenue: 0, cost: 0, hours: 0 }
  );
  
  const totalProfit = totals.revenue - totals.cost;
  const overallMargin = totals.revenue > 0 ? (totalProfit / totals.revenue) * 100 : 0;

  const activeFilterCount = [
    filterClient !== "ALL",
    filterPricingModel !== "ALL",
    filterProfitability !== "ALL",
  ].filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Page Header */}
        <div style={{ marginBottom: 28, ...anim(0.05) }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>
            Finance Dashboard
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
            Monitor profitability, costs, and financial performance
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28, ...anim(0.1) }}>
          {[
            { label: "Total Revenue", value: `$${totals.revenue.toLocaleString()}`, icon: financeIcons.revenue, color: theme.colors.success, bg: theme.colors.successBg },
            { label: "Total Costs", value: `$${totals.cost.toLocaleString()}`, icon: financeIcons.costs, color: theme.colors.error, bg: theme.colors.errorBg },
            { label: "Total Profit", value: `$${totalProfit.toLocaleString()}`, icon: financeIcons.profit, color: totalProfit >= 0 ? theme.colors.success : theme.colors.error, bg: totalProfit >= 0 ? theme.colors.successBg : theme.colors.errorBg },
            { label: "Profit Margin", value: `${overallMargin.toFixed(1)}%`, icon: financeIcons.percent, color: overallMargin >= 20 ? theme.colors.success : theme.colors.warning, bg: overallMargin >= 20 ? theme.colors.successBg : theme.colors.warningBg },
          ].map(card => (
            <div key={card.label} style={{
              background: theme.colors.bgSecondary, padding: "20px 22px", borderRadius: 14,
              border: `1px solid ${theme.colors.borderLight}`, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1 }}>
                  {card.value}
                </div>
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 500 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ ...anim(0.15), marginBottom: 24 }}>
          <div style={{
            background: theme.colors.bgSecondary, border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: 14, padding: "16px 20px",
          }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
              {[
                { label: "Client", value: filterClient, onChange: (v: string) => setFilterClient(v), options: [{ v: "ALL", l: "All Clients" }, ...clients.map((c: any) => ({ v: c.id, l: c.nickname || c.name }))] },
                { label: "Pricing Model", value: filterPricingModel, onChange: (v: string) => setFilterPricingModel(v), options: [{ v: "ALL", l: "All Models" }, { v: "FIXED_FEE", l: "Fixed Fee" }, { v: "TIME_AND_MATERIALS", l: "Time & Materials" }] },
                { label: "Status", value: filterProfitability, onChange: (v: string) => setFilterProfitability(v), options: [{ v: "ALL", l: "All Projects" }, { v: "PROFITABLE", l: "Profitable" }, { v: "LOSS", l: "Loss" }] },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{f.label}</label>
                  <select value={f.value} onChange={e => f.onChange(e.target.value)} style={{
                    padding: "9px 14px", border: `1px solid ${theme.colors.borderLight}`, borderRadius: 10,
                    background: theme.colors.bgPrimary, color: theme.colors.textPrimary, fontSize: 13, cursor: "pointer", minWidth: 155, outline: "none",
                    transition: "border-color 0.15s",
                  }}
                    onFocus={(e: any) => e.currentTarget.style.borderColor = theme.colors.primary}
                    onBlur={(e: any) => e.currentTarget.style.borderColor = theme.colors.borderLight}
                  >
                    {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} style={{
                  padding: "9px 18px", background: "transparent", border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 10, color: theme.colors.textSecondary, fontSize: 13, cursor: "pointer", fontWeight: 500,
                  transition: "all 0.15s ease",
                }}>Clear Filters</button>
              )}
            </div>
          </div>
        </div>

        <div style={anim(0.2)}>
        {Object.keys(projectsByClient).length === 0 ? (
          <div style={{
            background: theme.colors.bgSecondary, border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: 16, padding: 64, textAlign: "center",
          }}>
            <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>No projects found</div>
            <div style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Try adjusting your filters</div>
          </div>
        ) : (
          Object.entries(projectsByClient).map(([clientId, clientProjects]) => {
            const client = clients.find((c) => c.id === clientId);
            if (!client) return null;

            const isCollapsed = collapsedClients.has(clientId);

            const clientTotals = clientProjects.reduce(
              (acc, project) => {
                const data = profitability[project.id];
                if (!data) return acc;
                
                // Check if this client uses CLIENT_LEVEL revenue
                if (data.client && data.client.revenueModel === "CLIENT_LEVEL") {
                  // For CLIENT_LEVEL: use monthly revenue once
                  if (!acc.revenueSet && data.client.monthlyRevenue) {
                    acc.revenue = data.client.monthlyRevenue;
                    acc.revenueSet = true;
                  }
                } else {
                  // For PROJECT_BASED: sum revenues
                  acc.revenue += data.revenue.total;
                }
                
                acc.cost += data.costs.total;
                acc.profit = acc.revenue - acc.cost;
                return acc;
              },
              { revenue: 0, cost: 0, profit: 0, revenueSet: false }
            );

            return (
              <div key={clientId} style={{
                background: theme.colors.bgSecondary, border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 14, marginBottom: 14, overflow: "hidden",
              }}>
                <div
                  onClick={() => toggleClientCollapse(clientId)}
                  style={{
                    padding: "16px 22px",
                    borderBottom: isCollapsed ? "none" : `1px solid ${theme.colors.bgTertiary}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.colors.bgPrimary}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      transition: "transform 200ms ease",
                      transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
                      display: "inline-flex", alignItems: "center", color: theme.colors.textMuted,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary }}>
                          {client.nickname || client.name}
                        </span>
                        <Link href={`/finance/clients/${clientId}`} onClick={e => e.stopPropagation()} style={{
                          padding: "3px 10px", fontSize: 11, background: "rgba(118,82,124,0.08)", color: theme.colors.primary,
                          borderRadius: 8, textDecoration: "none", fontWeight: 500,
                        }}>Details</Link>
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        {clientProjects.length} project{clientProjects.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>Revenue</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.success }}>${clientTotals.revenue.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>Cost</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.error }}>${clientTotals.cost.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>Profit</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: clientTotals.profit >= 0 ? theme.colors.success : theme.colors.error }}>${clientTotals.profit.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {!isCollapsed && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Project", "Model", "Hours", "Revenue", "Costs", "Profit", "Margin", ""].map((h, i) => (
                            <th key={h || i} style={{
                              padding: "10px 18px", textAlign: i >= 2 && i <= 6 ? "right" as const : "left" as const,
                              fontSize: 11, fontWeight: 600, color: theme.colors.textMuted,
                              textTransform: "uppercase" as const, letterSpacing: "0.5px",
                              borderBottom: `1px solid ${theme.colors.bgTertiary}`,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clientProjects.map((project: any, pIdx: number) => {
                          const data = profitability[project.id];
                          if (!data) return null;
                          return (
                            <tr key={project.id}
                              style={{ borderBottom: pIdx < clientProjects.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none", transition: "background 0.12s" }}
                              onMouseEnter={(e: any) => e.currentTarget.style.background = theme.colors.bgPrimary}
                              onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "12px 18px", fontSize: 13, fontWeight: 500, color: theme.colors.textPrimary }}>{project.name}</td>
                              <td style={{ padding: "12px 18px" }}>
                                <span style={{
                                  padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                                  background: data.project.pricingModel === "FIXED_FEE" ? theme.colors.infoBg : theme.colors.warningBg,
                                  color: data.project.pricingModel === "FIXED_FEE" ? theme.colors.info : "#92400E",
                                }}>{data.project.pricingModel === "FIXED_FEE" ? "Fixed Fee" : "T&M"}</span>
                              </td>
                              <td style={{ padding: "12px 18px", fontSize: 13, color: theme.colors.textSecondary, textAlign: "right" }}>{data.hours.total.toFixed(1)}h</td>
                              <td style={{ padding: "12px 18px", fontSize: 13, color: theme.colors.success, textAlign: "right", fontWeight: 500 }}>${data.revenue.total.toLocaleString()}</td>
                              <td style={{ padding: "12px 18px", fontSize: 13, color: theme.colors.error, textAlign: "right", fontWeight: 500 }}>${data.costs.total.toLocaleString()}</td>
                              <td style={{ padding: "12px 18px", fontSize: 13, textAlign: "right", fontWeight: 600, color: data.profit.amount >= 0 ? theme.colors.success : theme.colors.error }}>${data.profit.amount.toLocaleString()}</td>
                              <td style={{ padding: "12px 18px", fontSize: 13, textAlign: "right", fontWeight: 500, color: data.profit.margin >= 20 ? theme.colors.success : data.profit.margin >= 10 ? theme.colors.warning : theme.colors.error }}>{data.profit.margin.toFixed(1)}%</td>
                              <td style={{ padding: "12px 18px", textAlign: "right" }}>
                                <Link href={`/finance/projects/${project.id}`} style={{
                                  padding: "5px 12px", fontSize: 12, color: theme.colors.primary,
                                  borderRadius: 6, textDecoration: "none", fontWeight: 500,
                                }}>View</Link>
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
        </div>
      </main>
    </div>
  );
}
