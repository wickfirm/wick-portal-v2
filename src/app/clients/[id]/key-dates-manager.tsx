"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

type KeyDate = {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  isRecurring: boolean;
  category: string;
  color: string | null;
  notes: string | null;
};

type Template = {
  id: string;
  name: string;
  region: string;
  date: string;
  category: string;
  color: string | null;
};

const CATEGORIES = [
  { value: "HOLIDAY", label: "Holiday", color: "#f59e0b" },
  { value: "RELIGIOUS", label: "Religious", color: "#8b5cf6" },
  { value: "CAMPAIGN", label: "Campaign", color: "#ec4899" },
  { value: "EVENT", label: "Event", color: "#06b6d4" },
  { value: "OTHER", label: "Other", color: "#6b7280" },
];

const getCategoryColor = (category: string) => {
  return CATEGORIES.find((c) => c.value === category)?.color || "#6b7280";
};

export default function KeyDatesManager({ clientId }: { clientId: string }) {
  const [keyDates, setKeyDates] = useState<KeyDate[]>([]);
  const [templates, setTemplates] = useState<Record<string, Template[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    date: "",
    endDate: "",
    isRecurring: true,
    category: "HOLIDAY",
    color: "",
    notes: "",
  });

  useEffect(() => {
    fetchKeyDates();
    fetchTemplates();
  }, [clientId]);

  async function fetchKeyDates() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/key-dates`);
      const data = await res.json();
      setKeyDates(
        data.map((kd: any) => ({
          ...kd,
          date: kd.date?.split("T")[0] || "",
          endDate: kd.endDate?.split("T")[0] || null,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch key dates:", error);
    }
    setLoading(false);
  }

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/key-date-templates");
      const data = await res.json();
      setTemplates(data.grouped || {});
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  }

  function resetForm() {
    setForm({
      name: "",
      date: "",
      endDate: "",
      isRecurring: true,
      category: "HOLIDAY",
      color: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(kd: KeyDate) {
    setForm({
      name: kd.name,
      date: kd.date,
      endDate: kd.endDate || "",
      isRecurring: kd.isRecurring,
      category: kd.category,
      color: kd.color || "",
      notes: kd.notes || "",
    });
    setEditingId(kd.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    setSaving(true);

    const payload = {
      name: form.name,
      date: form.date,
      endDate: form.endDate || null,
      isRecurring: form.isRecurring,
      category: form.category,
      color: form.color || null,
      notes: form.notes || null,
    };

    try {
      if (editingId) {
        await fetch(`/api/clients/${clientId}/key-dates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/clients/${clientId}/key-dates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchKeyDates();
    } catch (error) {
      console.error("Failed to save key date:", error);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this key date?")) return;

    try {
      await fetch(`/api/clients/${clientId}/key-dates/${id}`, {
        method: "DELETE",
      });
      fetchKeyDates();
    } catch (error) {
      console.error("Failed to delete key date:", error);
    }
  }

  async function applyTemplate(region: string) {
    if (!confirm(`Apply ${region} template? This will add key dates for the current year.`)) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/key-dates/apply-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, year: new Date().getFullYear() }),
      });
      const data = await res.json();
      alert(`Added ${data.created} key dates (${data.skipped} already existed)`);
      fetchKeyDates();
      setShowTemplates(false);
    } catch (error) {
      console.error("Failed to apply template:", error);
    }
  }

  // Group key dates by month
  const groupedByMonth = keyDates.reduce((acc, kd) => {
    const d = new Date(kd.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(kd);
    return acc;
  }, {} as Record<string, KeyDate[]>);

  const sortedMonths = Object.keys(groupedByMonth).sort();

  const inputStyle = {
    padding: "10px 14px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
        Loading key dates...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: 4,
            }}
          >
            Key Dates
          </h3>
          <p style={{ fontSize: 13, color: theme.colors.textMuted, margin: 0 }}>
            Holidays, events, and important dates for this client
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              padding: "10px 16px",
              background: showTemplates ? theme.colors.bgTertiary : "white",
              color: showTemplates ? theme.colors.textSecondary : theme.colors.primary,
              border: `1px solid ${theme.colors.primary}`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {showTemplates ? "Close Templates" : "Apply Template"}
          </button>
          <button
            onClick={() => {
              if (showForm && !editingId) {
                resetForm();
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            style={{
              padding: "10px 16px",
              background: showForm && !editingId ? theme.colors.bgTertiary : theme.gradients.primary,
              color: showForm && !editingId ? theme.colors.textSecondary : "white",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {showForm && !editingId ? "Cancel" : "+ Add Key Date"}
          </button>
        </div>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div
          style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h4 style={{ margin: 0, marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
            Regional Templates
          </h4>
          {Object.keys(templates).length === 0 ? (
            <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              No templates available. Contact admin to add templates.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {Object.entries(templates).map(([region, items]) => (
                <button
                  key={region}
                  onClick={() => applyTemplate(region)}
                  style={{
                    padding: "12px 20px",
                    background: "white",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{region}</div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                    {items.length} dates
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div
          style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: 14,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h4 style={{ margin: 0, marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
            {editingId ? "Edit Key Date" : "Add New Key Date"}
          </h4>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Qatar National Day"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  Custom Color
                </label>
                <input
                  type="color"
                  value={form.color || getCategoryColor(form.category)}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  style={{
                    width: 44,
                    height: 44,
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: 2,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14 }}>Recurring yearly</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={saving || !form.name.trim() || !form.date}
                style={{
                  padding: "12px 24px",
                  background:
                    saving || !form.name.trim() || !form.date
                      ? theme.colors.bgTertiary
                      : theme.gradients.primary,
                  color: saving || !form.name.trim() || !form.date ? theme.colors.textMuted : "white",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: saving || !form.name.trim() || !form.date ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : editingId ? "Update" : "Add Key Date"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "12px 24px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Key Dates List */}
      {keyDates.length === 0 ? (
        <div
          style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: 14,
            padding: 48,
            textAlign: "center",
            color: theme.colors.textMuted,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No key dates yet</div>
          <div style={{ fontSize: 13 }}>Add important dates or apply a regional template</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sortedMonths.map((monthKey) => {
            const [year, month] = monthKey.split("-");
            const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            });

            return (
              <div
                key={monthKey}
                style={{
                  background: theme.colors.bgSecondary,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 20px",
                    background: theme.colors.bgPrimary,
                    borderBottom: `1px solid ${theme.colors.borderLight}`,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {monthName}
                </div>
                <div>
                  {groupedByMonth[monthKey].map((kd, idx) => {
                    const color = kd.color || getCategoryColor(kd.category);
                    const d = new Date(kd.date);

                    return (
                      <div
                        key={kd.id}
                        style={{
                          padding: "14px 20px",
                          borderBottom:
                            idx < groupedByMonth[monthKey].length - 1
                              ? `1px solid ${theme.colors.bgTertiary}`
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        {/* Date badge */}
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 10,
                            background: `${color}15`,
                            border: `1px solid ${color}30`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 600, color, textTransform: "uppercase" }}>
                            {d.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary }}>
                            {d.getDate()}
                          </div>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: theme.colors.textPrimary,
                              marginBottom: 4,
                            }}
                          >
                            {kd.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 500,
                                background: `${color}18`,
                                color,
                              }}
                            >
                              {kd.category}
                            </span>
                            {kd.isRecurring && (
                              <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
                                🔄 Recurring
                              </span>
                            )}
                            {kd.endDate && (
                              <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
                                → {new Date(kd.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {kd.notes && (
                            <div style={{ marginTop: 4, fontSize: 12, color: theme.colors.textMuted }}>
                              {kd.notes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => startEdit(kd)}
                            style={{
                              padding: "6px 12px",
                              background: theme.colors.infoBg || theme.colors.bgTertiary,
                              color: theme.colors.info,
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
                            onClick={() => handleDelete(kd.id)}
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
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
