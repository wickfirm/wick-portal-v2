"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type Template = {
  id: string;
  name: string;
  region: string;
  date: string;
  isRecurring: boolean;
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

const REGIONS = ["GCC", "Islamic", "Global", "Levant", "Europe", "Americas", "Asia"];

const getCategoryColor = (category: string) => {
  return CATEGORIES.find((c) => c.value === category)?.color || "#6b7280";
};

export default function KeyDateTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Template[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    region: "GCC",
    date: "",
    isRecurring: true,
    category: "HOLIDAY",
    color: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/key-date-templates");
      const data = await res.json();
      setTemplates(data.templates || []);
      setGrouped(data.grouped || {});
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
    setLoading(false);
  }

  function resetForm() {
    setForm({
      name: "",
      region: "GCC",
      date: "",
      isRecurring: true,
      category: "HOLIDAY",
      color: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(t: Template) {
    setForm({
      name: t.name,
      region: t.region,
      date: t.date,
      isRecurring: t.isRecurring,
      category: t.category,
      color: t.color || "",
    });
    setEditingId(t.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    setSaving(true);

    const payload = {
      name: form.name,
      region: form.region,
      date: form.date,
      isRecurring: form.isRecurring,
      category: form.category,
      color: form.color || null,
    };

    try {
      if (editingId) {
        await fetch(`/api/key-date-templates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/key-date-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;

    try {
      await fetch(`/api/key-date-templates/${id}`, { method: "DELETE" });
      fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  }

  const user = session?.user as any;
  const isAdmin = user && ["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role);

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 48, color: theme.colors.textMuted }}>
            Loading...
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 48, color: theme.colors.error }}>
            Access denied. Admin only.
          </div>
        </main>
      </div>
    );
  }

  const inputStyle = {
    padding: "10px 14px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 28,
              fontWeight: 400,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Key Date Templates
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
            Manage regional templates that can be applied to client calendars
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {Object.entries(grouped).map(([region, items]) => (
            <div
              key={region}
              onClick={() => setExpandedRegion(expandedRegion === region ? null : region)}
              style={{
                padding: 16,
                background: expandedRegion === region ? `${theme.colors.primary}08` : theme.colors.bgSecondary,
                border: `1px solid ${expandedRegion === region ? theme.colors.primary : theme.colors.borderLight}`,
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>{region}</div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: "'DM Serif Display', serif",
                  color: theme.colors.textPrimary,
                }}
              >
                {items.length}
              </div>
            </div>
          ))}
          <div
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{
              padding: 16,
              background: theme.gradients.primary,
              borderRadius: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            + Add Template
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div
            style={{
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 14,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              {editingId ? "Edit Template" : "Add New Template"}
            </h3>
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
                    Region *
                  </label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Date (MM-DD) *
                  </label>
                  <input
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    placeholder="e.g., 12-18"
                    pattern="\d{2}-\d{2}"
                    style={inputStyle}
                    required
                  />
                  <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
                    Format: MM-DD (e.g., 12-18 for Dec 18)
                  </div>
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
                  {saving ? "Saving..." : editingId ? "Update" : "Add Template"}
                </button>
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
              </div>
            </form>
          </div>
        )}

        {/* Templates List by Region */}
        {Object.keys(grouped).length === 0 ? (
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
            <div style={{ fontSize: 15 }}>No templates yet. Add your first one above.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Object.entries(grouped)
              .filter(([region]) => !expandedRegion || expandedRegion === region)
              .map(([region, items]) => (
                <div
                  key={region}
                  style={{
                    background: theme.colors.bgSecondary,
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 20px",
                      background: theme.colors.bgPrimary,
                      borderBottom: `1px solid ${theme.colors.borderLight}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{region}</div>
                    <div
                      style={{
                        padding: "4px 10px",
                        background: theme.colors.bgTertiary,
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {items.length} templates
                    </div>
                  </div>
                  <div>
                    {items
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((t, idx) => {
                        const color = t.color || getCategoryColor(t.category);
                        const [month, day] = t.date.split("-");
                        const monthName = new Date(2024, parseInt(month) - 1).toLocaleDateString("en-US", {
                          month: "short",
                        });

                        return (
                          <div
                            key={t.id}
                            style={{
                              padding: "14px 20px",
                              borderBottom:
                                idx < items.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                          >
                            {/* Date badge */}
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                background: `${color}15`,
                                border: `1px solid ${color}30`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{ fontSize: 9, fontWeight: 600, color, textTransform: "uppercase" }}
                              >
                                {monthName}
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary }}>
                                {day}
                              </div>
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary }}>
                                {t.name}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    fontSize: 10,
                                    fontWeight: 500,
                                    background: `${color}18`,
                                    color,
                                  }}
                                >
                                  {t.category}
                                </span>
                                {t.isRecurring && (
                                  <span style={{ fontSize: 10, color: theme.colors.textMuted }}>
                                    🔄 Recurring
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => startEdit(t)}
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
                                onClick={() => handleDelete(t.id)}
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
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
