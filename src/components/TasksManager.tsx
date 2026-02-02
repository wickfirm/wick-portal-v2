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
  const [allProjects, setAllProjects] = useState<any[]>([]);
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
  
  // Watch state
  const [watchedTaskIds, setWatchedTaskIds] = useState<Set<string>>(new Set());
  const [filterWatched, setFilterWatched] = useState(false);
  const [taskWatchers, setTaskWatchers] = useState<any[]>([]);

  // Dynamic status and priority options from API
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<string[]>([]);

  // Timer state
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [startingTimerFor, setStartingTimerFor] = useState<string | null>(null);

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

        // Fetch all projects for the "Move to Project" dropdown in edit panel
        try {
          const allProjectsRes = await fetch("/api/projects");
          const allProjectsData = await allProjectsRes.json();
          setAllProjects(Array.isArray(allProjectsData) ? allProjectsData : []);
        } catch { setAllProjects([]); }

        // Fetch watched task IDs + active timer
        fetchWatchedTasks();
        fetchActiveTimer();

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

    // Listen for timer events from FloatingTimerBubble/TimerWidget
    const onTimerStarted = (e: any) => {
      const detail = e.detail;
      setActiveTimerTaskId(detail?.task?.id || null);
    };
    const onTimerStopped = () => setActiveTimerTaskId(null);
    window.addEventListener("timer-started", onTimerStarted);
    window.addEventListener("timer-stopped", onTimerStopped);
    return () => {
      window.removeEventListener("timer-started", onTimerStarted);
      window.removeEventListener("timer-stopped", onTimerStopped);
    };
  }, [context, clientId, projectId]);

  async function fetchTasks() {
    const res = await fetch(getTasksEndpoint());
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : data.tasks || []);
  }

  async function fetchWatchedTasks() {
    try {
      const res = await fetch("/api/tasks/watched");
      if (res.ok) {
        const data = await res.json();
        setWatchedTaskIds(new Set(data.taskIds));
      }
    } catch (error) {
      console.error("Error fetching watched tasks:", error);
    }
  }

  async function toggleWatch(taskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/watchers`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setWatchedTaskIds(prev => {
          const next = new Set(prev);
          if (data.watching) {
            next.add(taskId);
          } else {
            next.delete(taskId);
          }
          return next;
        });
      }
    } catch (error) {
      console.error("Error toggling watch:", error);
    }
  }

  async function fetchTaskWatchers(taskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/watchers`);
      if (res.ok) {
        const data = await res.json();
        setTaskWatchers(data.watchers || []);
      }
    } catch (error) {
      console.error("Error fetching task watchers:", error);
    }
  }

  // Timer: fetch current active timer on mount
  async function fetchActiveTimer() {
    try {
      const res = await fetch("/api/timer");
      if (res.ok) {
        const data = await res.json();
        setActiveTimerTaskId(data.timer?.task?.id || null);
      }
    } catch {}
  }

  // Timer: start timer for a task (one-click from task row)
  async function startTimerForTask(task: Task) {
    if (!task.client?.id || !task.projectId) return;
    setStartingTimerFor(task.id);
    try {
      const res = await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: task.client.id,
          projectId: task.projectId,
          taskId: task.id,
          description: task.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTimerTaskId(task.id);
        // Notify FloatingTimerBubble + TimerWidget
        window.dispatchEvent(new CustomEvent("timer-started", { detail: data.timer || data }));
      } else {
        const err = await res.json();
        if (err.error?.includes("already")) {
          alert("You already have an active timer. Stop it first before starting a new one.");
        }
      }
    } catch (error) {
      console.error("Error starting timer:", error);
    }
    setStartingTimerFor(null);
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
    setTaskWatchers([]); // Reset
    fetchTaskWatchers(task.id); // Load watchers for this task
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
    if (filterWatched && !watchedTaskIds.has(task.id)) return false;
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
    filterWatched,
  ].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("ALL");
    setFilterPriority("ALL");
    setFilterOwner("ALL");
    setFilterAssignee("ALL");
    setFilterClient("ALL");
    setHideCompleted(true);
    setFilterWatched(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid " + theme.colors.borderLight,
    borderRadius: 10,
    fontSize: 14,
    background: theme.colors.bgPrimary,
    color: theme.colors.textPrimary,
    outline: "none",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box" as const,
  };

  const renderTaskRow = (task: Task, index: number) => {
    const canEdit = canEditTask(task); // Check if user can edit THIS specific task
    
    return (
      <>
      <tr
        key={task.id}
        style={{ borderBottom: "1px solid " + theme.colors.bgTertiary, transition: "background 0.12s ease" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.bgPrimary)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {/* Task Number & Name */}
        <td style={{ padding: "10px 12px" }}>
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
      <td style={{ padding: "10px 12px" }}>
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
            width: "100%",
            boxSizing: "border-box" as const,
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
      <td style={{ padding: "10px 12px" }}>
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
            width: "100%",
            boxSizing: "border-box" as const,
            opacity: canEdit ? 1 : 0.6,
          }}
        >
          <option value="AGENCY">{context === "general" ? "Agency" : agencyDisplayName}</option>
          <option value="CLIENT">{context === "general" ? "Client" : clientDisplayName}</option>
        </select>
      </td>

      {/* Due Date */}
      <td style={{ padding: "10px 12px" }}>
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
            width: "100%",
            boxSizing: "border-box" as const,
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
      <td style={{ padding: "10px 12px" }}>
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
            width: "100%",
            boxSizing: "border-box" as const,
            opacity: canEdit ? 1 : 0.6,
          }}
        >
          {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>

      {/* Status */}
      <td style={{ padding: "10px 12px" }}>
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
            boxSizing: "border-box" as const,
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
      <td style={{ padding: "10px 12px" }}>
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
            width: "100%",
            boxSizing: "border-box" as const,
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
        <td style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: theme.colors.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

      {/* Timer */}
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        {task.client?.id && task.projectId && task.status !== "COMPLETED" ? (
          activeTimerTaskId === task.id ? (
            <span
              title="Timer running on this task"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "#fee2e2",
                animation: "timerPulse 1.5s ease-in-out infinite",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); startTimerForTask(task); }}
              disabled={startingTimerFor === task.id || activeTimerTaskId !== null}
              title={activeTimerTaskId ? "Stop current timer first" : "Start timer for this task"}
              style={{
                background: "transparent",
                border: "none",
                cursor: activeTimerTaskId ? "not-allowed" : "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: activeTimerTaskId ? theme.colors.textMuted : theme.colors.success,
                opacity: startingTimerFor === task.id ? 0.5 : activeTimerTaskId ? 0.25 : 0.5,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!activeTimerTaskId) e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = startingTimerFor === task.id ? "0.5" : activeTimerTaskId ? "0.25" : "0.5";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </button>
          )
        ) : (
          <span style={{ color: theme.colors.textMuted, opacity: 0.2, fontSize: 11 }}>—</span>
        )}
      </td>

      {/* Watch */}
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <button
          onClick={(e) => { e.stopPropagation(); toggleWatch(task.id); }}
          title={watchedTaskIds.has(task.id) ? "Unwatch task" : "Watch task"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: watchedTaskIds.has(task.id) ? theme.colors.primary : theme.colors.textMuted,
            opacity: watchedTaskIds.has(task.id) ? 1 : 0.4,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = watchedTaskIds.has(task.id) ? "1" : "0.4")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={watchedTaskIds.has(task.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </td>

      {/* Actions */}
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        {canDelete && (
          <button
            onClick={() => deleteTask(task.id)}
            title="Delete task"
            style={{
              padding: 4,
              background: "transparent",
              color: theme.colors.textMuted,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              opacity: 0.5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.colors.error;
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.colors.textMuted;
              e.currentTarget.style.opacity = "0.5";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
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
      <div key={categoryId || "uncategorized"} style={{ marginBottom: 28 }}>
        <div
          onClick={() => toggleCategoryCollapse(categoryId || "uncategorized")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            marginBottom: 12,
            cursor: "pointer",
            userSelect: "none",
            background: theme.colors.bgSecondary,
            borderRadius: 10,
            border: "1px solid " + theme.colors.borderLight,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.bgPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.background = theme.colors.bgSecondary)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              transition: "transform 200ms ease",
              transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
              display: "inline-flex",
              alignItems: "center",
              color: theme.colors.textMuted,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: theme.colors.textPrimary,
            }}>
              {categoryName}
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: theme.colors.textMuted,
              background: theme.colors.bgTertiary,
              padding: "2px 8px",
              borderRadius: 10,
            }}>
              {categoryTasks.length}
            </span>
          </div>
          {canCreate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuickAddCategory(categoryId);
              }}
              style={{
                padding: "5px 14px",
                fontSize: 12,
                background: theme.gradients.primary,
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
                boxShadow: theme.shadows.button,
                transition: "all 0.15s ease",
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
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgTertiary, borderBottom: "1px solid " + theme.colors.borderLight }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, minWidth: 180 }}>
                      Task
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 130 }}>
                      Assignee
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 90 }}>
                      Owner
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 115 }}>
                      Due Date
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 100 }}>
                      Priority
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 120 }}>
                      Status
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 120 }}>
                      Category
                    </th>
                    {showClientColumn && (
                      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 120 }}>
                        Client
                      </th>
                    )}
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 44 }}>
                      Link
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 40 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 44 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 70 }}>
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
        <div key={clientId} style={{ marginBottom: 28 }}>
          <div
            onClick={() => toggleClientCollapse(clientId)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              marginBottom: 12,
              cursor: "pointer",
              userSelect: "none",
              background: theme.colors.bgSecondary,
              borderRadius: 10,
              border: "1px solid " + theme.colors.borderLight,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.bgPrimary)}
            onMouseLeave={(e) => (e.currentTarget.style.background = theme.colors.bgSecondary)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                transition: "transform 200ms ease",
                transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
                display: "inline-flex",
                alignItems: "center",
                color: theme.colors.textMuted,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <div style={{
                fontSize: 18,
                fontWeight: 600,
                color: theme.colors.textPrimary,
              }}>
                {clientName}
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: theme.colors.textMuted,
                background: theme.colors.bgTertiary,
                padding: "2px 8px",
                borderRadius: 10,
              }}>
                {clientTasks.length}
              </span>
            </div>
          </div>

          {!isCollapsed && (
            <div style={{
              background: theme.colors.bgSecondary,
              border: "1px solid " + theme.colors.borderLight,
              borderRadius: theme.borderRadius.lg,
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgTertiary, borderBottom: "1px solid " + theme.colors.borderLight }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, minWidth: 180 }}>
                      Task
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 130 }}>
                      Assignee
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 90 }}>
                      Owner
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 115 }}>
                      Due Date
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 100 }}>
                      Priority
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 120 }}>
                      Status
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 120 }}>
                      Category
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 44 }}>
                      Link
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 40 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 44 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, width: 70 }}>
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
      <style>{`@keyframes timerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
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
                padding: "10px 22px",
                fontSize: 13,
                background: quickAddCategory === "GLOBAL" ? theme.colors.bgTertiary : theme.gradients.primary,
                color: quickAddCategory === "GLOBAL" ? theme.colors.textSecondary : "white",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 500,
                boxShadow: quickAddCategory === "GLOBAL" ? "none" : theme.shadows.button,
                transition: "all 0.15s ease",
              }}
            >
              {quickAddCategory === "GLOBAL" ? "Cancel" : "+ Create Task"}
            </button>
          </div>

          {/* Global Quick Add Form */}
          {quickAddCategory === "GLOBAL" && (
            <div style={{
              background: theme.colors.bgSecondary,
              border: "1px solid " + theme.colors.borderLight,
              borderRadius: 14,
              padding: 20,
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
                    padding: "8px 18px",
                    background: (!quickAddName.trim() || !quickAddProject) ? theme.colors.bgTertiary : theme.gradients.primary,
                    color: (!quickAddName.trim() || !quickAddProject) ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: 10,
                    cursor: (!quickAddName.trim() || !quickAddProject) ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    whiteSpace: "nowrap" as const,
                    boxShadow: (!quickAddName.trim() || !quickAddProject) ? "none" : theme.shadows.button,
                    transition: "all 0.15s ease",
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
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {/* Filter dropdowns with consistent styling */}
          {[
            { label: "Status", value: filterStatus, setter: setFilterStatus, options: statusOptions.map(s => ({ value: s, label: s.replace(/_/g, " ") })) },
            { label: "Priority", value: filterPriority, setter: setFilterPriority, options: priorityOptions.map(p => ({ value: p, label: p })) },
            { label: "Owner", value: filterOwner, setter: setFilterOwner, options: [{ value: "AGENCY", label: "Agency" }, { value: "CLIENT", label: "Client" }] },
            { label: "Assignee", value: filterAssignee, setter: setFilterAssignee, options: users.map(u => ({ value: u.id, label: u.name || u.email })) },
          ].map(({ label, value, setter, options }) => (
            <div key={label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.03em" }}>{label}</label>
              <select
                value={value}
                onChange={(e) => setter(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid " + (value !== "ALL" ? theme.colors.primary : theme.colors.borderLight),
                  background: value !== "ALL" ? `${theme.colors.primary}08` : theme.colors.bgPrimary,
                  fontSize: 13,
                  fontWeight: value !== "ALL" ? 500 : 400,
                  color: value !== "ALL" ? theme.colors.primary : theme.colors.textSecondary,
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <option value="ALL">All</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}

          {context === "general" && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.03em" }}>Client</label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid " + (filterClient !== "ALL" ? theme.colors.primary : theme.colors.borderLight),
                  background: filterClient !== "ALL" ? `${theme.colors.primary}08` : theme.colors.bgPrimary,
                  fontSize: 13,
                  fontWeight: filterClient !== "ALL" ? 500 : 400,
                  color: filterClient !== "ALL" ? theme.colors.primary : theme.colors.textSecondary,
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.15s ease",
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

          <div style={{ width: 1, height: 24, background: theme.colors.borderLight, margin: "0 2px" }} />

          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: hideCompleted ? "none" : "1px solid " + theme.colors.borderLight,
              background: hideCompleted ? theme.gradients.primary : "transparent",
              color: hideCompleted ? "white" : theme.colors.textSecondary,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Hide Done
          </button>

          <button
            onClick={() => setFilterWatched(!filterWatched)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: filterWatched ? "none" : "1px solid " + theme.colors.borderLight,
              background: filterWatched ? theme.gradients.primary : "transparent",
              color: filterWatched ? "white" : theme.colors.textSecondary,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={filterWatched ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Watched
          </button>

          {activeFilterCount > 0 && (
            <>
              <div style={{ marginLeft: "auto", fontSize: 12, color: theme.colors.textMuted, fontWeight: 500 }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </div>
              <button
                onClick={clearFilters}
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  border: "none",
                  background: theme.colors.errorBg,
                  color: theme.colors.error,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Clear
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
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 999,
            }}
          />
          <div style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(600px, 90vw)",
            background: theme.colors.bgSecondary,
            boxShadow: theme.shadows.lg,
            zIndex: 1000,
            overflowY: "auto",
            padding: 32,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          }}>
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, margin: 0, color: theme.colors.textPrimary }}>Edit Task</h2>
                {selectedTask && selectedTask.client?.id && selectedTask.projectId && selectedTask.status !== "COMPLETED" && (
                  activeTimerTaskId === selectedTask.id ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        borderRadius: 20,
                        background: "#fee2e2",
                        color: "#ef4444",
                        fontSize: 11,
                        fontWeight: 600,
                        animation: "timerPulse 1.5s ease-in-out infinite",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                      </svg>
                      Timer Running
                    </span>
                  ) : (
                    <button
                      onClick={() => startTimerForTask(selectedTask)}
                      disabled={activeTimerTaskId !== null || startingTimerFor === selectedTask.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 14px",
                        borderRadius: 20,
                        border: "none",
                        background: activeTimerTaskId ? theme.colors.bgTertiary : theme.colors.success,
                        color: activeTimerTaskId ? theme.colors.textMuted : "white",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: activeTimerTaskId ? "not-allowed" : "pointer",
                        transition: "all 0.15s",
                        opacity: activeTimerTaskId ? 0.5 : 1,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="6,3 20,12 6,21" />
                      </svg>
                      {startingTimerFor === selectedTask.id ? "Starting..." : activeTimerTaskId ? "Timer Active" : "Start Timer"}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={closeTaskPanel}
                style={{
                  background: theme.colors.bgTertiary,
                  border: "none",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: theme.colors.textMuted,
                  fontSize: 18,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.errorBg;
                  e.currentTarget.style.color = theme.colors.error;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.colors.bgTertiary;
                  e.currentTarget.style.color = theme.colors.textMuted;
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
                  {(() => {
                    // Group all projects by client for easy navigation
                    const projectList = allProjects.length > 0 ? allProjects : projects;
                    const grouped: Record<string, { clientName: string; projects: any[] }> = {};
                    projectList.forEach((p: any) => {
                      const cName = p.client?.nickname || p.client?.name || "No Client";
                      const cId = p.client?.id || p.clientId || "none";
                      if (!grouped[cId]) grouped[cId] = { clientName: cName, projects: [] };
                      grouped[cId].projects.push(p);
                    });
                    const entries = Object.entries(grouped);
                    if (entries.length <= 1) {
                      // Single client — flat list
                      return projectList.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.isDefault ? " (Default)" : ""}
                        </option>
                      ));
                    }
                    // Multiple clients — grouped
                    return entries.map(([cId, group]) => (
                      <optgroup key={cId} label={group.clientName}>
                        {group.projects.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}{p.isDefault ? " (Default)" : ""}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>

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

              {/* Watchers Section */}
              <div style={{
                background: theme.colors.bgTertiary,
                borderRadius: 10,
                padding: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Watchers ({taskWatchers.length})
                  </label>
                  {selectedTask && (
                    <button
                      onClick={() => toggleWatch(selectedTask.id)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: watchedTaskIds.has(selectedTask.id) ? theme.colors.bgSecondary : theme.colors.primary,
                        color: watchedTaskIds.has(selectedTask.id) ? theme.colors.textSecondary : "white",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {watchedTaskIds.has(selectedTask.id) ? "Unwatch" : "Watch"}
                    </button>
                  )}
                </div>
                {taskWatchers.length === 0 ? (
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                    No one is watching this task
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {taskWatchers.map((w: any) => (
                      <div key={w.userId} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        background: theme.colors.bgSecondary,
                        borderRadius: 6,
                      }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: theme.colors.primary,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}>
                          {(w.name || w.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{w.name || "Unknown"}</div>
                          <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{w.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={closeTaskPanel}
                  style={{
                    padding: "10px 22px",
                    background: theme.colors.bgPrimary,
                    color: theme.colors.textSecondary,
                    border: "1px solid " + theme.colors.borderLight,
                    borderRadius: 10,
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveTask}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "10px 24px",
                    background: saving ? theme.colors.bgTertiary : theme.gradients.primary,
                    color: saving ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: saving ? "none" : theme.shadows.button,
                    transition: "all 0.15s ease",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
