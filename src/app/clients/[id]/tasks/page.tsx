"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
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
const OWNER_OPTIONS = ["AGENCY", "CLIENT"];

export default function ClientTasksPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { data: session } = useSession();
  const user = session?.user as any;

  const [client, setClient] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterOwner, setFilterOwner] = useState<string>("ALL");
  const [hideCompleted, setHideCompleted] = useState(true);
  
  // Side panel state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Quick add state per category
  const [quickAddCategory, setQuickAddCategory] = useState<string | null>(null);
  const [quickAddName, setQuickAddName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/clients/" + clientId).then(res => res.json()),
      fetch("/api/clients/" + clientId + "/tasks").then(res => res.json()),
      fetch("/api/task-categories").then(res => res.json()),
      fetch("/api/users").then(res => res.json()),
    ]).then(([clientData, tasksData, categoriesData, usersData]) => {
      setClient(clientData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load data:", err);
      setLoading(false);
    });
  }, [clientId]);

  async function fetchTasks() {
    const res = await fetch("/api/clients/" + clientId + "/tasks");
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
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

  async function updateTaskField(taskId: string, field: string, value: any) {
    await fetch("/api/tasks/" + taskId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    fetchTasks();
  }

  async function quickAddTask(categoryId: string) {
    if (!quickAddName.trim()) return;
    
    await fetch("/api/clients/" + clientId + "/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: quickAddName,
        categoryId: categoryId || null,
        status: "PENDING",
        priority: "MEDIUM",
        ownerType: "AGENCY",
      }),
    });
    
    setQuickAddName("");
    setQuickAddCategory(null);
    fetchTasks();
  }

  function openTaskPanel(task: Task) {
    setSelectedTask(task);
    setEditForm({
      name: task.name,
      notes: task.notes || "",
      nextSteps: task.nextSteps || "",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      externalLink: task.externalLink || "",
      externalLinkLabel: task.externalLinkLabel || "",
      internalLink: task.internalLink || "",
      internalLinkLabel: task.internalLinkLabel || "",
      categoryId: task.category?.id || "",
      ownerType: task.ownerType || "AGENCY",
      assigneeId: task.assigneeId || "",
    });
  }

  async function saveTaskDetails() {
    if (!selectedTask) return;
    setSaving(true);
    
    await fetch("/api/tasks/" + selectedTask.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    
    setSaving(false);
    setSelectedTask(null);
    fetchTasks();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await fetch("/api/tasks/" + taskId, { method: "DELETE" });
    if (selectedTask?.id === taskId) setSelectedTask(null);
    fetchTasks();
  }

  // Get owner display name
  function getOwnerDisplay(task: Task) {
    if (task.ownerType === "CLIENT") {
      return task.client?.nickname || client?.nickname || client?.name || "Client";
    } else {
      const agencyName = task.client?.agencies?.[0]?.agency?.name || client?.agencies?.[0]?.agency?.name;
      return agencyName || "Agency";
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (hideCompleted && task.status === "COMPLETED") return false;
    if (filterStatus !== "ALL" && task.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && task.priority !== filterPriority) return false;
    if (filterOwner !== "ALL" && task.ownerType !== filterOwner) return false;
    return true;
  });

  // Group tasks by category
  const groupedTasks: Record<string, Task[]> = {};
  const uncategorized: Task[] = [];
  
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

  // Sort categories by order
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  // Count active filters
  const activeFilterCount = [
    filterStatus !== "ALL",
    filterPriority !== "ALL",
    filterOwner !== "ALL",
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

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

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
          <option value="AGENCY">{agencyDisplayName}</option>
          <option value="CLIENT">{clientDisplayName}</option>
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
          onFocus={(e) => e.target.style.borderColor = theme.colors.borderMedium}
          onBlur={(e) => e.target.style.borderColor = "transparent"}
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

      {/* Notes/Links Preview */}
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

      {/* External Link */}
      <td style={{ padding: "10px 12px", width: 70 }}>
        {task.externalLink ? (
          <a href={task.externalLink} target="_blank" rel="noopener noreferrer" style={{
            padding: "4px 8px",
            background: theme.colors.successBg,
            color: theme.colors.success,
            borderRadius: 4,
            fontSize: 10,
            textDecoration: "none",
            fontWeight: 500,
          }}>
            {task.externalLinkLabel || "Client"}
          </a>
        ) : (
          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>-</span>
        )}
      </td>

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
    const categoryName = category?.name || "Other";
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
              <div style={{ padding: "12px 16px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", gap: 8 }}>
                <input
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder="Task name..."
                  autoFocus
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") quickAddTask(category?.id || "");
                    if (e.key === "Escape") { setQuickAddCategory(null); setQuickAddName(""); }
                  }}
                />
                <button onClick={() => quickAddTask(category?.id || "")} style={{ padding: "10px 20px", background: theme.colors.primary, color: "white", border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer" }}>Add</button>
                <button onClick={() => { setQuickAddCategory(null); setQuickAddName(""); }} style={{ padding: "10px 16px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
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
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" }}>Client</th>
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
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={"/clients/" + clientId} style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to {client?.name}
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Tasks</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
              {client?.name} {client?.nickname && `(${client.nickname})`} • {filteredTasks.length} tasks shown
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          background: theme.colors.bgSecondary, 
          padding: 16, 
          borderRadius: 12, 
          border: "1px solid " + theme.colors.borderLight,
          marginBottom: 24,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}:
          </span>

          {/* Owner Filter */}
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid " + theme.colors.borderMedium,
              fontSize: 13,
              cursor: "pointer",
              background: filterOwner !== "ALL" ? theme.colors.successBg : "white",
            }}
          >
            <option value="ALL">All Owners</option>
            <option value="AGENCY">{agencyDisplayName}</option>
            <option value="CLIENT">{clientDisplayName}</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid " + theme.colors.borderMedium,
              fontSize: 13,
              cursor: "pointer",
              background: filterStatus !== "ALL" ? theme.colors.infoBg : "white",
            }}
          >
            <option value="ALL">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid " + theme.colors.borderMedium,
              fontSize: 13,
              cursor: "pointer",
              background: filterPriority !== "ALL" ? theme.colors.warningBg : "white",
            }}
          >
            <option value="ALL">All Priorities</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Hide Completed Toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: theme.colors.textSecondary, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Hide completed
          </label>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setFilterStatus("ALL");
                setFilterPriority("ALL");
                setFilterOwner("ALL");
                setHideCompleted(true);
              }}
              style={{
                padding: "8px 12px",
                background: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Categories with Tasks */}
        {sortedCategories.map(category => {
          const categoryTasks = groupedTasks[category.id] || [];
          if (categoryTasks.length === 0 && quickAddCategory !== category.id) return null;
          return renderCategorySection(category, categoryTasks);
        })}

        {/* Uncategorized */}
        {(uncategorized.length > 0 || quickAddCategory === "uncategorized") && 
          renderCategorySection(null, uncategorized)
        }

        {/* Empty State */}
        {filteredTasks.length === 0 && tasks.length > 0 && (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            padding: 48, 
            borderRadius: 12, 
            textAlign: "center",
            border: "1px solid " + theme.colors.borderLight 
          }}>
            <p style={{ color: theme.colors.textMuted, marginBottom: 16 }}>No tasks match your filters</p>
            <button
              onClick={() => {
                setFilterStatus("ALL");
                setFilterPriority("ALL");
                setFilterOwner("ALL");
                setHideCompleted(false);
              }}
              style={{
                padding: "12px 24px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Clear all filters
            </button>
          </div>
        )}

        {tasks.length === 0 && (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            padding: 48, 
            borderRadius: 12, 
            textAlign: "center",
            border: "1px solid " + theme.colors.borderLight 
          }}>
            <p style={{ color: theme.colors.textMuted, marginBottom: 16 }}>No tasks yet</p>
            <button
              onClick={() => setQuickAddCategory("uncategorized")}
              style={{
                padding: "12px 24px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              + Add First Task
            </button>
          </div>
        )}

        {/* Add Uncategorized Task */}
        {tasks.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => setQuickAddCategory("uncategorized")}
              style={{
                padding: "10px 20px",
                background: theme.colors.bgSecondary,
                color: theme.colors.textSecondary,
                border: "1px dashed " + theme.colors.borderMedium,
                borderRadius: 8,
                fontWeight: 500,
                cursor: "pointer",
                width: "100%",
              }}
            >
              + Add Task (Uncategorized)
            </button>
          </div>
        )}
      </main>

      {/* Side Panel */}
      {selectedTask && (
        <>
          {/* Overlay */}
          <div 
            onClick={() => setSelectedTask(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 999,
            }}
          />
          
          {/* Panel */}
          <div style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 480,
            height: "100vh",
            background: theme.colors.bgSecondary,
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
            zIndex: 1000,
            overflow: "auto",
          }}>
            {/* Panel Header */}
            <div style={{ 
              padding: "20px 24px", 
              borderBottom: "1px solid " + theme.colors.borderLight,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: theme.colors.bgPrimary,
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Edit Task</h3>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: theme.colors.textMuted,
                }}
              >
                ×
              </button>
            </div>

            {/* Panel Body */}
            <div style={{ padding: 24 }}>
              {/* Task Name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Task Name</label>
                <input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Category & Owner */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Category</label>
                  <select
                    value={editForm.categoryId || ""}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Owner</label>
                  <select
                    value={editForm.ownerType || "AGENCY"}
                    onChange={(e) => setEditForm({ ...editForm, ownerType: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="AGENCY">{agencyDisplayName}</option>
                    <option value="CLIENT">{clientDisplayName}</option>
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Assigned To</label>
                <select
                  value={editForm.assigneeId || ""}
                  onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value || null })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Unassigned</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Due Date</label>
                <input
                  type="date"
                  value={editForm.dueDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Notes / Links</label>
                <textarea
                  value={editForm.notes || ""}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Add notes, context, or links..."
                />
              </div>

              {/* Next Steps */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Next Steps</label>
                <textarea
                  value={editForm.nextSteps || ""}
                  onChange={(e) => setEditForm({ ...editForm, nextSteps: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="What needs to happen next?"
                />
              </div>

              {/* Client Link */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Client Link (External)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8 }}>
                  <input
                    value={editForm.externalLink || ""}
                    onChange={(e) => setEditForm({ ...editForm, externalLink: e.target.value })}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                  <input
                    value={editForm.externalLinkLabel || ""}
                    onChange={(e) => setEditForm({ ...editForm, externalLinkLabel: e.target.value })}
                    placeholder="Label"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Internal Link */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 13, color: theme.colors.textSecondary }}>Internal Link</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8 }}>
                  <input
                    value={editForm.internalLink || ""}
                    onChange={(e) => setEditForm({ ...editForm, internalLink: e.target.value })}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                  <input
                    value={editForm.internalLinkLabel || ""}
                    onChange={(e) => setEditForm({ ...editForm, internalLinkLabel: e.target.value })}
                    placeholder="Label"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={saveTaskDetails}
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
                  onClick={() => deleteTask(selectedTask.id)}
                  style={{
                    padding: "12px 20px",
                    background: theme.colors.errorBg,
                    color: theme.colors.error,
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
