"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import OnboardingManager from "./onboarding-manager";
import ClientResources from "./client-resources";
import TeamManager from "./team-manager";
import AgenciesManager from "./agencies-manager";
import DeleteClientButton from "./delete-client-button";
import ClientCalendar from "./client-calendar";
import { theme, STATUS_STYLES } from "@/lib/theme";

type ClientDetailTabsProps = {
  client: {
    id: string;
    name: string;
    nickname: string | null;
    status: string;
    industry: string | null;
    website: string | null;
    primaryContact: string | null;
    primaryEmail: string | null;
    monthlyRetainer: number | null;
    createdAt: string;
    agencies: Array<{ id: string; name: string }>;
  };
  onboarding: Array<any>;
  resources: Array<any>;
  team: Array<any>;
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    serviceType: string;
    startDate: string | null;
    endDate: string | null;
    budget: number | null;
    completionPercentage: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  userRole: string;
  canManageTeam: boolean;
  canAddProjects: boolean;
  canSeeBudget: boolean;
};

export default function ClientDetailTabs({
  client,
  onboarding,
  resources,
  team,
  projects,
  userRole,
  canManageTeam,
  canAddProjects,
  canSeeBudget,
}: ClientDetailTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "projects", label: "Projects", icon: "📁", count: projects.length },
    { id: "onboarding", label: "Onboarding", icon: "✓", 
      count: onboarding.filter(i => !i.isCompleted).length,
      highlight: client.status === "ONBOARDING" || client.status === "LEAD"
    },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "team", label: "Team", icon: "👥", count: team.length },
    { id: "resources", label: "Resources", icon: "📎", count: resources.length },
  ];

  const setActiveTab = (tabId: string) => {
    const newUrl = `/clients/${client.id}?tab=${tabId}`;
    router.push(newUrl);
  };

  // Calculate stats
  const totalTasks = projects.reduce((sum, p) => sum + p.totalTasks, 0);
  const completedTasks = projects.reduce((sum, p) => sum + p.completedTasks, 0);
  const activeProjects = projects.filter(p => p.status === "IN_PROGRESS" || p.status === "ACTIVE").length;
  const completedOnboarding = onboarding.filter(i => i.isCompleted).length;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Link href="/clients" style={{ color: theme.colors.textMuted, textDecoration: "none", fontSize: 14 }}>
              ← Clients
            </Link>
            <span style={{ color: theme.colors.textMuted }}>/</span>
            <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{client.name}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                fontWeight: 700,
                fontSize: 28,
              }}>
                {(client.nickname || client.name).charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: 0, marginBottom: 8 }}>
                  {client.name}
                  {client.nickname && (
                    <span style={{ fontWeight: 400, color: theme.colors.textMuted, marginLeft: 8 }}>
                      ({client.nickname})
                    </span>
                  )}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    background: STATUS_STYLES[client.status]?.bg || theme.colors.bgTertiary,
                    color: STATUS_STYLES[client.status]?.color || theme.colors.textMuted,
                  }}>
                    {client.status}
                  </span>
                  {client.agencies.map(agency => (
                    <span key={agency.id} style={{
                      padding: "4px 10px",
                      background: theme.colors.infoBg,
                      color: theme.colors.info,
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 500,
                    }}>
                      {agency.name}
                    </span>
                  ))}
                  {client.industry && (
                    <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                      {client.industry}
                    </span>
                  )}
                  {client.website && (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none" }}
                    >
                      🔗 {client.website.replace("https://", "").replace("http://", "")}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={`/clients/${client.id}/tasks`}
                style={{
                  padding: "10px 16px",
                  borderRadius: theme.borderRadius.md,
                  background: theme.colors.infoBg,
                  color: theme.colors.info,
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                Tasks
              </Link>
              <Link
                href={`/clients/${client.id}/metrics`}
                style={{
                  padding: "10px 16px",
                  borderRadius: theme.borderRadius.md,
                  background: theme.colors.successBg,
                  color: theme.colors.success,
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                Metrics
              </Link>
              <Link
                href={`/clients/${client.id}/edit`}
                style={{
                  padding: "10px 16px",
                  borderRadius: theme.borderRadius.md,
                  background: theme.colors.primary,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                Edit Client
              </Link>
              {userRole === "SUPER_ADMIN" && (
                <DeleteClientButton clientId={client.id} clientName={client.name} />
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          borderBottom: "1px solid " + theme.colors.borderLight,
          marginBottom: 24,
          display: "flex",
          gap: 8,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 20px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid " + theme.colors.primary : "2px solid transparent",
                color: activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  background: tab.highlight 
                    ? theme.colors.warningBg 
                    : activeTab === tab.id 
                      ? theme.colors.primary 
                      : theme.colors.bgTertiary,
                  color: tab.highlight
                    ? theme.colors.warning
                    : activeTab === tab.id 
                      ? "white" 
                      : theme.colors.textMuted,
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: 24 }}>
            {/* Quick Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <div style={{
                background: theme.colors.bgSecondary,
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.lg,
                padding: 20,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {projects.length}
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Projects</div>
              </div>

              <div style={{
                background: theme.colors.bgSecondary,
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.lg,
                padding: 20,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.info }}>
                  {activeProjects}
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Active</div>
              </div>

              <div style={{
                background: theme.colors.bgSecondary,
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.lg,
                padding: 20,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.success }}>
                  {completedTasks}/{totalTasks}
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Tasks Done</div>
              </div>

              <div style={{
                background: theme.colors.bgSecondary,
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.lg,
                padding: 20,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {completedOnboarding}/{onboarding.length}
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Onboarding</div>
              </div>
            </div>

            {/* Contact & Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{
                background: theme.colors.bgSecondary,
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.lg,
                padding: 24,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Contact Information</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>
                      Primary Contact
                    </div>
                    <div style={{ fontSize: 14, color: theme.colors.textPrimary }}>
                      {client.primaryContact || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>
                      Email
                    </div>
                    <div style={{ fontSize: 14, color: theme.colors.textPrimary }}>
                      {client.primaryEmail || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>
                      Client Since
                    </div>
                    <div style={{ fontSize: 14, color: theme.colors.textPrimary }}>
                      {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: theme.colors.bgSecondary,
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.lg,
                padding: 24,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Financial Details</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  {canSeeBudget && client.monthlyRetainer && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>
                        Monthly Retainer
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.success }}>
                        ${client.monthlyRetainer.toLocaleString()}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4 }}>
                      Total Project Budget
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary }}>
                      ${projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agencies */}
            <AgenciesManager clientId={client.id} initialAgencies={client.agencies} />
          </div>
        )}

        {activeTab === "projects" && (
          <div style={{
            background: theme.colors.bgSecondary,
            border: "1px solid " + theme.colors.borderLight,
            borderRadius: theme.borderRadius.lg,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid " + theme.colors.borderLight,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Projects ({projects.length})
              </h2>
              {canAddProjects && (
                <Link
                  href={`/projects/new?clientId=${client.id}`}
                  style={{
                    background: theme.colors.primary,
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: theme.borderRadius.md,
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  + Add Project
                </Link>
              )}
            </div>

            {projects.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
                <div style={{ color: theme.colors.textMuted, marginBottom: 12, display: "flex", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></div>
                <div>No projects yet</div>
              </div>
            ) : (
              <div>
                {projects.map((project, idx) => (
                  <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      padding: "16px 24px",
                      borderBottom: idx < projects.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary, fontSize: 15 }}>
                            {project.name}
                          </div>
                          <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                            {project.serviceType.replace("_", " ")} • {project.completedTasks}/{project.totalTasks} tasks
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                          color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary,
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                          <div style={{
                            height: "100%",
                            width: project.completionPercentage + "%",
                            background: theme.gradients.progress,
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500 }}>
                          {project.completionPercentage}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "onboarding" && (
          <OnboardingManager 
            clientId={client.id} 
            clientStatus={client.status} 
            initialItems={onboarding} 
          />
        )}

        {activeTab === "team" && (
          <TeamManager 
            clientId={client.id} 
            initialTeam={team} 
            canEdit={canManageTeam}
          />
        )}

        {activeTab === "resources" && (
          <ClientResources
            clientId={client.id}
            initialResources={resources}
          />
        )}

        {activeTab === "calendar" && (
          <ClientCalendar clientId={client.id} />
        )}
      </main>
    </div>
  );
}
