"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import TasksManager from "@/components/TasksManager";
import DeleteProjectButton from "./delete-project-button";
import { theme, STATUS_STYLES } from "@/lib/theme";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  serviceType: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  billRate: number | null;
  isDefault: boolean;
  client: {
    id: string;
    name: string;
  };
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    dueDate: string | null;
    assignee: { name: string | null } | null;
  }>;
  resources: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  stages: Array<{
    id: string;
    name: string;
    order: number;
    isCompleted: boolean;
    completedAt: string | null;
  }>;
  assignments: Array<{
    id: string;
    role: string;
    hoursAllocated: number | null;
    user: {
      id: string;
      name: string | null;
    };
  }>;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id as string;
  const activeTab = searchParams.get("tab") || "overview";

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(res => {
        if (!res.ok) throw new Error("Failed to fetch project");
        return res.json();
      }),
      fetch('/api/auth/session').then(res => res.json()),
    ])
      .then(([projectData, sessionData]) => {
        setProject(projectData);
        setUserRole(sessionData?.user?.role || "");
        setUserId(sessionData?.user?.id || "");
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [projectId]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "tasks", label: "Tasks", icon: "✓", count: project?.tasks.length || 0 },
    { id: "resources", label: "Resources", icon: "📎", count: project?.resources.length || 0 },
    { id: "stages", label: "Stages", icon: "🎯", count: project?.stages.length || 0 },
    { id: "team", label: "Team", icon: "👥", count: project?.assignments.length || 0 },
  ];

  const setActiveTab = (tabId: string) => {
    const newUrl = `/projects/${projectId}?tab=${tabId}`;
    router.push(newUrl);
  };

  // Check if user can delete projects
  const canDelete = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
            Loading project...
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.error, marginBottom: 8 }}>
              {error || "Project not found"}
            </h2>
            <Link href="/projects" style={{ color: theme.colors.primary, textDecoration: "none" }}>
              ← Back to Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Link href="/projects" style={{ color: theme.colors.textMuted, textDecoration: "none", fontSize: 14 }}>
              ← Projects
            </Link>
            <span style={{ color: theme.colors.textMuted }}>/</span>
            <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{project.name}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
                {project.name}
                {project.isDefault && (
                  <span
                    style={{
                      marginLeft: 12,
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 500,
                      background: theme.colors.infoBg,
                      color: theme.colors.info,
                    }}
                  >
                    DEFAULT
                  </span>
                )}
              </h1>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <Link 
                  href={`/clients/${project.client.id}`}
                  style={{ 
                    color: theme.colors.primary, 
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  {project.client.name}
                </Link>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                  color: STATUS_STYLES[project.status]?.color || theme.colors.textMuted,
                }}>
                  {project.status.replace("_", " ")}
                </span>
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  {project.serviceType.replace("_", " ")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Link
                href={`/projects/${projectId}/edit`}
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
                Edit Project
              </Link>
              {canDelete && (
                <DeleteProjectButton
                  projectId={project.id}
                  projectName={project.name}
                  isDefault={project.isDefault}
                  clientId={project.client.id}
                />
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
              {tab.count !== undefined && (
                <span style={{
                  background: activeTab === tab.id ? theme.colors.primary : theme.colors.bgTertiary,
                  color: activeTab === tab.id ? "white" : theme.colors.textMuted,
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
          <div>
            {/* Quick Stats */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 16, 
              marginBottom: 32 
            }}>
              <div style={{
                padding: 20,
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
              }}>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Total Tasks</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                  {project.tasks.length}
                </div>
              </div>

              <div style={{
                padding: 20,
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
              }}>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Team Members</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                  {project.assignments.length}
                </div>
              </div>

              <div style={{
                padding: 20,
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
              }}>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Resources</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                  {project.resources.length}
                </div>
              </div>

              <div style={{
                padding: 20,
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
              }}>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Stages</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                  {project.stages.filter(s => s.isCompleted).length} / {project.stages.length}
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              border: "1px solid " + theme.colors.borderLight,
              padding: 24,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: theme.colors.textPrimary }}>
                Project Details
              </h3>
              
              <div style={{ display: "grid", gap: 16 }}>
                {project.description && (
                  <div>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Description</div>
                    <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>{project.description}</div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {project.startDate && (
                    <div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Start Date</div>
                      <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        {new Date(project.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {project.endDate && (
                    <div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>End Date</div>
                      <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        {new Date(project.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {project.budget !== null && (
                    <div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Budget</div>
                      <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        ${project.budget.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {project.billRate !== null && (
                    <div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Bill Rate</div>
                      <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                        ${project.billRate}/hr
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <TasksManager
            context="project"
            projectId={projectId}
            clientId={project.client.id}
            currentUserId={userId}
            currentUserRole={userRole}
          />
        )}

        {activeTab === "resources" && (
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
            padding: 24,
          }}>
            {project.resources.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
                No resources yet
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {project.resources.map(resource => (
                  <div
                    key={resource.id}
                    style={{
                      padding: 16,
                      background: theme.colors.bgPrimary,
                      borderRadius: theme.borderRadius.md,
                      border: "1px solid " + theme.colors.borderLight,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 4 }}>
                          {resource.name}
                        </div>
                        <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                          {resource.type}
                        </div>
                      </div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
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
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "stages" && (
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
            padding: 24,
          }}>
            {project.stages.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
                No stages yet
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {project.stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    style={{
                      padding: 16,
                      background: theme.colors.bgPrimary,
                      borderRadius: theme.borderRadius.md,
                      border: "1px solid " + theme.colors.borderLight,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: stage.isCompleted ? theme.colors.success : theme.colors.bgTertiary,
                      color: stage.isCompleted ? "white" : theme.colors.textMuted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {stage.isCompleted ? "✓" : index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                        {stage.name}
                      </div>
                      {stage.completedAt && (
                        <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
                          Completed {new Date(stage.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && (
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
            padding: 24,
          }}>
            {project.assignments.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
                No team members assigned yet
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {project.assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    style={{
                      padding: 16,
                      background: theme.colors.bgPrimary,
                      borderRadius: theme.borderRadius.md,
                      border: "1px solid " + theme.colors.borderLight,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 4 }}>
                        {assignment.user.name || "Unknown"}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                        {assignment.role}
                      </div>
                    </div>
                    {assignment.hoursAllocated !== null && (
                      <div style={{
                        padding: "6px 12px",
                        background: theme.colors.bgTertiary,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: 13,
                        fontWeight: 500,
                        color: theme.colors.textSecondary,
                      }}>
                        {assignment.hoursAllocated}h allocated
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
