"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type TeamMemberData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    notStartedTasks: number;
    completionRate: number;
    mainFocus: string | null;
    status: string;
    sodCompletedAt: string | null;
    eodCompletedAt: string | null;
  };
};

export default function TeamDailyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamMemberData[]>([]);
  const [today] = useState(new Date().toISOString().split("T")[0]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    try {
      const res = await fetch(`/api/daily/team?date=${today}`);
      const data = await res.json();
      setTeamData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load team data:", error);
      setLoading(false);
    }
  }

  function toggleUser(userId: string) {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "available":
        return { bg: theme.colors.successBg, color: theme.colors.success, icon: "🟢" };
      case "busy":
        return { bg: theme.colors.warningBg, color: theme.colors.warning, icon: "🟡" };
      case "blocked":
        return { bg: theme.colors.errorBg, color: theme.colors.error, icon: "🔴" };
      case "away":
        return { bg: theme.colors.bgTertiary, color: theme.colors.textMuted, icon: "⚫" };
      default:
        return { bg: theme.colors.bgTertiary, color: theme.colors.textMuted, icon: "⚪" };
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
            Loading team data...
          </div>
        </main>
      </div>
    );
  }

  // Calculate team stats
  const totalTasks = teamData.reduce((sum, td) => sum + td.summary.totalTasks, 0);
  const completedTasks = teamData.reduce((sum, td) => sum + td.summary.completedTasks, 0);
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>
                👥 Team Daily Overview
              </h1>
              <p style={{ fontSize: 14, color: theme.colors.textMuted }}>
                {new Date(today).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <Link
              href="/daily"
              style={{
                padding: "10px 20px",
                background: theme.colors.primary,
                color: "white",
                borderRadius: theme.borderRadius.md,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              My Day
            </Link>
          </div>

          {/* Team Stats */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 16, 
            marginBottom: 24 
          }}>
            <div style={{
              padding: 20,
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              border: "1px solid " + theme.colors.borderLight,
            }}>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Team Members</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                {teamData.length}
              </div>
            </div>

            <div style={{
              padding: 20,
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              border: "1px solid " + theme.colors.borderLight,
            }}>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Total Tasks</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                {totalTasks}
              </div>
            </div>

            <div style={{
              padding: 20,
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              border: "1px solid " + theme.colors.borderLight,
            }}>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Completed</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.success }}>
                {completedTasks}
              </div>
            </div>

            <div style={{
              padding: 20,
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              border: "1px solid " + theme.colors.borderLight,
            }}>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Completion Rate</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                {overallRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div style={{ display: "grid", gap: 16 }}>
          {teamData.map((member) => {
            const statusStyle = getStatusColor(member.summary.status);
            const isExpanded = expandedUsers.has(member.user.id);
            const hasStarted = member.summary.sodCompletedAt;

            return (
              <div
                key={member.user.id}
                style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.borderRadius.lg,
                  border: "1px solid " + theme.colors.borderLight,
                  overflow: "hidden",
                }}
              >
                {/* Summary Row */}
                <div
                  onClick={() => toggleUser(member.user.id)}
                  style={{
                    padding: 20,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div style={{ fontSize: 24 }}>{statusStyle.icon}</div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                        {member.user.name || member.user.email}
                      </h3>
                      <span style={{
                        padding: "2px 8px",
                        background: theme.colors.bgTertiary,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: 11,
                        fontWeight: 500,
                        color: theme.colors.textMuted,
                      }}>
                        {member.user.role}
                      </span>
                    </div>
                    
                    {hasStarted ? (
                      <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        Today: {member.summary.totalTasks} tasks | Completed: {member.summary.completedTasks} ({member.summary.completionRate}%)
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
                        Haven't started today yet
                      </div>
                    )}

                    {member.summary.mainFocus && (
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
                        🎯 {member.summary.mainFocus}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    {hasStarted && (
                      <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        border: `4px solid ${theme.colors.bgTertiary}`,
                        position: "relative",
                        background: `conic-gradient(${theme.colors.success} ${member.summary.completionRate * 3.6}deg, ${theme.colors.bgTertiary} 0deg)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: theme.colors.bgSecondary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          color: theme.colors.textPrimary,
                        }}>
                          {member.summary.completionRate}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 20, color: theme.colors.textMuted }}>
                    {isExpanded ? "▼" : "▶"}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasStarted && (
                  <div style={{
                    padding: 20,
                    borderTop: `1px solid ${theme.colors.borderLight}`,
                    background: theme.colors.bgPrimary,
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Completed</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: theme.colors.success }}>
                          {member.summary.completedTasks}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>In Progress</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: theme.colors.warning }}>
                          {member.summary.inProgressTasks}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Not Started</div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textSecondary }}>
                          {member.summary.notStartedTasks}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href={`/daily?userId=${member.user.id}`}
                        style={{
                          padding: "8px 16px",
                          background: theme.colors.primary,
                          color: "white",
                          borderRadius: theme.borderRadius.md,
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {teamData.length === 0 && (
          <div style={{
            padding: 64,
            textAlign: "center",
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
            <div style={{ fontSize: 16, color: theme.colors.textMuted }}>
              No team members found
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
