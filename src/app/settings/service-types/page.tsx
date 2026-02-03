"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type ServiceType = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
};

const ICON_OPTIONS = ["🔍", "🤖", "💻", "📢", "📱", "✍️", "🎨", "💼", "📊", "🎯", "🚀", "⚡", "🔧", "📈", "🎬", "📝"];
const COLOR_OPTIONS = ["#10B981", "#6366F1", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#F97316", "#14B8A6", "#EF4444", "#06B6D4", "#84CC16", "#D946EF"];

export default function ServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState({ name: "", icon: "🔍", color: "#6B7280" });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", icon: "", color: "" });
  const [error, setError] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  async function fetchServiceTypes() {
    const res = await fetch("/api/service-types");
    const data = await res.json();
    setServiceTypes(data);
    setLoading(false);
  }

  async function addServiceType(e: React.FormEvent) {
    e.preventDefault();
    if (!newType.name.trim()) return;
    setAdding(true);
    setError("");

    const res = await fetch("/api/service-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newType),
    });

    if (res.ok) {
      setNewType({ name: "", icon: "🔍", color: "#6B7280" });
      fetchServiceTypes();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to add");
    }
    setAdding(false);
  }

  async function deleteServiceType(id: string) {
    if (!confirm("Delete this service type? This cannot be undone.")) return;
    setError("");

    const res = await fetch("/api/service-types/" + id, { method: "DELETE" });
    if (res.ok) {
      fetchServiceTypes();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to delete");
    }
  }

  async function toggleActive(st: ServiceType) {
    await fetch("/api/service-types/" + st.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !st.isActive }),
    });
    fetchServiceTypes();
  }

  function startEdit(st: ServiceType) {
    setEditingId(st.id);
    setEditForm({ name: st.name, icon: st.icon, color: st.color });
  }

  async function saveEdit(id: string) {
    setError("");
    const res = await fetch("/api/service-types/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditingId(null);
      fetchServiceTypes();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to update");
    }
  }

  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  async function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIndex = serviceTypes.findIndex(st => st.id === draggedId);
    const targetIndex = serviceTypes.findIndex(st => st.id === targetId);

    const newServiceTypes = [...serviceTypes];
    const [removed] = newServiceTypes.splice(draggedIndex, 1);
    newServiceTypes.splice(targetIndex, 0, removed);

    setServiceTypes(newServiceTypes);
    setDraggedId(null);
    setDragOverId(null);

    // Save new order
    await fetch("/api/service-types/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newServiceTypes.map(st => st.id) }),
    });
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
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
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>Service Types</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage the services your agency offers. These appear when creating projects.</p>
        </div>

        {error && (
          <div style={{ background: theme.colors.errorBg, color: theme.colors.error, padding: "12px 16px", borderRadius: theme.borderRadius.md, marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Add Service Type Form */}
        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Add New Service Type</h3>
          <form onSubmit={addServiceType} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name</label>
              <input
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                placeholder="e.g., Email Marketing"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <div style={{ width: 80 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Icon</label>
              <select
                value={newType.icon}
                onChange={(e) => setNewType({ ...newType, icon: e.target.value })}
                style={{ ...inputStyle, width: "100%", cursor: "pointer" }}
              >
                {ICON_OPTIONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <div style={{ width: 60 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Color</label>
              <input
                type="color"
                value={newType.color}
                onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                style={{ width: 44, height: 44, border: "1px solid " + theme.colors.borderMedium, borderRadius: 8, cursor: "pointer", padding: 2 }}
              />
            </div>
            <button type="submit" disabled={adding || !newType.name.trim()} style={{
              padding: "12px 24px",
              background: adding || !newType.name.trim() ? theme.colors.bgTertiary : theme.colors.primary,
              color: adding || !newType.name.trim() ? theme.colors.textMuted : "white",
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontWeight: 500,
              fontSize: 14,
              cursor: adding || !newType.name.trim() ? "not-allowed" : "pointer",
            }}>
              {adding ? "Adding..." : "Add Service Type"}
            </button>
          </form>
        </div>

        {/* Service Types List */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>
              Service Types ({serviceTypes.length})
            </h3>
            <span style={{ fontSize: 12, color: theme.colors.textMuted }}>
              Used in project creation & stage templates
            </span>
          </div>

          {serviceTypes.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted, fontSize: 14 }}>
              No service types defined. Add one above to get started.
            </div>
          ) : (
            <div>
              {serviceTypes.map((st, idx) => (
                <div
                  key={st.id}
                  draggable={editingId !== st.id}
                  onDragStart={() => handleDragStart(st.id)}
                  onDragOver={(e) => handleDragOver(e, st.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(st.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    padding: "16px 20px",
                    borderBottom: idx < serviceTypes.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                    opacity: draggedId === st.id ? 0.5 : st.isActive ? 1 : 0.5,
                    cursor: editingId === st.id ? "default" : "grab",
                    background: dragOverId === st.id ? theme.colors.primaryBg || "rgba(118,82,124,0.08)" : draggedId === st.id ? theme.colors.bgTertiary : "transparent",
                    transition: "background 0.15s ease",
                  }}>
                  {editingId === st.id ? (
                    /* Edit Mode */
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        style={{ ...inputStyle, flex: 1, minWidth: 180 }}
                      />
                      <select
                        value={editForm.icon}
                        onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                        style={{ ...inputStyle, width: 70, cursor: "pointer" }}
                      >
                        {ICON_OPTIONS.map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        style={{ width: 36, height: 36, border: "1px solid " + theme.colors.borderMedium, borderRadius: 6, cursor: "pointer", padding: 2 }}
                      />
                      <button onClick={() => saveEdit(st.id)} style={{
                        padding: "8px 16px", background: theme.colors.primary, color: "white",
                        border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer",
                      }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{
                        padding: "8px 16px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary,
                        border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer",
                      }}>Cancel</button>
                    </div>
                  ) : (
                    /* View Mode */
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ color: theme.colors.textMuted, cursor: "grab", flexShrink: 0 }} title="Drag to reorder">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>
                        </div>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: st.color + "18",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                        }}>
                          {st.icon || "•"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 2 }}>{st.name}</div>
                          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                            slug: {st.slug}
                            {!st.isActive && (
                              <span style={{
                                marginLeft: 8,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: theme.colors.warningBg,
                                color: theme.colors.warning,
                                fontSize: 11,
                              }}>INACTIVE</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          onClick={() => toggleActive(st)}
                          style={{
                            padding: "6px 12px",
                            background: st.isActive ? theme.colors.successBg : theme.colors.bgTertiary,
                            color: st.isActive ? theme.colors.success : theme.colors.textMuted,
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          {st.isActive ? "Active" : "Inactive"}
                        </button>
                        <button
                          onClick={() => startEdit(st)}
                          style={{
                            padding: "6px 12px",
                            background: theme.colors.primaryBg || theme.colors.bgTertiary,
                            color: theme.colors.primary,
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteServiceType(st.id)}
                          style={{
                            padding: "6px 12px",
                            background: theme.colors.errorBg,
                            color: theme.colors.error,
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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
