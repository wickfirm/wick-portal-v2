"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { theme, STATUS_STYLES } from "@/lib/theme";

interface Project {
  id: string;
  name: string;
  status: string;
  serviceType: string;
  pinned?: boolean;
  client: {
    id: string;
    name: string;
    nickname: string | null;
  };
  stages: Array<{ id: string; isCompleted: boolean }>;
}

interface Props {
  projects: Project[];
  isAdmin: boolean;
  onPinToggle?: (projectId: string, pinned: boolean) => void;
}

const avatarColors = ["#76527c", "#5f4263", "#3d6b73", "#8a6030", "#34a853"];

const icons = {
  pin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  ),
  pinFilled: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  ),
};

export default function ProjectsList({ projects, isAdmin, onPinToggle }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Staggered row animation
  const rowAnim = (index: number, baseDelay: number = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 12}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + Math.min(index * 0.05, 0.4)}s`,
  });

  const projectsByClient = projects.reduce((acc, project) => {
    const clientId = project.client.id;
    if (!acc[clientId]) {
      acc[clientId] = { client: project.client, projects: [] };
    }
    acc[clientId].projects.push(project);
    return acc;
  }, {} as Record<string, { client: Project["client"]; projects: Project[] }>);

  // Sort client groups alphabetically by client name
  const clientGroups = Object.values(projectsByClient).sort((a, b) => {
    const nameA = a.client.nickname || a.client.name;
    const nameB = b.client.nickname || b.client.name;
    return nameA.localeCompare(nameB);
  });

  // Sort projects within each client group alphabetically
  clientGroups.forEach(group => {
    group.projects.sort((a, b) => a.name.localeCompare(b.name));
  });
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  if (projects.length === 0) {
    return (
      <div style={{
        background: theme.colors.bgSecondary, borderRadius: 16,
        border: `1px solid ${theme.colors.borderLight}`, padding: 64, textAlign: "center",
      }}>
        <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>No projects yet</div>
        <div style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 24 }}>Get started by creating your first project</div>
        {isAdmin && (
          <Link href="/projects/new" style={{
            background: theme.gradients.primary, color: "white", padding: "10px 22px",
            borderRadius: 10, textDecoration: "none", fontWeight: 500, fontSize: 14,
            boxShadow: theme.shadows.button,
          }}>
            Create Project
          </Link>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {clientGroups.map(({ client, projects: clientProjects }, groupIdx) => {
        const isExpanded = expandedClients[client.id];
        const completedCount = clientProjects.filter((p) => p.status === "COMPLETED").length;
        const inProgressCount = clientProjects.filter((p) => p.status === "IN_PROGRESS").length;
        const avatarColor = avatarColors[client.name.charCodeAt(0) % avatarColors.length];

        return (
          <div key={client.id} style={{
            background: theme.colors.bgSecondary, borderRadius: 14,
            border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden",
            ...rowAnim(groupIdx),
          }}>
            {/* Client Header */}
            <div
              onClick={() => toggleClient(client.id)}
              style={{
                padding: "14px 20px", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(90deg, ${theme.colors.primaryBg}50, transparent)`;
                e.currentTarget.style.paddingLeft = "24px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.paddingLeft = "20px";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  transition: "transform 200ms ease",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  display: "inline-flex", alignItems: "center", color: theme.colors.textMuted,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: avatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 600, fontSize: 14, flexShrink: 0,
                }}>
                  {(client.nickname || client.name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: theme.colors.textPrimary }}>
                    {client.nickname || client.name}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 1 }}>
                    {clientProjects.length} project{clientProjects.length !== 1 ? "s" : ""}
                    {inProgressCount > 0 && <span style={{ color: theme.colors.info }}> &middot; {inProgressCount} active</span>}
                    {completedCount > 0 && <span style={{ color: theme.colors.success }}> &middot; {completedCount} done</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Projects */}
            {isExpanded && (
              <div style={{ borderTop: `1px solid ${theme.colors.bgTertiary}` }}>
                {clientProjects.map((project, idx) => {
                  const completed = project.stages.filter((s) => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div
                      key={project.id}
                      style={{
                        padding: "14px 20px 14px 68px",
                        borderBottom: idx < clientProjects.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                        display: "flex", alignItems: "center", gap: 16,
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `linear-gradient(90deg, ${theme.colors.primaryBg}50, transparent)`;
                        e.currentTarget.style.paddingLeft = "72px";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.paddingLeft = "68px";
                      }}
                    >
                      {/* Project Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={"/projects/" + project.id} style={{ textDecoration: "none" }}>
                          <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary, marginBottom: 3 }}>
                            {project.name}
                          </div>
                        </Link>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                          {project.serviceType.replace(/_/g, " ")}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                        background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                        color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary,
                      }}>
                        {project.status.replace(/_/g, " ")}
                      </span>

                      {/* Progress */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110, flexShrink: 0 }}>
                        <div style={{ flex: 1, height: 5, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                          <div style={{
                            height: "100%", width: pct + "%", borderRadius: 3,
                            background: pct === 100 ? theme.colors.success : theme.gradients.progress,
                            transition: "width 0.3s ease",
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 500, minWidth: 28 }}>{pct}%</span>
                      </div>

                      {/* Pin Button */}
                      {onPinToggle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinToggle(project.id, !project.pinned);
                          }}
                          title={project.pinned ? "Unpin project" : "Pin project to top"}
                          style={{
                            background: project.pinned ? theme.colors.primaryBg : "transparent",
                            border: "none",
                            padding: 6,
                            borderRadius: 6,
                            cursor: "pointer",
                            color: project.pinned ? theme.colors.primary : theme.colors.textMuted,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s ease",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            if (!project.pinned) {
                              e.currentTarget.style.background = theme.colors.bgTertiary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!project.pinned) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {project.pinned ? icons.pinFilled : icons.pin}
                        </button>
                      )}

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <Link href={"/projects/" + project.id} style={{
                          color: theme.colors.primary, textDecoration: "none", fontWeight: 500, fontSize: 12,
                          padding: "4px 10px", borderRadius: 6, transition: "background 0.12s",
                        }}>View</Link>
                        {isAdmin && (
                          <Link href={"/projects/" + project.id + "/edit"} style={{
                            color: theme.colors.textMuted, textDecoration: "none", fontWeight: 500, fontSize: 12,
                            padding: "4px 10px", borderRadius: 6, transition: "background 0.12s",
                          }}>Edit</Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
