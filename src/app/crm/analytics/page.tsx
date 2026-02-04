"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  thisWeek: number;
  thisMonth: number;
  conversionRate: number;
}

const statusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Converted",
  ARCHIVED: "Archived",
};

const statusColors: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#f59e0b",
  QUALIFIED: "#8b5cf6",
  UNQUALIFIED: "#6b7280",
  CONVERTED: "#22c55e",
  ARCHIVED: "#9ca3af",
};

const sourceLabels: Record<string, string> = {
  contact_form: "Contact Form",
  lead_qualifier: "Lead Qualifier",
  referral: "Referral",
  linkedin: "LinkedIn",
  manual: "Manual Entry",
  website: "Website",
  cold_outreach: "Cold Outreach",
};

const sourceColors: Record<string, string> = {
  contact_form: "#3b82f6",
  lead_qualifier: "#8b5cf6",
  referral: "#22c55e",
  linkedin: "#0077b5",
  manual: "#6b7280",
  website: "#f59e0b",
  cold_outreach: "#ec4899",
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/crm/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: theme.colors.textSecondary }}>
        Loading analytics...
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: theme.colors.textSecondary }}>
        Failed to load analytics
      </div>
    );
  }

  const maxStatusCount = Math.max(...Object.values(stats.byStatus), 1);
  const maxSourceCount = Math.max(...Object.values(stats.bySource), 1);

  // Calculate funnel metrics
  const funnelStages = [
    { label: "New Leads", count: stats.byStatus.NEW || 0, color: "#3b82f6" },
    { label: "Contacted", count: stats.byStatus.CONTACTED || 0, color: "#f59e0b" },
    { label: "Qualified", count: stats.byStatus.QUALIFIED || 0, color: "#8b5cf6" },
    { label: "Converted", count: stats.byStatus.CONVERTED || 0, color: "#22c55e" },
  ];
  const funnelMax = Math.max(...funnelStages.map(s => s.count), 1);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          margin: 0,
        }}>CRM Analytics</h1>
        <p style={{
          color: theme.colors.textSecondary,
          margin: "4px 0 0",
          fontSize: 14,
        }}>Track your lead performance and conversion metrics</p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: theme.colors.primaryBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.total}</div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Leads</div>
            </div>
          </div>
        </div>

        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.thisWeek}</div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>This Week</div>
            </div>
          </div>
        </div>

        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.thisMonth}</div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>This Month</div>
            </div>
          </div>
        </div>

        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.conversionRate}%</div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Conversion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Conversion Funnel */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 24,
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            margin: "0 0 20px",
          }}>Conversion Funnel</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {funnelStages.map((stage, index) => {
              const width = (stage.count / funnelMax) * 100;
              const prevStage = index > 0 ? funnelStages[index - 1] : null;
              const dropOff = prevStage && prevStage.count > 0
                ? Math.round(((prevStage.count - stage.count) / prevStage.count) * 100)
                : null;

              return (
                <div key={stage.label}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                      {stage.label}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: stage.color }}>
                        {stage.count}
                      </span>
                      {dropOff !== null && dropOff > 0 && (
                        <span style={{
                          fontSize: 11,
                          color: "#ef4444",
                          background: "#fef2f2",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}>
                          -{dropOff}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    height: 24,
                    background: theme.colors.bgTertiary,
                    borderRadius: 6,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${Math.max(width, 2)}%`,
                      height: "100%",
                      background: stage.color,
                      borderRadius: 6,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 24,
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            margin: "0 0 20px",
          }}>Lead Sources</h2>
          {Object.keys(stats.bySource).length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: "center",
              color: theme.colors.textMuted,
              fontSize: 14,
            }}>
              No lead sources yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(stats.bySource)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => {
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const color = sourceColors[source] || "#6b7280";
                  return (
                    <div key={source}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color,
                          }} />
                          <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>
                            {sourceLabels[source] || source}
                          </span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textSecondary }}>
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div style={{
                        height: 8,
                        background: theme.colors.bgTertiary,
                        borderRadius: 4,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: "100%",
                          background: color,
                          borderRadius: 4,
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution */}
      <div style={{
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: 12,
        padding: 24,
      }}>
        <h2 style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          margin: "0 0 20px",
        }}>Status Distribution</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 16,
        }}>
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = stats.byStatus[status] || 0;
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const color = statusColors[status];
            return (
              <div key={status} style={{
                padding: 16,
                background: theme.colors.bgTertiary,
                borderRadius: 10,
                textAlign: "center",
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: `${color}20`,
                  margin: "0 auto 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color }}>{count}</span>
                </div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.colors.textPrimary,
                  marginBottom: 4,
                }}>{label}</div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
