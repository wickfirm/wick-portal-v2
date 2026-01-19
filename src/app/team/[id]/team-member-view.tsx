"use client";

import { theme } from "@/lib/theme";
import Link from "next/link";
import Header from "@/components/Header";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  hourlyRate: number | null;
  billRate: number | null;
  agency: { id: string; name: string } | null;
  clientAssignments: {
    id: string;
    client: { id: string; name: string; nickname: string | null };
  }[];
  projectAssignments: {
    id: string;
    project: {
      id: string;
      name: string;
      serviceType: string;
      client: { id: string; name: string; nickname: string | null };
    };
  }[];
  assignedTasks: {
    id: string;
    name: string;
    status: string;
    priority: string;
    client: { id: string; name: string; nickname: string | null };
    project: { id: string; name: string; serviceType: string; clientId: string } | null;
  }[];
  timeEntries: {
    id: string;
    date: string;
    duration: number;
    client: { id: string; name: string; nickname: string | null };
    project: { id: string; name: string };
    task: { id: string; name: string };
  }[];
}

interface Props {
  member: TeamMember;
  currentUserRole: string;
  canEdit: boolean;
}

export default function TeamMemberView({ member, currentUserRole, canEdit }: Props) {
  // Calculate time stats
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekEntries = member.timeEntries.filter(e => new Date(e.date) >= startOfWeek);
  const monthEntries = member.timeEntries.filter(e => new Date(e.date) >= startOfMonth);

  const weekSeconds = weekEntries.reduce((sum, e) => sum + e.duration, 0);
  const monthSeconds = monthEntries.reduce((sum, e) => sum + e.duration, 0);

  const formatHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  // Calculate earnings
  const hourlyRate = member.hourlyRate || 0;
  const billRate = member.billRate || 0;
  
  const weekHours = weekSeconds / 3600;
  const monthHours = monthSeconds / 3600;
  
  const weekCost = weekHours * hourlyRate;
  const weekBillable = weekHours * billRate;
  const monthCost = monthHours * hourlyRate;
  const monthBillable = monthHours * billRate;

  // Group tasks by status
  const tasksByStatus = {
    active: member.assignedTasks.filter(t => ["IN_PROGRESS", "TODO", "PENDING", "ONGOING"].includes(t.status)),
    completed: member.assignedTasks.filter(t => t.status === "COMPLETED"),
    other: member.assignedTasks.filter(t => ["ON_HOLD", "BLOCKED", "IN_REVIEW", "FUTURE_PLAN"].includes(t.status)),
  };

  // Get unique projects from project assignments
  const projects = member.projectAssignments.map(pa => ({
    id: pa.project.id,
    name: pa.project.name,
    serviceType: pa.project.serviceType,
    client: pa.project.client,
    taskCount: member.assignedTasks.filter(t => t.project?.id === pa.project.id).length,
  }));

  // Only show rates to SUPER_ADMIN
  const canViewRates = currentUserRole === "SUPER_ADMIN";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    IN_PROGRESS: { bg: theme.colors.infoBg, color: theme.colors.info },
    TODO: { bg: theme.colors.warningBg, color: theme.colors.warning },
    PENDING: { bg: theme.colors.bgTertiary, color: theme.colors.textSecondary },
    ONGOING: { bg: theme.colors.primaryBg, color: theme.colors.primary },
    COMPLETED: { bg: theme.colors.successBg, color: theme.colors.success },
    ON_HOLD: { bg: theme.colors.errorBg, color: theme.colors.error },
    BLOCKED: { bg: theme.colors.errorBg, color: theme.colors.error },
    IN_REVIEW: { bg: theme.colors.infoBg, color: theme.colors.info },
    FUTURE_PLAN: { bg: theme.colors.bgTertiary, color: theme.colors.textMuted },
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/team" style={{ color: theme.colors.textMuted, textDecoration: "none", fontSize: 14 }}>
            ← Back to Team
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
              borderRadius: 36,
              background: theme.gradients.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: 28,
            }}>
              {(member.name || member.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 4 }}>
                {member.name || member.email}
              </h1>
              <p style={{ color: theme.colors.textMuted, margin: 0, marginBottom: 8 }}>{member.email}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: theme.colors.primaryBg,
                  color: theme.colors.primary,
                }}>
                  {member.role.replace("_", " ")}
                </span>
                {member.agency && (
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    background: theme.colors.infoBg,
                    color: theme.colors.info,
                  }}>
                    {member.agency.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
            {canEdit && (
              <Link
                href={`/team`}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textSecondary,
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: 13,
                  border: "1px solid " + theme.colors.borderMedium,
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  window.history.back();
                  // Trigger edit modal for this user (would need state management)
                  alert("Edit functionality: Navigate to Team page and click Edit on this user");
                }}
              >
                Edit Member
              </Link>
            )}
            
            {canViewRates && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Rates</div>
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: theme.colors.textSecondary }}>Cost:</span>{" "}
                  <strong>{hourlyRate ? formatCurrency(hourlyRate) + "/hr" : "—"}</strong>
                </div>
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: theme.colors.textSecondary }}>Bill:</span>{" "}
                  <strong style={{ color: theme.colors.success }}>{billRate ? formatCurrency(billRate) + "/hr" : "—"}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: 16, 
          marginBottom: 32,
        }}>
          {/* This Week */}
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>This Week</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{formatHours(weekSeconds)}</div>
            {canViewRates && (
              <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                Cost: {formatCurrency(weekCost)} • Bill: {formatCurrency(weekBillable)}
              </div>
            )}
          </div>

          {/* This Month */}
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>This Month</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{formatHours(monthSeconds)}</div>
            {canViewRates && (
              <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                Cost: {formatCurrency(monthCost)} • Bill: {formatCurrency(monthBillable)}
              </div>
            )}
          </div>

          {/* Active Tasks */}
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>Active Tasks</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{tasksByStatus.active.length}</div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              {tasksByStatus.completed.length} completed
            </div>
          </div>

          {/* Projects */}
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>Projects</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{projects.length}</div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              {member.clientAssignments.length} clients
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Active Tasks */}
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
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Tasks</h2>
              <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                {tasksByStatus.active.length} tasks
              </span>
            </div>
            <div style={{ maxHeight: 400, overflow: "auto" }}>
              {tasksByStatus.active.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted }}>
                  No active tasks
                </div>
              ) : (
                tasksByStatus.active.map(task => (
                  <div 
                    key={task.id} 
                    style={{ 
                      padding: "14px 20px", 
                      borderBottom: "1px solid " + theme.colors.borderLight,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                        {task.name}
                      </div>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 500,
                        background: statusColors[task.status]?.bg || theme.colors.bgTertiary,
                        color: statusColors[task.status]?.color || theme.colors.textSecondary,
                      }}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      {task.client.nickname || task.client.name}
                      {task.project && ` → ${task.project.name}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Projects */}
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
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Projects</h2>
              <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                {projects.length} projects
              </span>
            </div>
            <div style={{ maxHeight: 400, overflow: "auto" }}>
              {projects.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted }}>
                  No projects assigned
                </div>
              ) : (
                projects.map((project: any) => (
                  <Link 
                    key={project.id}
                    href={`/clients/${project.clientId}`}
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <div 
                      style={{ 
                        padding: "14px 20px", 
                        borderBottom: "1px solid " + theme.colors.borderLight,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                          {project.name}
                        </div>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 500,
                          background: theme.colors.primaryBg,
                          color: theme.colors.primary,
                        }}>
                          {project.serviceType.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        {project.client.nickname || project.client.name} • {project.taskCount} tasks
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Time Entries */}
        <div style={{
          marginTop: 24,
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
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Time Entries</h2>
            <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
              Last 50 entries
            </span>
          </div>
          {member.timeEntries.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted }}>
              No time entries yet
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: theme.colors.bgTertiary }}>
                  <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Client</th>
                  <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Project</th>
                  <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Task</th>
                  <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {member.timeEntries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid " + theme.colors.borderLight }}>
                    <td style={{ padding: "12px 20px", fontSize: 13 }}>
                      {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 13 }}>
                      {entry.client.nickname || entry.client.name}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: theme.colors.textSecondary }}>
                      {entry.project.name}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: theme.colors.textMuted }}>
                      {entry.task.name}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 13, textAlign: "right", fontWeight: 500 }}>
                      {formatHours(entry.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
