"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
};

type TaskCategory = {
  id: string;
  name: string;
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "ONGOING", "ON_HOLD", "COMPLETED", "FUTURE_PLAN"];
const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"];

export default function ClientTasksPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", notes: "", status: "PENDING", priority: "MEDIUM", dueDate: "", categoryId: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients/" + clientId).then(res => res.json()),
      fetch("/api/clients/" + clientId + "/tasks").then(res => res.json()),
      fetch("/api/task-categories").then(res => res.json()),
    ]).then(([clientData, tasksData, categoriesData]) => {
      setClient(clientData);
      setTasks(tasksData);
      setCategories(categoriesData);
      setLoading(false);
    });
  }, [clientId]);

  async function fetchTasks() {
    const res = await fetch("/api/clients/" + clientId + "/tasks");
    const data = await res.json();
    setTasks(data);
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
      setNewTask({ name: "", notes: "", status: "PENDING", priority: "MEDIUM", dueDate: "", categoryId: "" });
      setShowForm(false);
      fetchTasks();
    }
    setAdding(false);
  }

  async function updateTaskStatus(taskId: string, status: string) {
    await fetch("/api/clients/" + clientId + "/tasks/" + taskId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
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
    outline: "none",
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={"/clients/" + clientId} style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to {client?.name}
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Tasks</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage tasks for {client?.name}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: theme.gradients.primary,
            color: "white",
            padding: "12px 24px",
            borderRadius: theme.borderRadius.md,
            border: "none",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
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
                  <input
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    required
                    style={inputStyle}
                    placeholder="Enter task name"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Status</label>
                    <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
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
                <button type="submit" disabled={adding} style={{
                  padding: "10px 20px",
                  background: adding ? theme.colors.bgTertiary : theme.colors.primary,
                  color: adding ? theme.colors.textMuted : "white",
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: adding ? "not-allowed" : "pointer"
                }}>
                  {adding ? "Adding..." : "Add Task"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: "10px 20px",
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textSecondary,
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer"
                }}>
                  Cancel
                </button>
              </div>
            </form>
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
              <thead>
                <tr style={{ background: theme.colors.bgPrimary }}>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Task</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Category</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Due Date</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Priority</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map((task) => (
                  <tr key={task.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{task.name}</div>
                      {task.notes && <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>{task.notes}</div>}
                    </td>
                    <td style={{ padding: 12 }}>
                      {task.category ? (
                        <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{task.category.name}</span>
                      ) : (
                        <span style={{ color: theme.colors.textMuted }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: 12, fontSize: 13, color: theme.colors.textSecondary }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                        background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
                        color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textSecondary
                      }}>
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid " + theme.colors.borderLight,
                        fontSize: 12,
                        background: STATUS_STYLES[task.status]?.bg || theme.colors.bgTertiary,
                        color: STATUS_STYLES[task.status]?.color || theme.colors.textSecondary,
                        cursor: "pointer"
                      }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      <button onClick={() => deleteTask(task.id)} style={{
                        padding: "4px 10px",
                        background: theme.colors.errorBg,
                        color: theme.colors.error,
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: "pointer"
                      }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.colors.textMuted }}>Completed ({completedTasks.length})</h3>
            </div>
            <div>
              {completedTasks.map((task, idx) => (
                <div key={task.id} style={{
                  padding: "12px 20px",
                  borderBottom: idx < completedTasks.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ color: theme.colors.textMuted, textDecoration: "line-through" }}>{task.name}</span>
                  <button onClick={() => deleteTask(task.id)} style={{
                    padding: "4px 10px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textMuted,
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer"
                  }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
