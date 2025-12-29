"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Task = {
  id: string;
  name: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  dueDate: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "IN_PROGRESS" | "ONGOING" | "ON_HOLD" | "COMPLETED" | "FUTURE_PLAN";
  notes: string | null;
  nextSteps: string | null;
  externalLink: string | null;
  externalLinkLabel: string | null;
  internalLink: string | null;
  internalLinkLabel: string | null;
};

type Category = {
  id: string;
  name: string;
};

const PRIORITY_COLORS = {
  HIGH: { bg: "#ffebee", color: "#c62828" },
  MEDIUM: { bg: "#fff3e0", color: "#ef6c00" },
  LOW: { bg: "#e8f5e9", color: "#2e7d32" },
};

const STATUS_COLORS = {
  PENDING: { bg: "#fff3e0", color: "#ef6c00" },
  IN_PROGRESS: { bg: "#e3f2fd", color: "#1976d2" },
  ONGOING: { bg: "#e8f5e9", color: "#2e7d32" },
  ON_HOLD: { bg: "#fce4ec", color: "#c2185b" },
  COMPLETED: { bg: "#e8f5e9", color: "#2e7d32" },
  FUTURE_PLAN: { bg: "#f3e5f5", color: "#7b1fa2" },
};

export default function ClientTasksPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");

  // New task form
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", categoryId: "", priority: "MEDIUM", status: "PENDING" });
  const [adding, setAdding] = useState(false);

  // Edit modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [clientId]);

  async function fetchData() {
    setLoading(true);
    const [tasksRes, categoriesRes, clientRes] = await Promise.all([
      fetch(`/api/clients/${clientId}/tasks`),
      fetch("/api/task-categories"),
      fetch(`/api/clients/${clientId}`),
    ]);

    const tasksData = await tasksRes.json();
    const categoriesData = await categoriesRes.json();
    const clientData = await clientRes.json();

    setTasks(tasksData);
    setCategories(categoriesData);
    setClientName(clientData.name || "");
    setLoading(false);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.name.trim()) return;
    setAdding(true);

    const res = await fetch(`/api/clients/${clientId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });

    if (res.ok) {
      setNewTask({ name: "", categoryId: "", priority: "MEDIUM", status: "PENDING" });
      setShowForm(false);
      fetchData();
    }
    setAdding(false);
  }

  async function updateTask() {
    if (!editingTask) return;

    await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    setEditingTask(null);
    fetchData();
  }

  async function deleteTask(task: Task) {
    if (!confirm(`Delete "${task.name}"?`)) return;

    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    fetchData();
  }

  async function quickUpdateStatus(task: Task, status: string) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  // Group tasks by category
  const groupedTasks = categories.map(cat => ({
    category: cat,
    tasks: tasks.filter(t => t.categoryId === cat.id),
  }));

  const uncategorizedTasks = tasks.filter(t => !t.categoryId);

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Clients</Link>
            <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
            <Link href="/analytics" style={{ color: "#666", textDecoration: "none" }}>Analytics</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/clients/${clientId}`} style={{ color: "#666", textDecoration: "none" }}>← Back to {clientName}</Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Weekly Tasks - {clientName}</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer" }}
          >
            + Add Task
          </button>
        </div>

        {showForm && (
          <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>New Task</h3>
            <form onSubmit={addTask}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <input
                  placeholder="Task name"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                  required
                />
                <select
                  value={newTask.categoryId}
                  onChange={(e) => setNewTask({ ...newTask, categoryId: e.target.value })}
                  style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                >
                  <option value="">No Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FUTURE_PLAN">Future Plan</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={adding} style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                  {adding ? "Adding..." : "Add Task"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task Table */}
        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                <th style={{ padding: 12, borderBottom: "2px solid #eee", width: "20%" }}>Category</th>
                <th style={{ padding: 12, borderBottom: "2px solid #eee", width: "25%" }}>Task</th>
                <th style={{ padding: 12, borderBottom: "2px solid #eee", width: "10%" }}>Priority</th>
                <th style={{ padding: 12, borderBottom: "2px solid #eee", width: "12%" }}>Status</th>
                <th style={{ padding: 12, borderBottom: "2px solid #eee", width: "20%" }}>Notes / Links</th>
                <th style={{ padding: 12, borderBottom: "2px solid #eee", width: "13%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedTasks.map(group => (
                group.tasks.length > 0 && group.tasks.map((task, idx) => (
                  <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                    {idx === 0 && (
                      <td rowSpan={group.tasks.length} style={{ padding: 12, fontWeight: 600, background: "#f9f9f9", verticalAlign: "top" }}>
                        {group.category.name}
                      </td>
                    )}
                    <td style={{ padding: 12 }}>{task.name}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: PRIORITY_COLORS[task.priority].bg,
                        color: PRIORITY_COLORS[task.priority].color
                      }}>
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <select
                        value={task.status}
                        onChange={(e) => quickUpdateStatus(task, e.target.value)}
                        style={{ 
                          padding: "4px 8px", borderRadius: 4, fontSize: 12, border: "none", cursor: "pointer",
                          background: STATUS_COLORS[task.status].bg,
                          color: STATUS_COLORS[task.status].color
                        }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FUTURE_PLAN">Future Plan</option>
                      </select>
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      {task.notes && <div style={{ marginBottom: 4 }}>{task.notes}</div>}
                      {task.externalLink && (
                        <a href={task.externalLink} target="_blank" style={{ color: "#1976d2", marginRight: 8 }}>
                          {task.externalLinkLabel || "Link"} ↗
                        </a>
                      )}
                      {task.internalLink && (
                        <a href={task.internalLink} target="_blank" style={{ color: "#7b1fa2" }}>
                          {task.internalLinkLabel || "Internal"} ↗
                        </a>
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => { setEditingTask(task); setEditForm(task); }}
                        style={{ padding: "4px 8px", marginRight: 4, background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task)}
                        style={{ padding: "4px 8px", background: "#fee", color: "#c00", border: "none", borderRadius: 4, cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              ))}

              {uncategorizedTasks.length > 0 && uncategorizedTasks.map((task, idx) => (
                <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                  {idx === 0 && (
                    <td rowSpan={uncategorizedTasks.length} style={{ padding: 12, fontWeight: 600, background: "#f9f9f9", verticalAlign: "top", color: "#888" }}>
                      Uncategorized
                    </td>
                  )}
                  <td style={{ padding: 12 }}>{task.name}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ 
                      padding: "4px 8px", borderRadius: 4, fontSize: 12,
                      background: PRIORITY_COLORS[task.priority].bg,
                      color: PRIORITY_COLORS[task.priority].color
                    }}>
                      {task.priority}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <select
                      value={task.status}
                      onChange={(e) => quickUpdateStatus(task, e.target.value)}
                      style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12, border: "none", cursor: "pointer",
                        background: STATUS_COLORS[task.status].bg,
                        color: STATUS_COLORS[task.status].color
                      }}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="FUTURE_PLAN">Future Plan</option>
                    </select>
                  </td>
                  <td style={{ padding: 12, fontSize: 13 }}>
                    {task.notes && <div style={{ marginBottom: 4 }}>{task.notes}</div>}
                    {task.externalLink && (
                      <a href={task.externalLink} target="_blank" style={{ color: "#1976d2", marginRight: 8 }}>
                        {task.externalLinkLabel || "Link"} ↗
                      </a>
                    )}
                    {task.internalLink && (
                      <a href={task.internalLink} target="_blank" style={{ color: "#7b1fa2" }}>
                        {task.internalLinkLabel || "Internal"} ↗
                      </a>
                    )}
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => { setEditingTask(task); setEditForm(task); }}
                      style={{ padding: "4px 8px", marginRight: 4, background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task)}
                      style={{ padding: "4px 8px", background: "#fee", color: "#c00", border: "none", borderRadius: 4, cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}

              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: "center", color: "#888" }}>
                    No tasks yet. Click "+ Add Task" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Edit Modal */}
      {editingTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8, width: 500, maxHeight: "90vh", overflow: "auto" }}>
            <h2 style={{ marginTop: 0 }}>Edit Task</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Task Name</label>
              <input
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Category</label>
                <select
                  value={editForm.categoryId || ""}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value || null })}
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                >
                  <option value="">No Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Due Date</label>
                <input
                  type="date"
                  value={editForm.dueDate?.split("T")[0] || ""}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value || null })}
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Priority</label>
                <select
                  value={editForm.priority || "MEDIUM"}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Status</label>
                <select
                  value={editForm.status || "PENDING"}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FUTURE_PLAN">Future Plan</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Notes</label>
              <textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={2}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Next Steps</label>
              <textarea
                value={editForm.nextSteps || ""}
                onChange={(e) => setEditForm({ ...editForm, nextSteps: e.target.value })}
                rows={2}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>External Link</label>
                <input
                  value={editForm.externalLink || ""}
                  onChange={(e) => setEditForm({ ...editForm, externalLink: e.target.value })}
                  placeholder="https://..."
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>External Link Label</label>
                <input
                  value={editForm.externalLinkLabel || ""}
                  onChange={(e) => setEditForm({ ...editForm, externalLinkLabel: e.target.value })}
                  placeholder="Client Sheet"
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Internal Link (Kitchen)</label>
                <input
                  value={editForm.internalLink || ""}
                  onChange={(e) => setEditForm({ ...editForm, internalLink: e.target.value })}
                  placeholder="https://..."
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Internal Link Label</label>
                <input
                  value={editForm.internalLinkLabel || ""}
                  onChange={(e) => setEditForm({ ...editForm, internalLinkLabel: e.target.value })}
                  placeholder="Kitchen Link"
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={updateTask} style={{ flex: 1, padding: 12, background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                Save Changes
              </button>
              <button onClick={() => setEditingTask(null)} style={{ padding: 12, background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
