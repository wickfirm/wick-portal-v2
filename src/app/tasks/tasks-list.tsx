"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string | null;
  categoryId: string | null;
  internalNotes: string | null;
  nextSteps: string | null;
  ownerType: string;
  externalLink: string | null;
  externalLinkLabel: string | null;
  internalLink: string | null;
  internalLinkLabel: string | null;
  client: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    name: string | null;
  } | null;
  assigneeId: string | null;
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

const OWNER_OPTIONS = ["AGENCY", "CLIENT"];

export default function TasksList({
  initialTasks,
  clients,
  projects,
  teamMembers,
  currentUserId,
  currentUserRole,
}: TasksListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  
  // Dynamic status and priority options from API
  const [statusOptions, setStatusOptions] = useState<string[]>(["PENDING", "IN_PROGRESS", "ONGOING", "ON_HOLD", "COMPLETED", "FUTURE_PLAN", "BLOCKED"]);
  const [priorityOptions, setPriorityOptions] = useState<string[]>(["HIGH", "MEDIUM", "LOW"]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    clientId: "",
    projectId: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
  });
  const [savingTask, setSavingTask] = useState(false);

  // Fetch custom statuses and priorities on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/task-statuses"),
      fetch("/api/task-priorities")
    ])
      .then(([statusRes, priorityRes]) => {
        return Promise.all([statusRes.json(), priorityRes.json()]);
      })
      .then(([statuses, priorities]) => {
        if (statuses.length > 0) {
          setStatusOptions(statuses.map((s: any) => s.name));
        }
        if (priorities.length > 0) {
          setPriorityOptions(priorities.map((p: any) => p.name));
        }
      })
      .catch(err => {
        console.error("Failed to load custom options:", err);
        // Keep fallback defaults already set in state
      });
  }, []);

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    setDeletingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // Remove task from local state
        setTasks(tasks.filter(t => t.id !== taskId));
      } else {
        alert("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Create task
  const createTask = async () => {
    if (!newTask.name.trim() || !newTask.clientId) {
      alert("Please fill in task name and select a client");
      return;
    }

    setSavingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (res.ok) {
        const createdTask = await res.json();
        // Add to local state
        setTasks([createdTask, ...tasks]);
        // Reset form and close modal
        setNewTask({
          name: "",
          clientId: "",
          projectId: "",
          priority: "MEDIUM",
          status: "TODO",
          dueDate: "",
        });
        setShowAddModal(false);
      } else {
        alert("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    } finally {
      setSavingTask(false);
    }
  };

  // Update task field inline
  const updateTaskField = async (taskId: string, field: string, value: any) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Filter projects based on selected client
  const filteredProjects = useMemo(() => {
    if (!selectedClient) return projects;
    return projects.filter(p => p.clientId === selectedClient);
  }, [selectedClient, projects]);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Apply filters and sorting
  const filteredAndSortedTasks = useMemo(() => {
    // First filter
    let result = tasks.filter(task => {
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

    // Then sort
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "client":
          aVal = a.client.name.toLowerCase();
          bVal = b.client.name.toLowerCase();
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "priority":
          const priorityOrder: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case "assignee":
          aVal = a.assignee?.name?.toLowerCase() || "";
          bVal = b.assignee?.name?.toLowerCase() || "";
          break;
        case "dueDate":
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [tasks, searchQuery, selectedClient, selectedProject, selectedStatus, selectedPriority, selectedAssignee, sortColumn, sortDirection]);

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

          {/* Assignee Filter */}
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

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "8px 16px",
              background: theme.colors.primary,
              border: "none",
              borderRadius: theme.borderRadius.md,
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Add Task
          </button>
        </div>

        {/* Results Count */}
        <div style={{ marginTop: 12, fontSize: 13, color: theme.colors.textMuted }}>
          Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
          {hasActiveFilters && " (filtered)"}
        </div>
      </div>

      {/* Tasks Table */}
      {filteredAndSortedTasks.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center", color: theme.colors.textMuted }}>
          <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div>
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
                  Assignee
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Owner
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Due Date
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Priority
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Notes
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Next Steps
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                  Internal
                </th>
                {(currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN") && (
                  <th style={{ padding: "12px 24px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTasks.map((task, idx) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < today && task.status !== "COMPLETED";
                const taskProject = projects.find(p => p.id === task.projectId);
                
                return (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: idx < filteredAndSortedTasks.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                    }}
                  >
                    {/* Task Name */}
                    <td style={{ padding: "12px 24px", minWidth: 180 }}>
                      <div style={{ fontWeight: 500, color: task.status === "COMPLETED" ? theme.colors.textMuted : theme.colors.textPrimary }}>
                        {task.name}
                      </div>
                    </td>

                    {/* Client / Project */}
                    <td style={{ padding: "12px 24px", fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{task.client.name}</div>
                      {taskProject && (
                        <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{taskProject.name}</div>
                      )}
                    </td>

                    {/* Assignee (Inline Dropdown) */}
                    <td style={{ padding: "12px 24px", minWidth: 140 }}>
                      <select
                        value={task.assigneeId || ""}
                        onChange={(e) => updateTaskField(task.id, "assigneeId", e.target.value || null)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid " + theme.colors.borderLight,
                          fontSize: 13,
                          background: "white",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Owner (Inline Dropdown) */}
                    <td style={{ padding: "12px 24px", width: 100 }}>
                      <select
                        value={task.ownerType}
                        onChange={(e) => updateTaskField(task.id, "ownerType", e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 11,
                          fontWeight: 500,
                          background: task.ownerType === "CLIENT" ? theme.colors.warningBg : theme.colors.infoBg,
                          color: task.ownerType === "CLIENT" ? "#92400E" : theme.colors.info,
                          cursor: "pointer",
                        }}
                      >
                        <option value="AGENCY">Agency</option>
                        <option value="CLIENT">Client</option>
                      </select>
                    </td>

                    {/* Due Date (Inline Date Picker) */}
                    <td style={{ padding: "12px 24px", width: 130 }}>
                      <input
                        type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => updateTaskField(task.id, "dueDate", e.target.value || null)}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid " + theme.colors.borderLight,
                          borderRadius: 6,
                          fontSize: 13,
                          cursor: "pointer",
                          color: isOverdue ? theme.colors.error : theme.colors.textSecondary,
                        }}
                      />
                    </td>

                    {/* Priority (Inline Dropdown) */}
                    <td style={{ padding: "12px 24px", width: 100 }}>
                      <select
                        value={task.priority}
                        onChange={(e) => updateTaskField(task.id, "priority", e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 20,
                          border: "none",
                          fontSize: 11,
                          fontWeight: 500,
                          background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
                          color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textSecondary,
                          cursor: "pointer",
                        }}
                      >
                        {priorityOptions.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>

                    {/* Status (Inline Dropdown) */}
                    <td style={{ padding: "12px 24px", width: 130 }}>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskField(task.id, "status", e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 20,
                          border: "none",
                          fontSize: 11,
                          fontWeight: 500,
                          background: STATUS_STYLES[task.status]?.bg || theme.colors.bgTertiary,
                          color: STATUS_STYLES[task.status]?.color || theme.colors.textSecondary,
                          cursor: "pointer",
                        }}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </td>

                    {/* Notes (Inline Input) */}
                    <td style={{ padding: "12px 24px", minWidth: 150 }}>
                      <input
                        type="text"
                        value={task.internalNotes || ""}
                        onChange={(e) => updateTaskField(task.id, "notes", e.target.value)}
                        placeholder="Add notes..."
                        style={{
                          padding: "6px 10px",
                          border: "1px solid transparent",
                          borderRadius: 6,
                          fontSize: 12,
                          background: "transparent",
                          width: "100%",
                          color: theme.colors.textSecondary,
                        }}
                        onFocus={(e) => e.currentTarget.style.border = "1px solid " + theme.colors.borderMedium}
                        onBlur={(e) => e.currentTarget.style.border = "1px solid transparent"}
                      />
                    </td>

                    {/* Next Steps (Inline Input) */}
                    <td style={{ padding: "12px 24px", minWidth: 150 }}>
                      <input
                        type="text"
                        value={task.nextSteps || ""}
                        onChange={(e) => updateTaskField(task.id, "nextSteps", e.target.value)}
                        placeholder="Add next steps..."
                        style={{
                          padding: "6px 10px",
                          border: "1px solid transparent",
                          borderRadius: 6,
                          fontSize: 12,
                          background: "transparent",
                          width: "100%",
                          color: theme.colors.textSecondary,
                        }}
                        onFocus={(e) => e.currentTarget.style.border = "1px solid " + theme.colors.borderMedium}
                        onBlur={(e) => e.currentTarget.style.border = "1px solid transparent"}
                      />
                    </td>

                    {/* Internal Link Icon */}
                    <td style={{ padding: "12px 24px", width: 60, textAlign: "center" }}>
                      {task.internalLink && (
                        <a href={task.internalLink} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary, fontSize: 16 }}>
                          🔗
                        </a>
                      )}
                    </td>

                    {/* Actions (ADMIN/SUPER_ADMIN only) */}
                    {(currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN") && (
                      <td style={{ padding: "12px 24px", textAlign: "right" }}>
                        <button
                          onClick={() => deleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                          style={{
                            padding: "6px 12px",
                            background: deletingTaskId === task.id ? theme.colors.bgTertiary : theme.colors.errorBg,
                            color: deletingTaskId === task.id ? theme.colors.textMuted : theme.colors.error,
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: deletingTaskId === task.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {deletingTaskId === task.id ? "..." : "Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <>
          <div 
            onClick={() => setShowAddModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 999,
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 500,
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
            zIndex: 1000,
            padding: 24,
          }}>
            <h3 style={{ margin: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>Add New Task</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                  Task Name *
                </label>
                <input
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="Enter task name..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid " + theme.colors.borderLight,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                    Client *
                  </label>
                  <select
                    value={newTask.clientId}
                    onChange={(e) => {
                      setNewTask({ ...newTask, clientId: e.target.value, projectId: "" });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid " + theme.colors.borderLight,
                      borderRadius: theme.borderRadius.md,
                      fontSize: 14,
                    }}
                  >
                    <option value="">Select client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                    Project
                  </label>
                  <select
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                    disabled={!newTask.clientId}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid " + theme.colors.borderLight,
                      borderRadius: theme.borderRadius.md,
                      fontSize: 14,
                      opacity: !newTask.clientId ? 0.5 : 1,
                    }}
                  >
                    <option value="">No project</option>
                    {projects.filter(p => p.clientId === newTask.clientId).map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid " + theme.colors.borderLight,
                      borderRadius: theme.borderRadius.md,
                      fontSize: 14,
                    }}
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                    Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid " + theme.colors.borderLight,
                      borderRadius: theme.borderRadius.md,
                      fontSize: 14,
                    }}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid " + theme.colors.borderLight,
                      borderRadius: theme.borderRadius.md,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  onClick={createTask}
                  disabled={savingTask}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: savingTask ? theme.colors.bgTertiary : theme.colors.primary,
                    color: savingTask ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: savingTask ? "not-allowed" : "pointer",
                  }}
                >
                  {savingTask ? "Creating..." : "Create Task"}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={savingTask}
                  style={{
                    padding: "12px 20px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: savingTask ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
