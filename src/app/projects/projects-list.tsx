"use client";

import { useState } from "react";
import Link from "next/link";
import { theme, STATUS_STYLES } from "@/lib/theme";

interface Project {
  id: string;
  name: string;
  status: string;
  serviceType: string;
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
}

export default function ProjectsList({ projects, isAdmin }: Props) {
  // Group projects by client
  const projectsByClient = projects.reduce((acc, project) => {
    const clientId = project.client.id;
    if (!acc[clientId]) {
      acc[clientId] = {
        client: project.client,
        projects: [],
      };
    }
    acc[clientId].projects.push(project);
    return acc;
  }, {} as Record<string, { client: Project['client']; projects: Project[] }>);

  const clientGroups = Object.values(projectsByClient);

  // State for expanded clients (all collapsed by default)
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  if (projects.length === 0) {
    return (
      <div style={{ 
        background: theme.colors.bgSecondary, 
        borderRadius: theme.borderRadius.lg, 
        border: "1px solid " + theme.colors.borderLight, 
        overflow: "hidden",
        padding: 64,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No projects yet</div>
        <div style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>Get started by creating your first project</div>
        {isAdmin && (
          <Link href="/projects/new" style={{
            background: theme.colors.primary,
            color: "white",
            padding: "10px 20px",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14
          }}>
            Create Project
          </Link>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {clientGroups.map(({ client, projects: clientProjects }) => {
        const isExpanded = expandedClients[client.id];
        const completedCount = clientProjects.filter(p => p.status === "COMPLETED").length;
        const inProgressCount = clientProjects.filter(p => p.status === "IN_PROGRESS").length;

        return (
          <div key={client.id} style={{ 
            background: theme.colors.bgSecondary, 
            borderRadius: theme.borderRadius.lg, 
            border: "1px solid " + theme.colors.borderLight,
            overflow: "hidden"
          }}>
            {/* Client Header */}
            <div
              onClick={() => toggleClient(client.id)}
              style={{
                padding: "16px 20px",
                background: theme.colors.bgTertiary,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: isExpanded ? "1px solid " + theme.colors.borderLight : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ 
                  fontSize: 18, 
                  transition: "transform 200ms",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  display: "inline-block"
                }}>
                  ▶
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: theme.colors.textPrimary }}>
                    {client.nickname || client.name}
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
                    {clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}
                    {inProgressCount > 0 && ` • ${inProgressCount} in progress`}
                    {completedCount > 0 && ` • ${completedCount} completed`}
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Table */}
            {isExpanded && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgPrimary }}>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Project</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Type</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Progress</th>
                    <th style={{ padding: 16, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientProjects.map((project) => {
                    const completed = project.stages.filter(s => s.isCompleted).length;
                    const total = project.stages.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <tr key={project.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                        <td style={{ padding: 16 }}>
                          <Link href={"/projects/" + project.id} style={{ textDecoration: "none" }}>
                            <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{project.name}</div>
                          </Link>
                        </td>
                        <td style={{ padding: 16, color: theme.colors.textSecondary, fontSize: 13 }}>
                          {project.serviceType.replace("_", " ")}
                        </td>
                        <td style={{ padding: 16 }}>
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                            color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary
                          }}>
                            {project.status.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ padding: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 120 }}>
                            <div style={{ flex: 1, height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                              <div style={{
                                height: "100%",
                                width: pct + "%",
                                background: theme.gradients.progress,
                                borderRadius: 3
                              }} />
                            </div>
                            <span style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500, minWidth: 32 }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: 16, textAlign: "right" }}>
                          <Link href={"/projects/" + project.id} style={{
                            color: theme.colors.primary,
                            textDecoration: "none",
                            fontWeight: 500,
                            fontSize: 13,
                            marginRight: isAdmin ? 16 : 0
                          }}>
                            View
                          </Link>
                          {isAdmin && (
                            <Link href={"/projects/" + project.id + "/edit"} style={{
                              color: theme.colors.textSecondary,
                              textDecoration: "none",
                              fontWeight: 500,
                              fontSize: 13
                            }}>
                              Edit
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
