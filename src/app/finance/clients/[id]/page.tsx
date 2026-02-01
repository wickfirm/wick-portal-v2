"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type TimeEntry = {
  id: string;
  date: string;
  userName: string;
  userId: string;
  taskName: string | null;
  hours: number;
  hourlyRate: number;
  billRate: number;
  cost: number;
  revenue: number;
  billable: boolean;
  notes: string | null;
};

type ClientProfitability = {
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
    clientLevel: number;
    total: number;
  };
  profit: {
    amount: number;
    margin: number;
  };
  projectBreakdown: Array<{
    projectId: string;
    projectName: string;
    hours: number;
    laborCost: number;
    laborRevenue: number;
    expenses: number;
  }>;
  timeEntriesByProject: Record<string, TimeEntry[]>;
  allTimeEntries: TimeEntry[];
};

export default function ClientFinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profitability, setProfitability] = useState<ClientProfitability | null>(null);
  const [showAllTimeEntries, setShowAllTimeEntries] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status, clientId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/client-profitability/${clientId}`);
      const data = await res.json();
      setProfitability(data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleProjectTimeEntries(projectId: string) {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 120, height: 14, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 16 }} />
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ width: 300, height: 32, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: 200, height: 20, background: theme.colors.bgTertiary, borderRadius: 4 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: theme.colors.bgSecondary, border: `1px solid ${theme.colors.borderLight}`, borderRadius: 12, padding: 24, height: 120 }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!session || !profitability) return null;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Back Button */}
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/finance"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: theme.colors.textSecondary,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Back to Finance Dashboard
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 8 }}>
            {profitability.client.nickname || profitability.client.name}
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: profitability.client.revenueModel === "CLIENT_LEVEL" ? theme.colors.infoBg : theme.colors.warningBg,
              color: profitability.client.revenueModel === "CLIENT_LEVEL" ? theme.colors.info : "#92400E",
            }}>
              {profitability.client.revenueModel === "CLIENT_LEVEL" ? "Client-Level Revenue" : "Project-Based Revenue"}
            </span>
            {profitability.client.revenueModel === "CLIENT_LEVEL" && (
              <span style={{
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: profitability.client.pricingModel === "FIXED_FEE" ? theme.colors.successBg : theme.colors.bgTertiary,
                color: profitability.client.pricingModel === "FIXED_FEE" ? theme.colors.success : theme.colors.textSecondary,
              }}>
                {profitability.client.pricingModel === "FIXED_FEE" ? "Fixed Fee" : "Time & Materials"}
              </span>
            )}
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: 16, 
          marginBottom: 32 
        }}>
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 20,
          }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
              Total Revenue
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.success }}>
              ${profitability.revenue.total.toLocaleString()}
            </div>
            {profitability.client.revenueModel === "CLIENT_LEVEL" && profitability.client.monthlyRevenue && (
              <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
                ${profitability.client.monthlyRevenue.toLocaleString()}/month
              </div>
            )}
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 20,
          }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
              Total Costs
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.error }}>
              ${profitability.costs.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              Labor: ${profitability.costs.labor.toLocaleString()} | Expenses: ${profitability.costs.expenses.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 20,
          }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
              Net Profit
            </div>
            <div style={{ 
              fontSize: 24, 
              fontWeight: 600, 
              color: profitability.profit.amount >= 0 ? theme.colors.success : theme.colors.error 
            }}>
              ${profitability.profit.amount.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              Margin: {profitability.profit.margin.toFixed(1)}%
            </div>
          </div>

          <div 
            onClick={() => setShowAllTimeEntries(!showAllTimeEntries)}
            style={{
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.borderRadius.lg,
              padding: 20,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.borderLight;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
              Hours Logged {showAllTimeEntries ? "▼" : "▶"}
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.primary }}>
              {profitability.hours.total.toFixed(1)}h
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              Click to view details
            </div>
          </div>
        </div>

        {/* All Time Entries Expanded */}
        {showAllTimeEntries && profitability.allTimeEntries && profitability.allTimeEntries.length > 0 && (
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            overflow: "hidden",
            marginBottom: 32,
          }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                All Time Entries ({profitability.allTimeEntries.length})
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgTertiary }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Date</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Employee</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Task</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Hours</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Cost Rate</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Bill Rate</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Cost</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {profitability.allTimeEntries.map((entry) => (
                    <tr key={entry.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: theme.colors.textSecondary }}>
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: theme.colors.textPrimary, fontWeight: 500 }}>
                        {entry.userName}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: theme.colors.textSecondary }}>
                        {entry.taskName || "-"}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: theme.colors.textPrimary, textAlign: "right" }}>
                        {entry.hours.toFixed(1)}h
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: theme.colors.textSecondary, textAlign: "right" }}>
                        ${entry.hourlyRate}/hr
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: theme.colors.success, textAlign: "right" }}>
                        ${entry.billRate}/hr
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: theme.colors.error, textAlign: "right", fontWeight: 500 }}>
                        ${entry.cost.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        {entry.billable ? (
                          <span style={{ 
                            padding: "2px 8px", 
                            background: theme.colors.successBg, 
                            color: theme.colors.success,
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                          }}>
                            YES
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: theme.colors.textMuted }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Project Breakdown */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: theme.borderRadius.lg,
          overflow: "hidden",
        }}>
          <div style={{ padding: 24, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
              Project Breakdown ({profitability.projectBreakdown.length})
            </h2>
          </div>

          {profitability.projectBreakdown.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>
              No projects found for this client
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgTertiary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Project
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Hours
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Labor Cost
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Expenses
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Total Cost
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profitability.projectBreakdown.map((project) => {
                    const totalCost = project.laborCost + project.expenses;
                    const isExpanded = expandedProjects.has(project.projectId);
                    const projectTimeEntries = profitability.timeEntriesByProject[project.projectId] || [];
                    
                    return (
                      <>
                        <tr key={project.projectId} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                          <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                            {project.projectName}
                          </td>
                          <td 
                            onClick={() => toggleProjectTimeEntries(project.projectId)}
                            style={{ 
                              padding: "12px 16px", 
                              fontSize: 14, 
                              color: theme.colors.primary, 
                              textAlign: "right",
                              cursor: "pointer",
                              fontWeight: 500,
                            }}
                          >
                            {project.hours.toFixed(1)}h {isExpanded ? "▼" : "▶"}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.error, textAlign: "right", fontWeight: 500 }}>
                            ${project.laborCost.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.error, textAlign: "right", fontWeight: 500 }}>
                            ${project.expenses.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.error, textAlign: "right", fontWeight: 600 }}>
                            ${totalCost.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <Link
                              href={`/finance/projects/${project.projectId}`}
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
                        
                        {/* Expanded Time Entries for this Project */}
                        {isExpanded && projectTimeEntries.length > 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: 0, background: theme.colors.bgTertiary }}>
                              <div style={{ padding: 16 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                                      <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Date</th>
                                      <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Employee</th>
                                      <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Task</th>
                                      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Hours</th>
                                      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Cost Rate</th>
                                      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Cost</th>
                                      <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Billable</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {projectTimeEntries.map((entry) => (
                                      <tr key={entry.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                                        <td style={{ padding: "8px 12px", fontSize: 12, color: theme.colors.textSecondary }}>
                                          {new Date(entry.date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: "8px 12px", fontSize: 12, color: theme.colors.textPrimary, fontWeight: 500 }}>
                                          {entry.userName}
                                        </td>
                                        <td style={{ padding: "8px 12px", fontSize: 12, color: theme.colors.textSecondary }}>
                                          {entry.taskName || "-"}
                                        </td>
                                        <td style={{ padding: "8px 12px", fontSize: 12, color: theme.colors.textPrimary, textAlign: "right" }}>
                                          {entry.hours.toFixed(1)}h
                                        </td>
                                        <td style={{ padding: "8px 12px", fontSize: 12, color: theme.colors.textSecondary, textAlign: "right" }}>
                                          ${entry.hourlyRate}/hr
                                        </td>
                                        <td style={{ padding: "8px 12px", fontSize: 12, color: theme.colors.error, textAlign: "right", fontWeight: 500 }}>
                                          ${entry.cost.toLocaleString()}
                                        </td>
                                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                          {entry.billable ? (
                                            <span style={{ 
                                              padding: "2px 6px", 
                                              background: theme.colors.successBg, 
                                              color: theme.colors.success,
                                              borderRadius: 4,
                                              fontSize: 10,
                                              fontWeight: 600,
                                            }}>
                                              YES
                                            </span>
                                          ) : (
                                            <span style={{ fontSize: 11, color: theme.colors.textMuted }}>-</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
