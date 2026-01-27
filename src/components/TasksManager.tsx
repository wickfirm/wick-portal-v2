"use client";

import { useState, useEffect } from "react";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

type Task = {
  id: string;
  name: string;
  notes: string | null;
  nextSteps: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  externalLink: string | null;
  externalLinkLabel: string | null;
  internalLink: string | null;
  internalLinkLabel: string | null;
  category: { id: string; name: string } | null;
  categoryId?: string | null;
  projectId: string | null;
  ownerType: string;
  assigneeId: string | null;
  assignee: { name: string; email: string } | null;
  client?: {
    id: string;
    nickname: string | null;
    name: string;
    agencies: { agency: { id: string; name: string } }[];
  };
};

type TaskCategory = {
  id: string;
  name: string;
  order: number;
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "ONGOING", "ON_HOLD", "COMPLETED", "FUTURE_PLAN", "BLOCKED"];
const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"];

type TasksManagerProps = {
  context: "general" | "client" | "project";
  clientId?: string;
  projectId?: string;
  showClientColumn?: boolean;
  currentUserId?: string;
};

export default function TasksManager({
  context,
  clientId,
  projectId,
  showClientColumn = false,
  currentUserId,
}: TasksManagerProps) {
  const [client, setClient] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterOwner, setFilterOwner] = useState<string>("ALL");
  const [filterAssignee, setFilterAssignee] = useState<string>("ALL");
  const [hideCompleted, setHideCompleted] = useState(true);
  
  // Side panel state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Quick add state per category
  const [quickAddCategory, setQuickAddCategory] = useState<string | null>(null);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddProject, setQuickAddProject] = useState("");
  const [quickAddClient, setQuickAddClient] = useState("");
  const [clients, setClients] = useState<any[]>([]);

  // Determine API endpoints based on context
  const getTasksEndpoint = () => {
    if (context === "client" && clientId) return `/api/clients/${clientId}/tasks`;
    if (context === "project" && projectId) return `/api/projects/${projectId}/tasks`;
    return "/api/tasks/list";
  };

  const getCreateTaskEndpoint = () => {
    if (context === "client" && clientId) return `/api/clients/${clientId}/tasks`;
    if (context === "project" && projectId) return `/api/projects/${projectId}/tasks`;
    return "/api/tasks";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests: Promise<any>[] = [
          fetch(getTasksEndpoint()).then(res => res.json()),
          fetch("/api/task-categories").then(res => res.json()),
          fetch("/api/users").then(res => res.json()),
        ];

        // Fetch client data if in client context
        if (context === "client" && clientId) {
          requests.push(fetch(`/api/clients/${clientId}`).then(res => res.json()));
          requests.push(fetch(`/api/projects?clientId=${clientId}`).then(res => res.json()));
        }

        // Fetch all clients if in general context
        if (context === "general") {
          requests.push(fetch("/api/clients").then(res => res.json()));
          requests.push(fetch("/api/projects").then(res => res.json()));
        }

        // Fetch project and client data if in project context
        if (context === "project" && projectId) {
          const projectRes = await fetch(`/api/projects/${projectId}`);
          const projectData = await projectRes.json();
          if (projectData.client) {
            setClient(projectData.client);
            setQuickAddClient(projectData.client.id);
          }
          requests.push(Promise.resolve(projectData));
        }

        const results = await Promise.all(requests);
        
        const tasksData = results[0];
        const categoriesData = results[1];
        const usersData = results[2];

        setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks || []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);

        if (context === "client") {
          setClient(results[3]);
          setProjects(Array.isArray(results[4]) ? results[4] : []);
        } else if (context === "general") {
          const clientsData = results[3];
          const clientsList = Array.isArray(clientsData) ? clientsData : clientsData.clients || [];
          setClients(clientsList);
          setProjects(Array.isArray(results[4]) ? results[4] : []);
          
          // Collapse all clients by default in general context
          const allClientIds = new Set<string>(clientsList.map((c: any) => c.id));
          setCollapsedClients(allClientIds);
        } else if (context === "project") {
          const projectData = results[3];
          setProjects(projectData ? [projectData] : []);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [context, clientId, projectId]);

  async function fetchTasks() {
    const res = await fetch(getTasksEndpoint());
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : data.tasks || []);
  }

  async function updateTaskField(taskId: string, field: string, value: any) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTasks();
        if (selectedTask?.id === taskId) setSelectedTask(null);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  async function quickAddTask(categoryId: string) {
    if (!quickAddName.trim()) return;

    // Validate project is selected (except in project context where it's auto-set)
    if (context !== "project" && !quickAddProject) {
      alert("Please select a project for this task.");
      return;
    }

    const taskData: any = {
      name: quickAddName,
      categoryId: categoryId || null,
      projectId: quickAddProject || null,
      status: "PENDING",
      priority: "MEDIUM",
      ownerType: "AGENCY",
    };

    // Add clientId based on context
    if (context === "client" && clientId) {
      taskData.clientId = clientId;
    } else if (context === "general" && quickAddClient) {
      taskData.clientId = quickAddClient;
    } else if (context === "project" && client) {
      taskData.clientId = client.id;
      taskData.projectId = projectId;
    }

    try {
      const res = await fetch(getCreateTaskEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      
      if (res.ok) {
        setQuickAddName("");
        setQuickAddProject("");
        setQuickAddClient("");
        setQuickAddCategory(null);
        await fetchTasks();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    }
  }

  function openTaskPanel(task: Task) {
    setSelectedTask(task);
    setEditForm({
      name: task.name,
      notes: task.notes || "",
      nextSteps: task.nextSteps || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      categoryId: task.category?.id || "",
      projectId: task.projectId || "",
      ownerType: task.ownerType,
      assigneeId: task.assigneeId || "",
      externalLink: task.externalLink || "",
      externalLinkLabel: task.externalLinkLabel || "",
      internalLink: task.internalLink || "",
      internalLinkLabel: task.internalLinkLabel || "",
    });
  }

  function closeTaskPanel() {
    setSelectedTask(null);
    setEditForm({});
  }

  async function saveTask() {
    if (!selectedTask) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        await fetchTasks();
        closeTaskPanel();
      }
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(categoryId: string) {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  }

  function toggleClient(clientId: string) {
    const newCollapsed = new Set(collapsedClients);
    if (newCollapsed.has(clientId)) {
      newCollapsed.delete(clientId);
    } else {
      newCollapsed.add(clientId);
    }
    setCollapsedClients(newCollapsed);
  }

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    if (hideCompleted && task.status === "COMPLETED") return false;
    if (filterStatus !== "ALL" && task.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && task.priority !== filterPriority) return false;
    if (filterOwner !== "ALL" && task.ownerType !== filterOwner) return false;
    if (filterAssignee !== "ALL" && task.assignee?.id !== filterAssignee) return false;
    return true;
  });

  // Group tasks - in general context, group by client first, then by category
  // In client/project context, just group by category
  const groupedByClient: Record<string, Task[]> = {};
  const groupedTasks: Record<string, Task[]> = {};
  const uncategorized: Task[] = [];
  
  if (context === "general") {
    // Group by client first
    filteredTasks.forEach(task => {
      const clientKey = task.client?.id || "unknown";
      if (!groupedByClient[clientKey]) {
        groupedByClient[clientKey] = [];
      }
      groupedByClient[clientKey].push(task);
    });
  } else {
    // Group by category directly
    filteredTasks.forEach(task => {
      if (task.category) {
        if (!groupedTasks[task.category.id]) {
          groupedTasks[task.category.id] = [];
        }
        groupedTasks[task.category.id].push(task);
      } else {
        uncategorized.push(task);
      }
    });
  }

  // Sort categories by order
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  // Count active filters
  const activeFilterCount = [
    filterStatus !== "ALL",
    filterPriority !== "ALL",
    filterOwner !== "ALL",
    filterAssignee !== "ALL",
    !hideCompleted,
  ].filter(Boolean).length;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  };

  // Owner display names for dropdown
  const clientDisplayName = client?.nickname || client?.name || "Client";
  const agencyDisplayName = client?.agencies?.[0]?.agency?.name || "Agency";

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>
        Loading tasks...
      </div>
    );
  }

  const renderTaskRow = (task: Task) => (
    <tr key={task.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
      {/* Task Name */}
      <td style={{ padding: "10px 12px", minWidth: 180 }}>
        <div 
          onClick={() => openTaskPanel(task)}
          style={{ 
            fontWeight: 500, 
            color: task.status === "COMPLETED" ? theme.colors.textMuted : theme.colors.textPrimary,
            textDecoration: task.status === "COMPLETED" ? "line-through" : "none",
            cursor: "pointer",
          }}
        >
          {task.name}
        </div>
      </td>

      {/* Assignee */}
      <td style={{ padding: "10px 12px", minWidth: 140 }}>
        <select
          value={task.assigneeId || ""}
          onChange={(e) => updateTaskField(task.id, "assigneeId", e.target.value || null)}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid " + theme.colors.borderLight,
            fontSize: 12,
            background: "white",
            color: task.assigneeId ? theme.colors.textPrimary : theme.colors.textMuted,
            cursor: "pointer",
            outline: "none",
            maxWidth: "100%",
          }}
        >
          <option value="">Unassigned</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </td>

      {/* Owner */}
      <td style={{ padding: "10px 12px", width: 100 }}>
        <select
          value={task.ownerType}
          onChange={(e) => updateTaskField(task.id, "ownerType", e.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            fontWeight: 500,
            background: task.ownerType === "CLIENT" ? theme.colors.warningBg : theme.colors.infoBg,
            color: task.ownerType === "CLIENT" ? "#92400E" : theme.colors.info,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="AGENCY">{context === "general" ? "Agency" : agencyDisplayName}</option>
          <option value="CLIENT">{context === "general" ? "Client" : clientDisplayName}</option>
        </select>
      </td>

      {/* Due Date */}
      <td style={{ padding: "10px 12px", width: 120 }}>
        <input
          type="date"
          value={task.dueDate ? task.dueDate.split("T")[0] : ""}
          onChange={(e) => updateTaskField(task.id, "dueDate", e.target.value || null)}
          style={{
            padding: "4px 8px",
            border: "1px solid transparent",
            borderRadius: 4,
            fontSize: 12,
            background: "transparent",
            cursor: "pointer",
            color: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" 
              ? theme.colors.error 
              : theme.colors.textSecondary,
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.borderMedium}
          onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
        />
      </td>

      {/* Priority */}
      <td style={{ padding: "10px 12px", width: 100 }}>
        <select
          value={task.priority}
          onChange={(e) => updateTaskField(task.id, "priority", e.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: 20,
            border: "none",
            fontSize: 11,
            fontWeight: 500,
            background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
            color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textSecondary,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>

      {/* Status */}
      <td style={{ padding: "10px 12px", width: 130 }}>
        <select
          value={task.status}
          onChange={(e) => updateTaskField(task.id, "status", e.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            fontWeight: 500,
            background: STATUS_STYLES[task.status]?.bg || theme.colors.bgTertiary,
            color: STATUS_STYLES[task.status]?.color || theme.colors.textSecondary,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </td>

      {/* Notes Preview */}
      <td style={{ padding: "10px 12px", maxWidth: 150 }}>
        <div style={{ fontSize: 12, color: theme.colors.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.notes || "-"}
        </div>
      </td>

      {/* Next Steps Preview */}
      <td style={{ padding: "10px 12px", maxWidth: 120 }}>
        <div style={{ fontSize: 12, color: theme.colors.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.nextSteps || "-"}
        </div>
      </td>

      {/* Client Column (conditional) */}
      {showClientColumn && (
        <td style={{ padding: "10px 12px", width: 120 }}>
          {task.client ? (
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: theme.colors.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {task.client.nickname || task.client.name}
            </div>
          ) : (
            <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>-</span>
          )}
        </td>
      )}

      {/* Internal Link */}
      <td style={{ padding: "10px 12px", width: 70 }}>
        {task.internalLink ? (
          <a href={task.internalLink} target="_blank" rel="noopener noreferrer" style={{
            padding: "4px 8px",
            background: theme.colors.infoBg,
            color: theme.colors.info,
            borderRadius: 4,
            fontSize: 10,
            textDecoration: "none",
            fontWeight: 500,
          }}>
            {task.internalLinkLabel || "Internal"}
          </a>
        ) : (
          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>-</span>
        )}
      </td>

      {/* Actions */}
      <td style={{ padding: "10px 12px", width: 100, textAlign: "right" }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          <button
            onClick={() => openTaskPanel(task)}
            style={{
              padding: "4px 10px",
              background: theme.colors.infoBg,
              color: theme.colors.info,
              border: "none",
              borderRadius: 4,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Edit
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            style={{
              padding: "4px 8px",
              background: theme.colors.errorBg,
              color: theme.colors.error,
              border: "none",
              borderRadius: 4,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );

  const renderCategorySection = (category: TaskCategory | null, categoryTasks: Task[]) => {
    const categoryId = category?.id || "uncategorized";
    const categoryName = category?.name || "Uncategorized";
    const isCollapsed = collapsedCategories.has(categoryId);
    const completedCount = categoryTasks.filter(t => t.status === "COMPLETED").length;
    const pendingCount = categoryTasks.length - completedCount;

    return (
      <div key={categoryId} style={{ marginBottom: 16 }}>
        {/* Category Header */}
        <div
          onClick={() => toggleCategory(categoryId)}
          style={{
            padding: "12px 16px",
            background: theme.colors.bgTertiary,
            borderRadius: isCollapsed ? 8 : "8px 8px 0 0",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ 
              fontSize: 12, 
              color: theme.colors.textMuted,
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}>
              ▼
            </span>
            <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary }}>
              {categoryName}
            </span>
            <span style={{ fontSize: 12, color: theme.colors.textMuted }}>
              ({pendingCount} active{completedCount > 0 ? `, ${completedCount} done` : ""})
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuickAddCategory(categoryId);
              
              // Auto-select default project if available (except in project context)
              if (context !== "project" && !quickAddProject) {
                const defaultProj = projects.find((p: any) => p.isDefault || p.name === "Admin/Operations");
                if (defaultProj) {
                  setQuickAddProject(defaultProj.id);
                }
              }
            }}
            style={{
              padding: "4px 12px",
              background: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        </div>

        {/* Tasks Table */}
        {!isCollapsed && (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            border: "1px solid " + theme.colors.borderLight,
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            overflow: "hidden",
          }}>
            {/* Quick Add Row */}
            {quickAddCategory === categoryId && (
              <div style={{ padding: "12px 16px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder="Task name..."
                  autoFocus
                  style={{ ...inputStyle, flex: "1 1 250px" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") quickAddTask(category?.id || "");
                    if (e.key === "Escape") { setQuickAddCategory(null); setQuickAddName(""); setQuickAddProject(""); setQuickAddClient(""); }
                  }}
                />
                {context === "general" && (
                  <select
                    value={quickAddClient}
                    onChange={(e) => setQuickAddClient(e.target.value)}
                    style={{ ...inputStyle, flex: "0 1 180px", cursor: "pointer" }}
                  >
                    <option value="">Select Client...</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
                {context !== "project" && (
                  <select
                    value={quickAddProject}
                    onChange={(e) => setQuickAddProject(e.target.value)}
                    style={{ ...inputStyle, flex: "0 1 200px", cursor: "pointer" }}
                    required
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.isDefault && " (Default)"}
                      </option>
                    ))}
                  </select>
                )}
                <button onClick={() => quickAddTask(category?.id || "")} style={{ padding: "10px 20px", background: theme.colors.primary, color: "white", border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer" }}>Add</button>
                <button onClick={() => { setQuickAddCategory(null); setQuickAddName(""); setQuickAddProject(""); setQuickAddClient(""); }} style={{ padding: "10px 16px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              </div>
            )}

            {categoryTasks.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: theme.colors.textMuted, fontSize: 13 }}>
                No tasks in this category
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
                  <thead>
                    <tr style={{ background: theme.colors.bgPrimary }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Task</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Assignee</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Owner</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Due Date</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Priority</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Notes</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Next Steps</th>
                      {showClientColumn && (
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Client</th>
                      )}
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Internal</th>
                      <th style={{ padding: "10px 12px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryTasks.map(renderTaskRow)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Filter Bar */}
      <div style={{
        background: theme.colors.bgSecondary,
        border: "1px solid " + theme.colors.borderLight,
        borderRadius: theme.borderRadius.lg,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid " + theme.colors.borderLight,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <option value="ALL">All</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid " + theme.colors.borderLight,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <option value="ALL">All</option>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Owner:</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid " + theme.colors.borderLight,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <option value="ALL">All</option>
              <option value="AGENCY">Agency</option>
              <option value="CLIENT">Client</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Assignee:</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid " + theme.colors.borderLight,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <option value="ALL">All</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name || user.email}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              id="hideCompleted"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor="hideCompleted" style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, cursor: "pointer" }}>
              Hide Completed
            </label>
          </div>

          {activeFilterCount > 0 && (
            <div style={{ marginLeft: "auto", fontSize: 13, color: theme.colors.textMuted }}>
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
            </div>
          )}
        </div>
      </div>

      {/* Categories or Client Groups */}
      <div>
        {context === "general" ? (
          // General context: Show client groups, then categories within each
          Object.keys(groupedByClient).sort((a, b) => {
            const clientA = clients.find(c => c.id === a);
            const clientB = clients.find(c => c.id === b);
            return (clientA?.name || "").localeCompare(clientB?.name || "");
          }).map(clientKey => {
            const clientTasks = groupedByClient[clientKey];
            const clientInfo = clientTasks[0]?.client;
            if (!clientInfo) return null;

            const isClientCollapsed = collapsedClients.has(clientKey);
            const clientTaskCount = clientTasks.filter(t => t.status !== "COMPLETED").length;
            const completedCount = clientTasks.filter(t => t.status === "COMPLETED").length;

            // Group this client's tasks by category
            const clientGroupedTasks: Record<string, Task[]> = {};
            const clientUncategorized: Task[] = [];
            
            clientTasks.forEach(task => {
              if (task.category) {
                if (!clientGroupedTasks[task.category.id]) {
                  clientGroupedTasks[task.category.id] = [];
                }
                clientGroupedTasks[task.category.id].push(task);
              } else {
                clientUncategorized.push(task);
              }
            });

            return (
              <div key={clientKey} style={{ marginBottom: 24 }}>
                {/* Client Header */}
                <div
                  onClick={() => toggleClient(clientKey)}
                  style={{
                    padding: "16px 20px",
                    background: theme.colors.bgTertiary,
                    borderRadius: isClientCollapsed ? 12 : "12px 12px 0 0",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ 
                      fontSize: 14, 
                      color: theme.colors.textMuted,
                      transform: isClientCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}>
                      ▼
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 16, color: theme.colors.textPrimary }}>
                      {clientInfo.nickname || clientInfo.name}
                    </span>
                    <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                      ({clientTaskCount} active{completedCount > 0 ? `, ${completedCount} done` : ""})
                    </span>
                  </div>
                </div>

                {/* Client's Categories */}
                {!isClientCollapsed && (
                  <div style={{ 
                    background: theme.colors.bgSecondary,
                    border: "1px solid " + theme.colors.borderLight,
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    padding: "16px",
                  }}>
                    {sortedCategories.map(category => {
                      const categoryTasks = clientGroupedTasks[category.id] || [];
                      if (categoryTasks.length === 0) return null;
                      return renderCategorySection(category, categoryTasks);
                    })}
                    
                    {clientUncategorized.length > 0 && renderCategorySection(null, clientUncategorized)}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Client/Project context: Show categories directly
          <>
            {sortedCategories.map(category => {
              const categoryTasks = groupedTasks[category.id] || [];
              if (categoryTasks.length === 0 && hideCompleted) return null;
              return renderCategorySection(category, categoryTasks);
            })}
            
            {uncategorized.length > 0 && renderCategorySection(null, uncategorized)}
          </>
        )}
      </div>

      {/* Edit Side Panel */}
      {selectedTask && (
        <>
          <div
            onClick={closeTaskPanel}
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
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(500px, 90vw)",
            background: theme.colors.bgSecondary,
            boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
            overflowY: "auto",
            padding: 32,
          }}>
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Edit Task</h2>
              <button
                onClick={closeTaskPanel}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: theme.colors.textMuted,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Task Name</label>
                <input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Status</label>
                  <select value={editForm.status || ""} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Priority</label>
                  <select value={editForm.priority || ""} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} style={inputStyle}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Owner</label>
                  <select value={editForm.ownerType || ""} onChange={(e) => setEditForm({ ...editForm, ownerType: e.target.value })} style={inputStyle}>
                    <option value="AGENCY">{context === "general" ? "Agency" : agencyDisplayName}</option>
                    <option value="CLIENT">{context === "general" ? "Client" : clientDisplayName}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Due Date</label>
                  <input
                    type="date"
                    value={editForm.dueDate || ""}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Assignee</label>
                <select value={editForm.assigneeId || ""} onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })} style={inputStyle}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Category</label>
                <select value={editForm.categoryId || ""} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })} style={inputStyle}>
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {context !== "project" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Project <span style={{ color: theme.colors.error }}>*</span>
                  </label>
                  <select 
                    value={editForm.projectId || ""} 
                    onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value })} 
                    style={inputStyle}
                    required
                  >
                    <option value="">Select Project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.isDefault && " (Default)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Notes</label>
                <textarea
                  value={editForm.notes || ""}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Next Steps</label>
                <textarea
                  value={editForm.nextSteps || ""}
                  onChange={(e) => setEditForm({ ...editForm, nextSteps: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>External Link</label>
                <input
                  value={editForm.externalLink || ""}
                  onChange={(e) => setEditForm({ ...editForm, externalLink: e.target.value })}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>External Link Label</label>
                <input
                  value={editForm.externalLinkLabel || ""}
                  onChange={(e) => setEditForm({ ...editForm, externalLinkLabel: e.target.value })}
                  placeholder="Client Link"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Internal Link</label>
                <input
                  value={editForm.internalLink || ""}
                  onChange={(e) => setEditForm({ ...editForm, internalLink: e.target.value })}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Internal Link Label</label>
                <input
                  value={editForm.internalLinkLabel || ""}
                  onChange={(e) => setEditForm({ ...editForm, internalLinkLabel: e.target.value })}
                  placeholder="Internal"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  onClick={saveTask}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px 24px",
                    background: saving ? theme.colors.bgTertiary : theme.colors.primary,
                    color: saving ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={closeTaskPanel}
                  style={{
                    padding: "12px 24px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
