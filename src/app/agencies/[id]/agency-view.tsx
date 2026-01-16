"use client";

import { theme, ROLE_STYLES } from "@/lib/theme";
import Link from "next/link";
import Header from "@/components/Header";

interface AgencyMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  hourlyRate: number | null;
  billRate: number | null;
  activeTasks: number;
  monthSeconds: number;
  clients: { id: string; name: string; nickname: string | null }[];
}

interface AgencyClient {
  id: string;
  name: string;
  nickname: string | null;
  memberCount: number;
}

interface Agency {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalActiveTasks: number;
    totalMonthSeconds: number;
    totalClients: number;
  };
  users: AgencyMember[];
  clients: AgencyClient[];
}

interface Props {
  agency: Agency;
}

export default function AgencyView({ agency }: Props) {
  const formatHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/agencies" style={{ color: theme.colors.textMuted, textDecoration: "none", fontSize: 14 }}>
            ← Back to Agencies
          </Link>
        </div>

        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start", 
          marginBottom: 32,
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.borderLight,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: theme.gradients.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: 28,
            }}>
              {agency.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 4 }}>
                {agency.name}
              </h1>
              {agency.description && (
                <p style={{ color: theme.colors.textMuted, margin: 0, marginBottom: 8 }}>
                  {agency.description}
                </p>
              )}
              <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                Created {new Date(agency.createdAt).toLocaleDateString("en-US", { 
                  month: "long", 
                  day: "numeric", 
                  year: "numeric" 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(5, 1fr)", 
          gap: 16, 
          marginBottom: 32,
        }}>
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>Total Members</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{agency.stats.totalMembers}</div>
            <div style={{ fontSize: 12, color: theme.colors.success }}>
              {agency.stats.activeMembers} active
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>Clients</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{agency.stats.totalClients}</div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>assigned</div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>Active Tasks</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{agency.stats.totalActiveTasks}</div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>in progress</div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>Hours This Month</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{formatHours(agency.stats.totalMonthSeconds)}</div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>logged</div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>Avg Hours/Member</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>
              {agency.stats.totalMembers > 0 
                ? formatHours(Math.round(agency.stats.totalMonthSeconds / agency.stats.totalMembers))
                : "0h"
              }
            </div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>this month</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Team Members */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgTertiary,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Team Members</h2>
              <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                {agency.users.length} members
              </span>
            </div>
            
            {agency.users.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted }}>
                No team members in this agency
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgTertiary }}>
                    <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Member</th>
                    <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Role</th>
                    <th style={{ padding: "10px 20px", textAlign: "center", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Tasks</th>
                    <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>This Month</th>
                  </tr>
                </thead>
                <tbody>
                  {agency.users.map(user => (
                    <tr 
                      key={user.id} 
                      onClick={() => window.location.href = `/team/${user.id}`}
                      style={{ 
                        borderBottom: "1px solid " + theme.colors.borderLight,
                        cursor: "pointer",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.bgTertiary}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            background: user.isActive ? theme.gradients.accent : theme.colors.bgTertiary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: user.isActive ? "white" : theme.colors.textMuted,
                            fontWeight: 600,
                            fontSize: 12,
                          }}>
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ 
                              fontWeight: 500, 
                              fontSize: 14,
                              color: user.isActive ? theme.colors.textPrimary : theme.colors.textMuted,
                            }}>
                              {user.name || user.email}
                            </div>
                            {!user.isActive && (
                              <span style={{ fontSize: 11, color: theme.colors.error }}>Inactive</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 500,
                          background: ROLE_STYLES[user.role]?.bg || theme.colors.bgTertiary,
                          color: ROLE_STYLES[user.role]?.color || theme.colors.textSecondary,
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          background: user.activeTasks > 0 ? theme.colors.infoBg : theme.colors.bgTertiary,
                          color: user.activeTasks > 0 ? theme.colors.info : theme.colors.textMuted,
                        }}>
                          {user.activeTasks}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 500, fontSize: 13 }}>
                        {formatHours(user.monthSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Clients */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgTertiary,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Clients</h2>
              <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                {agency.clients.length} clients
              </span>
            </div>
            <div style={{ maxHeight: 400, overflow: "auto" }}>
              {agency.clients.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted }}>
                  No clients assigned to agency members
                </div>
              ) : (
                agency.clients.map((client: AgencyClient) => (
                  <Link 
                    key={client.id}
                    href={`/clients/${client.id}`}
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <div 
                      style={{ 
                        padding: "14px 20px", 
                        borderBottom: "1px solid " + theme.colors.borderLight,
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.bgTertiary}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                            {client.nickname || client.name}
                          </div>
                          {client.nickname && (
                            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                              {client.name}
                            </div>
                          )}
                        </div>
                        <span style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 500,
                          background: theme.colors.successBg,
                          color: theme.colors.success,
                        }}>
                          {client.memberCount} {client.memberCount === 1 ? "member" : "members"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
