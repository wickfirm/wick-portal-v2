"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { theme } from "@/lib/theme";

interface Stats {
  totalLeads: number;
  websiteLeads: number;
  aiLeads: number;
  clientProspects: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  color: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  teamSize: string | null;
  status: string;
  source: string;
  createdAt: string;
}

interface SourceStat {
  source: string;
  count: number;
}

const statusColors: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "#dbeafe", color: "#1d4ed8" },
  CONTACTED: { bg: "#fef3c7", color: "#d97706" },
  QUALIFIED: { bg: "#ede9fe", color: "#7c3aed" },
  UNQUALIFIED: { bg: "#f3f4f6", color: "#6b7280" },
  CONVERTED: { bg: "#dcfce7", color: "#16a34a" },
  ARCHIVED: { bg: "#f3f4f6", color: "#9ca3af" },
};

const sourceLabels: Record<string, string> = {
  contact_form: "Contact Form",
  lead_qualifier: "Lead Qualifier",
  referral: "Referral",
  linkedin: "LinkedIn",
  manual: "Manual Entry",
};

export default function CRMDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pipelineStats, setPipelineStats] = useState<PipelineStage[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<SourceStat[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/crm/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
      setPipelineStats(data.pipelineStats);
      setLeadsBySource(data.leadsBySource);
      setRecentLeads(data.recentLeads);
    } catch (err) {
      setError("Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: theme.colors.textSecondary,
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: `3px solid ${theme.colors.bgTertiary}`,
          borderTop: `3px solid ${theme.colors.primary}`,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginBottom: 16,
        }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading CRM data...</div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 60,
        textAlign: "center",
        color: theme.colors.error,
      }}>{error}</div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          margin: 0,
        }}>CRM Overview</h1>
        <p style={{
          color: theme.colors.textSecondary,
          margin: "4px 0 0",
          fontSize: 14,
        }}>Track and manage your leads from all sources</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 14,
        marginBottom: 24,
      }}>
        {/* Total Leads */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
          borderRadius: 12,
          padding: 18,
          color: "white",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats?.totalLeads || 0}</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Total Leads</div>
        </div>

        {/* New Leads */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 18,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats?.newLeads || 0}</div>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>New Leads</div>
        </div>

        {/* Qualified */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 18,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#ede9fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats?.qualifiedLeads || 0}</div>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Qualified</div>
        </div>

        {/* Converted */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 18,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats?.convertedLeads || 0}</div>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Converted</div>
        </div>

        {/* Conversion Rate */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 18,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats?.conversionRate || 0}%</div>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Conversion Rate</div>
        </div>

        {/* This Week */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 18,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#fce7f3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats?.leadsThisWeek || 0}</div>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>This Week</div>
        </div>
      </div>

      {/* Pipeline & Sources */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Sales Pipeline */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <h2 style={{
              fontSize: 16,
              fontWeight: 600,
              color: theme.colors.textPrimary,
              margin: 0,
            }}>Sales Pipeline</h2>
            <Link href="/crm/pipeline" style={{
              fontSize: 13,
              color: theme.colors.primary,
              textDecoration: "none",
              fontWeight: 500,
            }}>
              View Pipeline →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pipelineStats.map((stage) => {
              const maxCount = Math.max(...pipelineStats.map(s => s.count), 1);
              const percentage = (stage.count / maxCount) * 100;
              return (
                <div key={stage.stage}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>{stage.stage}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: stage.color }}>{stage.count}</span>
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
                      background: stage.color,
                      borderRadius: 4,
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
          padding: 20,
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            margin: "0 0 20px",
          }}>Lead Sources</h2>
          {leadsBySource.length === 0 ? (
            <div style={{
              padding: 30,
              textAlign: "center",
              color: theme.colors.textMuted,
              fontSize: 14,
            }}>
              No leads yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {leadsBySource.map((item) => {
                const total = leadsBySource.reduce((acc, s) => acc + s.count, 0);
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.source} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>
                      {sourceLabels[item.source] || item.source}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textSecondary }}>
                        {item.count}
                      </span>
                      <span style={{
                        fontSize: 11,
                        color: theme.colors.textMuted,
                        background: theme.colors.bgTertiary,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Leads */}
      <div style={{
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>Recent Leads</h2>
          <Link href="/crm/leads" style={{
            fontSize: 13,
            color: theme.colors.primary,
            textDecoration: "none",
            fontWeight: 500,
          }}>
            View All →
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: "center",
            color: theme.colors.textMuted,
            fontSize: 14,
          }}>
            No leads yet. Leads from contact forms will appear here.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: theme.colors.bgTertiary }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary }}>Lead</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary }}>Company</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary }}>Source</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary }}>Status</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary }}>Added</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/crm/leads/${lead.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: 13,
                        }}>
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 14 }}>{lead.name}</div>
                          <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{lead.email}</div>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.textPrimary }}>{lead.company || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: theme.colors.textSecondary }}>{sourceLabels[lead.source] || lead.source}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 6,
                      background: statusColors[lead.status]?.bg || "#f3f4f6",
                      color: statusColors[lead.status]?.color || "#6b7280",
                    }}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: theme.colors.textSecondary }}>{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
