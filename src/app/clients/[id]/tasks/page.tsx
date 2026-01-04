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
  status: string;
  priority: string;
  dueDate: string | null;
  category: { id: string; name: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
};

type TaskCategory = { id: string; name: string };
type TeamMember = { id: string; name: string | null; email: string };

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "BLOCKED"];
const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"];

export default function ClientTasksPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", notes: "", status: "TODO", priority: "MEDIUM", dueDate: "", categoryId: "", assigneeId: "" });
  const [adding, setAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ name: "", notes: "", status: "", priority: "", dueDate: "", categoryId: "", assigneeId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients/" + clientId).then(res => res.json()),
      fetch("/api/clients/" + clientId + "/tasks").then(res => res.json()),
      fetch("/api/task-categories").then(res => res.json()),
      fetch("/api/team").then(res => res.json()),
    ]).then(([clientData, tasksData, categoriesData, teamData]) => {
      setClient(clientData);
      setTasks(tasksData);
      setCategories(categoriesData);
      setTeamMembers(teamData);
      setLoading(false);
    });
  }, [clientId]);

  async function fetchTasks() {
    const res = await fetch("/api/clients/" + clientId + "/tasks");
    setTasks(await res.json());
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/clients/" + clientId + "/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });
    if (res.ok) {
      setNewTask({ name: "", notes: "", status: "TODO", priority: "MEDIUM", dueDate: "", categoryId: "", assigneeId: "" });
      setShowForm(false);
      fetchTasks();
    } else {
      alert((await res.json()).error || "Failed to add task");
    }
    setAdding(false);
  }

  function startEdit(task: Task) {
    setEditingTask(task);
    setEditForm({
      name: task.name,
      notes: task.notes || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      categoryId: task.category?.id || "",
      assigneeId: task.assignee?.id || ""
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTask) return;
    setSaving(true);
    const res = await fetch("/api/clients/" + clientId + "/tasks/" + editingTask.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditingTask(null);
      fetchTasks();
    } else {
      alert((await res.json()).error || "Failed to update task");
    }
    setSaving(false);
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await fetch("/api/clients/" + clientId + "/tasks/" + taskId, { method: "DELETE" });
    fetchTasks();
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    boxSizing: "border-box" as const,
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");

  const TaskRow = ({ task }: { task: Task }) => (
    <tr style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
      <td style={{ padding: 12 }}>
        <div style={{ fontWeight: 500, color: task.status === "COMPLETED" ? theme.colors.textMuted : theme.colors.textPrimary, textDecoration: task.status === "COMPLETED" ? "line-through" : "none" }}>{task.name}</div>
        {task.notes && <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>{task.notes}</div>}
      </td>
      <td style={{ padding: 12, fontSize: 13, color: theme.colors.textSecondary }}>{task.category?.name || "-"}</td>
      <td style={{ padding: 12 }}>
        {task.assignee ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: theme.gradients.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 600 }}>
              {(task.assignee.name || task.assignee.email).charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{task.assignee.name || task.assignee.email}</span>
          </div>
        ) : <span style={{ color: theme.colors.textMuted }}>-</span>}
      </td>
      <td style={{ padding: 12, fontSize: 13, color: theme.colors.textSecondary }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</td>
      <td style={{ padding: 12 }}>
        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary, color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textSecondary }}>{task.priority}</span>
      </td>
      <td style={{ padding: 12 }}>
        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: STATUS_STYLES[task.status]?.bg || theme.colors.bgTertiary, color: STATUS_STYLES[task.status]?.color || theme.colors.textSecondary }}>{task.status.replace(/_/g, " ")}</span>
      </td>
      <td style={{ padding: 12, textAlign: "right" }}>
        <button onClick={() => startEdit(task)} style={{ padding: "4px 10px", background: theme.colors.infoBg, color: theme.colors.info, border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer", marginRight: 8 }}>Edit</button>
        <button onClick={() => deleteTask(task.id)} style={{ padding: "4px 10px", background: theme.colors.errorBg, color: theme.colors.error, border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Delete</button>
      </td>
    </tr>
  );

  const TableHeader = () => (
    <thead>
      <tr style={{ background: theme.colors.bgPrimary }}>
        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Task</th>
        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Category</th>
        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Assignee</th>
        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Due Date</th>
        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Priority</th>
        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Status</th>
        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Actions</th>
      </tr>
    </thead>
  );

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header userName={currentUser?.name} userRole={currentUser?.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={"/clients/" + clientId} style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>← Back to {client?.name}</Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Tasks</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage tasks for {client?.name}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: theme.gradients.primary, color: "white", padding: "12px 24px", borderRadius: theme.borderRadius.md, border: "none", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>+</span> Add Task
          </button>
        </div>

        {/* Add Task Form */}
        {showForm && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>New Task</h3>
            <form onSubmit={addTask}>
              <div style={{ display: "grid", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Task Name *</label>
                  <input value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} required style={inputStyle} placeholder="Enter task name" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Status</label>
                    <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Priority</label>
                    <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Category</label>
                    <select value={newTask.categoryId} onChange={(e) => setNewTask({ ...newTask, categoryId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">None</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Assignee</label>
                    <select value={newTask.assigneeId} onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Unassigned</option>
                      {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Due Date</label>
                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Notes</label>
                  <textarea value={newTask.notes} onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Optional notes" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={adding} style={{ padding: "10px 20px", background: adding ? theme.colors.bgTertiary : theme.colors.primary, color: adding ? theme.colors.textMuted : "white", border: "none", borderRadius: theme.borderRadius.md, fontWeight: 500, fontSize: 14, cursor: adding ? "not-allowed" : "pointer" }}>{adding ? "Adding..." : "Add Task"}</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: theme.borderRadius.md, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 32, borderRadius: theme.borderRadius.xl, width: "100%", maxWidth: 600, boxShadow: theme.shadows.lg }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 0, marginBottom: 24, color: theme.colors.textPrimary }}>Edit Task</h2>
              <form onSubmit={saveEdit}>
                <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Task Name *</label>
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Status</label>
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Priority</label>
                      <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                        {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Category</label>
                      <select value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="">None</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Due Date</label>
                      <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Assignee</label>
                    <select value={editForm.assigneeId} onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Unassigned</option>
                      {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Notes</label>
                    <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setEditingTask(null)} style={{ padding: "12px 24px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: theme.borderRadius.md, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding: "12px 24px", background: saving ? theme.colors.bgTertiary : theme.colors.primary, color: saving ? theme.colors.textMuted : "white", border: "none", borderRadius: theme.borderRadius.md, fontWeight: 500, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Tasks */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>Active Tasks ({pendingTasks.length})</h3>
          </div>
          {pendingTasks.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted, fontSize: 14 }}>No active tasks</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <TableHeader />
              <tbody>{pendingTasks.map(task => <TaskRow key={task.id} task={task} />)}</tbody>
            </table>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.colors.textMuted }}>Completed ({completedTasks.length})</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <TableHeader />
              <tbody>{completedTasks.map(task => <TaskRow key={task.id} task={task} />)}</tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
