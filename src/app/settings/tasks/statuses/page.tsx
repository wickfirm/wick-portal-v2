"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type TaskStatus = {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
};

export default function TaskStatusesPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState({ name: "", color: "#6B7280" });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStatuses(); }, []);

  async function fetchStatuses() {
    const res = await fetch("/api/task-statuses");
    setStatuses(await res.json());
    setLoading(false);
  }

  async function addStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatus.name.trim()) return;
    setAdding(true);
    const res = await fetch("/api/task-statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStatus),
    });
    if (res.ok) {
      setNewStatus({ name: "", color: "#6B7280" });
      fetchStatuses();
    }
    setAdding(false);
  }

  function startEdit(status: TaskStatus) {
    setEditingId(status.id);
    setEditForm({ name: status.name, color: status.color });
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim()) return;
    setSaving(true);
    await fetch("/api/task-statuses/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    fetchStatuses();
    setSaving(false);
  }

  async function setDefault(id: string) {
    await fetch("/api/task-statuses/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    fetchStatuses();
  }

  async function deleteStatus(id: string) {
    if (!confirm("Delete this status? Tasks using it will keep their current status.")) return;
    await fetch("/api/task-statuses/" + id, { method: "DELETE" });
    fetchStatuses();
  }

  const inputStyle = {
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    outline: "none",
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header userName={currentUser?.name} userRole={currentUser?.role} />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings/tasks" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>← Back to Task Settings</Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Task Statuses</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Configure task status options and their colors.</p>
        </div>

        {/* Add Status Form */}
        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Add New Status</h3>
          <form onSubmit={addStatus} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Status Name</label>
              <input value={newStatus.name} onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })} placeholder="e.g., Pending Review" style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Color</label>
              <input type="color" value={newStatus.color} onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })} style={{ width: 50, height: 42, padding: 4, border: "1px solid " + theme.colors.borderMedium, borderRadius: theme.borderRadius.md, cursor: "pointer" }} />
            </div>
            <button type="submit" disabled={adding || !newStatus.name.trim()} style={{
              padding: "12px 24px",
              background: adding || !newStatus.name.trim() ? theme.colors.bgTertiary : theme.colors.primary,
              color: adding || !newStatus.name.trim() ? theme.colors.textMuted : "white",
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontWeight: 500,
              fontSize: 14,
              cursor: adding || !newStatus.name.trim() ? "not-allowed" : "pointer",
            }}>
              {adding ? "Adding..." : "Add Status"}
            </button>
          </form>
        </div>

        {/* Statuses List */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>Statuses ({statuses.length})</h3>
          </div>

          {statuses.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted, fontSize: 14 }}>No statuses defined</div>
          ) : (
            <div>
              {statuses.map((status, idx) => (
                <div key={status.id} style={{
                  padding: "16px 20px",
                  borderBottom: idx < statuses.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  {editingId === status.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ ...inputStyle, flex: 1 }} autoFocus />
                      <input type="color" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} style={{ width: 40, height: 38, padding: 2, border: "1px solid " + theme.colors.borderMedium, borderRadius: 4, cursor: "pointer" }} />
                      <button onClick={() => saveEdit(status.id)} disabled={saving} style={{ padding: "8px 16px", background: theme.colors.primary, color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{saving ? "..." : "Save"}</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: "8px 16px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: status.color }} />
                        <span style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{status.name.replace(/_/g, " ")}</span>
                        {status.isDefault && <span style={{ fontSize: 11, padding: "2px 8px", background: theme.colors.successBg, color: theme.colors.success, borderRadius: 10 }}>Default</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {!status.isDefault && <button onClick={() => setDefault(status.id)} style={{ padding: "6px 12px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Set Default</button>}
                        <button onClick={() => startEdit(status)} style={{ padding: "6px 12px", background: theme.colors.infoBg, color: theme.colors.info, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => deleteStatus(status.id)} style={{ padding: "6px 12px", background: theme.colors.errorBg, color: theme.colors.error, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
