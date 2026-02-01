"use client";

import { useState, useEffect } from "react";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";
import TasksLoadingSkeleton from "./TasksLoadingSkeleton";

type Task = {
  id: string;
  name: string;
  internalNotes: string | null;
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
  assignee: { id: string; name: string; email: string } | null;
  order: number;
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

type TasksManagerProps = {
  context: "general" | "client" | "project";
  clientId?: string;
  projectId?: string;
  showClientColumn?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
};

export default function TasksManager({
  context,
  clientId,
  projectId,
  showClientColumn = false,
  currentUserId,
  currentUserRole = "MEMBER",
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
  const [filterClient, setFilterClient] = useState<string>("ALL");
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
  
  // Dynamic status and priority options from API
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<string[]>([]);

  // Permission checks
  const canCreate = true; // Everyone can create tasks
  const canDelete = currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN";
  
  // Helper to check if user can edit a specific task
  const canEditTask = (task: Task) => {
    // Admins can edit everything
    if (currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN") return true;
    // Members can only edit their own assigned tasks
    return task.assigneeId === currentUserId;
  };

  // Smart task sorting: Priority + Due Date + Manual Order
  const priorityWeight = { "URGENT": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
  
  const smartSortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      // 1. First by manual order if set (non-zero)
      if (a.order !== 0 && b.order !== 0) {
        return a.order - b.order;
      }
      if (a.order !== 0) return -1; // a has manual order, comes first
      if (b.order !== 0) return 1;  // b has manual order, comes first
      
      // 2. Then by priority (URGENT > HIGH > MEDIUM > LOW)
      const priorityA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
      const priorityB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // 3. Then by due date (earliest first, null last)
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // 4. Finally by creation (tasks array order)
      return 0;
    });
  };

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
        // Fetch custom statuses and priorities
        const [statusRes, priorityRes] = await Promise.all([
          fetch("/api/task-statuses"),
          fetch("/api/task-priorities")
        ]);

        if (statusRes.ok) {
          const statuses = await statusRes.json();
          setStatusOptions(statuses.map((s: any) => s.name));
        } else {
          // Fallback to defaults if API fails
          setStatusOptions(["PENDING", "IN_PROGRESS", "ONGOING", "ON_HOLD", "COMPLETED", "FUTURE_PLAN", "BLOCKED"]);
        }

        if (priorityRes.ok) {
          const priorities = await priorityRes.json();
          setPriorityOptions(priorities.map((p: any) => p.name));
        } else {
          // Fallback to defaults if API fails
          setPriorityOptions(["HIGH", "MEDIUM", "LOW"]);
        }

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
          setQuickAddProject(projectId); // Pre-set project for quick add
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
          setQuickAddClient(clientId || ""); // Pre-set client for quick add
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
        // Set fallback options on error
        setStatusOptions(["PENDING", "IN_PROGRESS", "ONGOING", "ON_HOLD", "COMPLETED", "FUTURE_PLAN", "BLOCKED"]);
        setPriorityOptions(["HIGH", "MEDIUM", "LOW"]);
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

  async function addQuickTask(categoryId: string | null) {
    console.log('addQuickTask called:', { categoryId, quickAddName, quickAddProject, quickAddClient, context });
    
    if (!quickAddName.trim()) return;

    // Validate required fields based on context
    if (context === "general" && !quickAddClient) {
      alert("Please select a client");
      return;
    }

    if (!quickAddProject) {
      alert("Please select a project");
      return;
    }

    try {
      const taskData: any = {
        name: quickAddName.trim(),
        categoryId: categoryId || null,
        projectId: quickAddProject,
        status: "PENDING",
        priority: "MEDIUM",
        ownerType: "AGENCY",
      };

      // Add clientId for general context
      if (context === "general") {
        taskData.clientId = quickAddClient;
      }

      console.log('Creating task with data:', taskData);
      console.log('Using endpoint:', getCreateTaskEndpoint());

      const res = await fetch(getCreateTaskEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        console.log('Task created successfully');
        setQuickAddName("");
        setQuickAddCategory(null);
        await fetchTasks();
      } else {
        const errorText = await res.text();
        console.error('Failed to create task:', res.status, errorText);
        alert('Failed to create task: ' + errorText);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert('Error creating task: ' + error);
    }
  }

  function openTaskPanel(task: Task) {
    setSelectedTask(task);
    setEditForm({
      name: task.name,
      status: task.status,
      priority: task.priority,
      ownerType: task.ownerType,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      assigneeId: task.assigneeId || "",
      categoryId: task.categoryId || "",
      projectId: task.projectId || "",
      notes: task.internalNotes || "",
      nextSteps: task.nextSteps || "",
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
    }
    setSaving(false);
  }

  function toggleCategoryCollapse(categoryId: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function toggleClientCollapse(clientId: string) {
    setCollapsedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  }

  const matchesFilters = (task: Task) => {
    if (hideCompleted && task.status === "COMPLETED") return false;
    if (filterStatus !== "ALL" && task.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && task.priority !== filterPriority) return false;
    if (filterOwner !== "ALL" && task.ownerType !== filterOwner) return false;
    if (filterAssignee !== "ALL" && task.assignee?.id !== filterAssignee) return false;
    if (filterClient !== "ALL" && task.client?.id !== filterClient) return false;
    return true;
  };

  const getClientDisplayName = (task: Task) => {
    if (!task.client) return "No Client";
    return task.client.nickname || task.client.name;
  };

  const getAgencyName = (task: Task) => {
    if (!task.client?.agencies || task.client.agencies.length === 0) return "No Agency";
    return task.client.agencies[0]?.agency?.name || "No Agency";
  };

  // For context-specific display names
  const clientDisplayName = client?.nickname || client?.name || "Client";
  const agencyDisplayName = client?.agencies?.[0]?.agency?.name || "Agency";

  // Sort categories by order
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  // Count active filters
  const activeFilterCount = [
    filterStatus !== "ALL",
    filterPriority !== "ALL",
    filterOwner !== "ALL",
    filterAssignee !== "ALL",
    filterClient !== "ALL",
    !hideCompleted,
  ].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("ALL");
    setFilterPriority("ALL");
    setFilterOwner("ALL");
    setFilterAssignee("ALL");
    setFilterClient("ALL");
    setHideCompleted(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: 8,
    fontSize: 14,
    background: theme.colors.bgPrimary,
    color: theme.colors.textPrimary,
  };

  const renderTaskRow = (task: Task, index: number) => {
    const canEdit = canEditTask(task); // Check if user can edit THIS specific task
    
    return (
      <>
      <tr key={task.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
        {/* Task Number & Name */}
        <td style={{ padding: "10px 12px", overflow: "hidden" }}>
          <div
            onClick={() => openTaskPanel(task)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 500,
              color: task.status === "COMPLETED" ? theme.colors.textMuted : theme.colors.textPrimary,
              textDecoration: task.status === "COMPLETED" ? "line-through" : "none",
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: theme.colors.textMuted,
            flexShrink: 0,
            minWidth: 20,
          }}>
            #{index + 1}
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.name}</span>
        </div>
      </td>

      {/* Assignee */}
      <td style={{ padding: "10px 12px", overflow: "hidden" }}>
        <select
          value={task.assigneeId || ""}
          onChange={(e) => updateTaskField(task.id, "assigneeId", e.target.value || null)}
          disabled={!canEdit}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid " + theme.colors.borderLight,
            fontSize: 12,
            background: canEdit ? "white" : theme.colors.bgTertiary,
            color: task.assigneeId ? theme.colors.textPrimary : theme.colors.textMuted,
            cursor: canEdit ? "pointer" : "not-allowed",
            outline: "none",
            maxWidth: "100%",
            opacity: canEdit ? 1 : 0.6,
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
      <td style={{ padding: "10px 12px", overflow: "hidden" }}>
        <select
          value={task.ownerType}
          onChange={(e) => updateTaskField(task.id, "ownerType", e.target.value)}
          disabled={!canEdit}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            fontWeight: 500,
            background: task.ownerType === "CLIENT" ? theme.colors.warningBg : theme.colors.infoBg,
            color: task.ownerType === "CLIENT" ? "#92400E" : theme.colors.info,
            cursor: canEdit ? "pointer" : "not-allowed",
            outline: "none",
            opacity: canEdit ? 1 : 0.6,
          }}
        >
          <option value="AGENCY">{context === "general" ? "Agency" : agencyDisplayName}</option>
          <option value="CLIENT">{context === "general" ? "Client" : clientDisplayName}</option>
        </select>
      </td>

      {/* Due Date */}
      <td style={{ padding: "10px 12px", overflow: "hidden" }}>
        <input
          type="date"
          value={task.dueDate ? task.dueDate.split("T")[0] : ""}
          onChange={(e) => updateTaskField(task.id, "dueDate", e.target.value || null)}
          disabled={!canEdit}
          style={{
            padding: "4px 8px",
            border: "1px solid transparent",
            borderRadius: 4,
            fontSize: 12,
            background: "transparent",
            cursor: canEdit ? "pointer" : "not-allowed",
            color: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" 
              ? theme.colors.error 
              : theme.colors.textSecondary,
            opacity: canEdit ? 1 : 0.6,
          }}
          onFocus={(e) => canEdit && (e.currentTarget.style.borderColor = theme.colors.borderMedium)}
          onBlur={(e) => e.currentTarget.style.borderColor = "transparent"}
        />
      </td>

      {/* Priority */}
      <td style={{ padding: "10px 12px", overflow: "hidden" }}>
        <select
          value={task.priority}
          onChange={(e) => updateTaskField(task.id, "priority", e.target.value)}
          disabled={!canEdit}
          style={{
            padding: "4px 8px",
            borderRadius: 20,
            border: "none",
            fontSize: 11,
            fontWeight: 500,
            background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
            color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textSecondary,
            cursor: canEdit ? "pointer" : "not-allowed",
            outline: "none",
            opacity: canEdit ? 1 : 0.6,
          }}
        >
          {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>

      {/* Status */}
      <td style={{ padding: "10px 12px", overflow: "hidden" }}>
        <select
          value={task.status}
          onChange={(e) => updateTaskField(task.id, "status", e.target.value)}
          disabled={!canEdit}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            fontWeight: 500,
            background: STATUS_STYLES[task.status]?.bg || theme.colors.bgTertiary,
            color: STATUS_STYLES[task.status]?.color || theme.colors.textSecondary,
            cursor: canEdit ? "pointer" : "not-allowed",
            outline: "none",
            width: "100%",
            opacity: canEdit ? 1 : 0.6,
          }}
        >
          {statusOptions.map(s => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </td>

      {/* Category */}
      <td style={{ padding: "10px 12px", overflow: "hidden" }}>
        <select
          value={task.categoryId || ""}
          onChange={(e) => updateTaskField(task.id, "categoryId", e.target.value || null)}
          disabled={!canEdit}
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid " + theme.colors.borderLight,
            fontSize: 12,
            background: canEdit ? "white" : theme.colors.bgTertiary,
            color: task.categoryId ? theme.colors.textPrimary : theme.colors.textMuted,
            cursor: canEdit ? "pointer" : "not-allowed",
            outline: "none",
            maxWidth: "100%",
            opacity: canEdit ? 1 : 0.6,
          }}
        >
          <option value="">None</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </td>

      {/* Client (only in general context) */}
      {showClientColumn && (
        <td style={{ padding: "10px 12px", overflow: "hidden" }}>
          <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
            {getClientDisplayName(task)}
          </div>
        </td>
      )}

      {/* Internal Link */}
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        {task.internalLink && (
          <a
            href={task.internalLink}
            target="_blank"
            rel="noopener noreferrer"
            title={task.internalLinkLabel || "Internal link"}
            style={{
              color: theme.colors.primary,
              fontSize: 16,
              textDecoration: "none",
              opacity: 0.8,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            🔗
          </a>
        )}
      </td>

      {/* Actions */}
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        {canDelete && (
          <button
            onClick={() => deleteTask(task.id)}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              background: "transparent",
              color: theme.colors.error,
              border: "1px solid " + theme.colors.borderLight,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        )}
      </td>
    </tr>
    </>
    );
  };

  const renderCategorySection = (categoryId: string | null, categoryName: string) => {
    const categoryTasks = smartSortTasks(
      tasks.filter(t => {
        const matchesCategory = categoryId ? t.categoryId === categoryId : !t.categoryId;
        return matchesCategory && matchesFilters(t);
      })
    );

    if (categoryTasks.length === 0) return null;

    const isCollapsed = collapsedCategories.has(categoryId || "uncategorized");

    return (
      <div key={categoryId || "uncategorized"} style={{ marginBottom: 32 }}>
        <div
          onClick={() => toggleCategoryCollapse(categoryId || "uncategorized")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div style={{
            fontSize: 20,
            fontWeight: 600,
            color: theme.colors.textPrimary,
          }}>
            {isCollapsed ? "▶" : "▼"} {categoryName} ({categoryTasks.length})
          </div>
          {canCreate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuickAddCategory(categoryId);
              }}
              style={{
                padding: "4px 12px",
                fontSize: 12,
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              + Add Task
            </button>
          )}
        </div>

        {!isCollapsed && (
          <>
            {quickAddCategory === categoryId && (
              <div style={{
                background: theme.colors.bgSecondary,
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addQuickTask(categoryId);
                        if (e.key === "Escape") {
                          setQuickAddCategory(null);
                          setQuickAddName("");
                        }
                      }}
                      placeholder="Enter task name..."
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid " + theme.colors.borderMedium,
                        borderRadius: 6,
                        fontSize: 14,
                      }}
                    />
                  </div>

                  {context === "general" && (
                    <div style={{ minWidth: 200 }}>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                        Client
                      </label>
                      <select
                        value={quickAddClient}
                        onChange={(e) => {
                          setQuickAddClient(e.target.value);
                          setQuickAddProject(""); // Reset project when client changes
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid " + theme.colors.borderMedium,
                          borderRadius: 6,
                          fontSize: 14,
                        }}
                      >
                        <option value="">Select Client...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nickname || c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ minWidth: 200 }}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                      Project
                    </label>
                    <select
                      value={quickAddProject}
                      onChange={(e) => setQuickAddProject(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid " + theme.colors.borderMedium,
                        borderRadius: 6,
                        fontSize: 14,
                      }}
                    >
                      <option value="">Select Project...</option>
                      {projects
                        .filter(p => !quickAddClient || p.clientId === quickAddClient)
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.isDefault && " (Default)"}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    onClick={() => addQuickTask(categoryId)}
                    style={{
                      padding: "8px 16px",
                      background: theme.colors.primary,
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setQuickAddCategory(null);
                      setQuickAddName("");
                    }}
                    style={{
                      padding: "8px 16px",
                      background: theme.colors.bgTertiary,
                      color: theme.colors.textSecondary,
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{
              background: theme.colors.bgSecondary,
              border: "1px solid " + theme.colors.borderLight,
              borderRadius: theme.borderRadius.lg,
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 140 }} />
                  {showClientColumn && <col style={{ width: 150 }} />}
                  <col style={{ width: 50 }} />
                  <col style={{ width: 80 }} />
                </colgroup>
                <thead>
                  <tr style={{ background: theme.colors.bgTertiary, borderBottom: "1px solid " + theme.colors.borderLight }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Task
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Assignee
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Owner
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Due Date
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Priority
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Status
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Category
                    </th>
                    {showClientColumn && (
                      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                        Client
                      </th>
                    )}
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Link
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTasks.map((task, index) => renderTaskRow(task, index))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderByClient = () => {
    const clientGroups = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      if (!matchesFilters(task)) return;
      
      const clientId = task.client?.id || "no-client";
      if (!clientGroups.has(clientId)) {
        clientGroups.set(clientId, []);
      }
      clientGroups.get(clientId)!.push(task);
    });

    if (clientGroups.size === 0) {
      return (
        <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
          No tasks match the current filters
        </div>
      );
    }

    return Array.from(clientGroups.entries()).map(([clientId, clientTasks]) => {
      const sortedClientTasks = smartSortTasks(clientTasks);
      const clientData = clients.find(c => c.id === clientId);
      const clientName = clientData?.nickname || clientData?.name || "No Client";
      const isCollapsed = collapsedClients.has(clientId);

      return (
        <div key={clientId} style={{ marginBottom: 32 }}>
          <div
            onClick={() => toggleClientCollapse(clientId)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{
              fontSize: 24,
              fontWeight: 600,
              color: theme.colors.textPrimary,
            }}>
              {isCollapsed ? "▶" : "▼"} {clientName} ({clientTasks.length})
            </div>
          </div>

          {!isCollapsed && (
            <div style={{
              background: theme.colors.bgSecondary,
              border: "1px solid " + theme.colors.borderLight,
              borderRadius: theme.borderRadius.lg,
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 50 }} />
                  <col style={{ width: 80 }} />
                </colgroup>
                <thead>
                  <tr style={{ background: theme.colors.bgTertiary, borderBottom: "1px solid " + theme.colors.borderLight }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Task
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Assignee
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Owner
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Due Date
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Priority
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Status
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Category
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Link
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClientTasks.map((task, index) => renderTaskRow(task, index))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return <TasksLoadingSkeleton />;
  }

  return (
    <>
      {/* Global Create Task Button & Quick Add */}
      {canCreate && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button
              onClick={() => {
                // Toggle the global quick add form
                setQuickAddCategory(quickAddCategory === "GLOBAL" ? null : "GLOBAL");
                setQuickAddName("");
              }}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {quickAddCategory === "GLOBAL" ? "✕ Cancel" : "+ Create Task"}
            </button>
          </div>

          {/* Global Quick Add Form */}
          {quickAddCategory === "GLOBAL" && (
            <div style={{
              background: theme.colors.bgSecondary,
              border: "1px solid " + theme.colors.borderLight,
              borderRadius: 8,
              padding: 16,
              marginBottom: 8,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Task Name <span style={{ color: theme.colors.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && quickAddName.trim()) {
                        addQuickTask(null); // null = uncategorized
                      }
                      if (e.key === "Escape") {
                        setQuickAddCategory(null);
                        setQuickAddName("");
                      }
                    }}
                    placeholder="Enter task name..."
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid " + theme.colors.borderMedium,
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                </div>

                {context === "general" && (
                  <div style={{ minWidth: 200 }}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                      Client <span style={{ color: theme.colors.error }}>*</span>
                    </label>
                    <select
                      value={quickAddClient}
                      onChange={(e) => {
                        setQuickAddClient(e.target.value);
                        setQuickAddProject(""); // Reset project when client changes
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid " + theme.colors.borderMedium,
                        borderRadius: 6,
                        fontSize: 14,
                      }}
                    >
                      <option value="">Select Client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nickname || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ minWidth: 200 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Project <span style={{ color: theme.colors.error }}>*</span>
                  </label>
                  <select
                    value={quickAddProject}
                    onChange={(e) => setQuickAddProject(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid " + theme.colors.borderMedium,
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  >
                    <option value="">Select Project...</option>
                    {projects
                      .filter(p => !quickAddClient || p.clientId === quickAddClient)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.isDefault && " (Default)"}
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  onClick={() => addQuickTask(null)}
                  disabled={!quickAddName.trim() || !quickAddProject}
                  style={{
                    padding: "8px 16px",
                    background: (!quickAddName.trim() || !quickAddProject) ? theme.colors.bgTertiary : theme.colors.primary,
                    color: (!quickAddName.trim() || !quickAddProject) ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: (!quickAddName.trim() || !quickAddProject) ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  Add Task
                </button>
                <button
                  onClick={() => {
                    setQuickAddCategory(null);
                    setQuickAddName("");
                  }}
                  style={{
                    padding: "8px 16px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
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
              {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
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
              {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
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

          {context === "general" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Client:</label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid " + theme.colors.borderLight,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nickname || client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            <>
              <div style={{ marginLeft: "auto", fontSize: 13, color: theme.colors.textMuted }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </div>
              <button
                onClick={clearFilters}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "1px solid " + theme.colors.borderMedium,
                  background: theme.colors.bgPrimary,
                  color: theme.colors.primary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tasks Display */}
      {context === "general" ? (
        renderByClient()
      ) : (
        <>
          {sortedCategories.map(cat => renderCategorySection(cat.id, cat.name))}
          {renderCategorySection(null, "Uncategorized")}
        </>
      )}

      {/* Edit Task Side Panel */}
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
            width: "min(600px, 90vw)",
            background: theme.colors.bgPrimary,
            boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
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
                    {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Priority</label>
                  <select value={editForm.priority || ""} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} style={inputStyle}>
                    {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
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
