"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string | null;
  client: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string | null;
  } | null;
};

type Client = { id: string; name: string };
type Project = { id: string; name: string; clientId: string };
type TeamMember = { id: string; name: string | null };

interface TasksListProps {
  initialTasks: Task[];
  clients: Client[];
  projects: Project[];
  teamMembers: TeamMember[];
  currentUserId: string;
  currentUserRole: string;
}

export default function TasksList({
  initialTasks,
  clients,
  projects,
  teamMembers,
  currentUserId,
  currentUserRole,
}: TasksListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");

  // Filter projects based on selected client
  const filteredProjects = useMemo(() => {
    if (!selectedClient) return projects;
    return projects.filter(p => p.clientId === selectedClient);
  }, [selectedClient, projects]);

  // Apply all filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Client filter
      if (selectedClient && task.client.id !== selectedClient) {
        return false;
      }

      // Project filter
      if (selectedProject && task.projectId !== selectedProject) {
        return false;
      }

      // Status filter
      if (selectedStatus && task.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority && task.priority !== selectedPriority) {
        return false;
      }

      // Assignee filter
      if (selectedAssignee && task.assignee?.id !== selectedAssignee) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedClient, selectedProject, selectedStatus, selectedPriority, selectedAssignee]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedClient("");
    setSelectedProject("");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedAssignee("");
  };

  const hasActiveFilters = searchQuery || selectedClient || selectedProject || selectedStatus || selectedPriority || selectedAssignee;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
      {/* Filters */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          {/* Search */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 6 }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                background: theme.colors.bgPrimary,
                color: theme.colors.textPrimary,
                fontSize: 14,
              }}
            />
          </div>

          {/* Client Filter */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 6 }}>
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedProject(""); // Reset project when client changes
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                background: theme.colors.bgPrimary,
                color: theme.colors.textPrimary,
                fontSize: 14,
              }}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 6 }}>
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={!selectedClient && projects.length > 20}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                background: theme.colors.bgPrimary,
                color: theme.colors.textPrimary,
                fontSize: 14,
                opacity: (!selectedClient && projects.length > 20) ? 0.5 : 1,
              }}
            >
              <option value="">All Projects</option>
              {filteredProjects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 6 }}>
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                background: theme.colors.bgPrimary,
                color: theme.colors.textPrimary,
                fontSize: 14,
              }}
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 6 }}>
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                background: theme.colors.bgPrimary,
                color: theme.colors.textPrimary,
                fontSize: 14,
              }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Assignee Filter (only for ADMIN/SUPER_ADMIN) */}
          {currentUserRole !== "MEMBER" && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 6 }}>
                Assignee
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid " + theme.colors.borderLight,
                  borderRadius: theme.borderRadius.md,
                  background: theme.colors.bgPrimary,
                  color: theme.colors.textPrimary,
                  fontSize: 14,
                }}
              >
                <option value="">All Assignees</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name || "Unnamed"}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: "8px 16px",
                background: theme.colors.bgTertiary,
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.textSecondary,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div style={{ marginTop: 12, fontSize: 13, color: theme.colors.textMuted }}>
          Showing {filteredTasks.length} of {tasks.length} tasks
          {hasActiveFilters && " (filtered)"}
        </div>
      </div>

      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center", color: theme.colors.textMuted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            {hasActiveFilters ? "No tasks match your filters" : "No tasks yet"}
          </div>
          <div style={{ fontSize: 14 }}>
            {hasActiveFilters ? "Try adjusting your filters" : "Tasks will appear here when created"}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: theme.colors.bgTertiary, borderBottom: "1px solid " + theme.colors.borderLight }}>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Task
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Client / Project
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Priority
                </th>
                {currentUserRole !== "MEMBER" && (
                  <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                    Assignee
                  </th>
                )}
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, idx) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < today && task.status !== "COMPLETED";
                const taskProject = projects.find(p => p.id === task.projectId);
                
                return (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: idx < filteredTasks.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                      transition: "background 0.2s",
                    }}
                  >
                    <td style={{ padding: "16px 24px" }}>
                      <Link
                        href={task.projectId ? `/projects/${task.projectId}?tab=tasks` : `/clients/${task.client.id}/tasks`}
                        style={{
                          color: theme.colors.textPrimary,
                          textDecoration: "none",
                          fontWeight: 500,
                          fontSize: 14,
                        }}
                      >
                        {task.name}
                      </Link>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontSize: 13, color: theme.colors.textPrimary }}>
                        {task.client.name}
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                        {taskProject?.name || "No project"}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                        background: STATUS_STYLES[task.status]?.bg || theme.colors.bgTertiary,
                        color: STATUS_STYLES[task.status]?.color || theme.colors.textMuted,
                      }}>
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                        background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
                        color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textMuted,
                      }}>
                        {task.priority}
                      </span>
                    </td>
                    {currentUserRole !== "MEMBER" && (
                      <td style={{ padding: "16px 24px", fontSize: 13, color: theme.colors.textSecondary }}>
                        {task.assignee?.name || "Unassigned"}
                      </td>
                    )}
                    <td style={{ padding: "16px 24px" }}>
                      {task.dueDate ? (
                        <div style={{
                          fontSize: 13,
                          color: isOverdue ? theme.colors.error : theme.colors.textSecondary,
                          fontWeight: isOverdue ? 500 : 400,
                        }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue && (
                            <span style={{ marginLeft: 6 }}>⚠️</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: theme.colors.textMuted }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
