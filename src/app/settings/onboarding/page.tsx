"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  itemType: string;
  isRequired: boolean;
  order: number;
  autoCreateTask: boolean;
  taskName: string | null;
  taskPriority: string | null;
};

type OnboardingTemplate = {
  id: string;
  name: string;
  description: string | null;
  serviceType: string;
  order: number;
  isActive: boolean;
  items: TemplateItem[];
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General Setup",
  SEO: "SEO",
  AEO: "AEO (AI Engine Optimization)",
  PAID_MEDIA: "Paid Media",
  WEB_DEVELOPMENT: "Web Development",
  SOCIAL_MEDIA: "Social Media",
  CONTENT: "Content Marketing",
  BRANDING: "Branding",
  CONSULTING: "Consulting",
};

const SERVICE_TYPE_ICONS: Record<string, string> = {
  GENERAL: "⚙️",
  SEO: "🔍",
  AEO: "🤖",
  PAID_MEDIA: "📢",
  WEB_DEVELOPMENT: "💻",
  SOCIAL_MEDIA: "📱",
  CONTENT: "✍️",
  BRANDING: "🎨",
  CONSULTING: "💼",
};

const ITEM_TYPES = ["TEXT_INPUT", "URL_INPUT"];
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

export default function OnboardingSettingsPage() {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TemplateItem>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/onboarding-templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  async function toggleActive(template: OnboardingTemplate) {
    await fetch("/api/onboarding-templates/" + template.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    fetchTemplates();
  }

  const toggleExpand = (id: string) => {
    setExpandedTemplates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (item: TemplateItem) => {
    setEditingItem(item.id);
    setEditForm({
      name: item.name,
      description: item.description || "",
      itemType: item.itemType,
      isRequired: item.isRequired,
      autoCreateTask: item.autoCreateTask,
      taskName: item.taskName || "",
      taskPriority: item.taskPriority || "MEDIUM",
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const saveItem = async (templateId: string, itemId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/onboarding-templates/${templateId}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      await fetchTemplates();
      setEditingItem(null);
      setEditForm({});
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save changes");
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 8 }}>Onboarding Templates</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
            These templates define the onboarding checklists for each service type. Click on any item to edit it.
          </p>
        </div>

        {/* Templates List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {templates.map((template) => {
            const isExpanded = expandedTemplates[template.id] ?? false;
            const requiredCount = template.items.filter(i => i.isRequired).length;
            const taskCount = template.items.filter(i => i.autoCreateTask).length;

            return (
              <div 
                key={template.id} 
                style={{ 
                  background: theme.colors.bgSecondary, 
                  borderRadius: theme.borderRadius.lg, 
                  border: "1px solid " + theme.colors.borderLight,
                  overflow: "hidden",
                  opacity: template.isActive ? 1 : 0.6,
                }}
              >
                {/* Template Header */}
                <div 
                  onClick={() => toggleExpand(template.id)}
                  style={{ 
                    padding: "20px 24px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 28 }}>{SERVICE_TYPE_ICONS[template.serviceType] || "📋"}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{template.name}</span>
                        <span style={{ 
                          fontSize: 11, 
                          padding: "2px 8px", 
                          borderRadius: 4,
                          background: theme.colors.bgTertiary,
                          color: theme.colors.textSecondary,
                        }}>
                          {template.serviceType}
                        </span>
                        {!template.isActive && (
                          <span style={{ 
                            fontSize: 11, 
                            padding: "2px 8px", 
                            borderRadius: 4,
                            background: theme.colors.warningBg,
                            color: theme.colors.warning,
                          }}>
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                        {template.items.length} items · {requiredCount} required · {taskCount} auto-create tasks
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(template); }}
                      style={{
                        padding: "6px 12px",
                        background: template.isActive ? theme.colors.successBg : theme.colors.bgTertiary,
                        color: template.isActive ? theme.colors.success : theme.colors.textSecondary,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </button>
                    <span style={{ 
                      color: theme.colors.textMuted, 
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", 
                      transition: "transform 200ms",
                      fontSize: 12,
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Template Items */}
                {isExpanded && template.items.length > 0 && (
                  <div style={{ borderTop: "1px solid " + theme.colors.borderLight }}>
                    {template.items.map((item, idx) => (
                      <div key={item.id}>
                        {editingItem === item.id ? (
                          // Edit Mode
                          <div style={{ 
                            padding: "16px 24px",
                            borderBottom: idx < template.items.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                            background: theme.colors.primaryBg,
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Name</label>
                                <input
                                  value={editForm.name || ""}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  style={{ width: "100%", padding: "8px 12px", border: "1px solid " + theme.colors.borderLight, borderRadius: 6, fontSize: 14 }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Type</label>
                                <select
                                  value={editForm.itemType || "CHECKBOX"}
                                  onChange={(e) => setEditForm({ ...editForm, itemType: e.target.value })}
                                  style={{ width: "100%", padding: "8px 12px", border: "1px solid " + theme.colors.borderLight, borderRadius: 6, fontSize: 14 }}
                                >
                                  {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Description</label>
                              <input
                                value={editForm.description || ""}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid " + theme.colors.borderLight, borderRadius: 6, fontSize: 14 }}
                              />
                            </div>
                            <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.isRequired || false}
                                  onChange={(e) => setEditForm({ ...editForm, isRequired: e.target.checked })}
                                />
                                <span style={{ fontSize: 14 }}>Required</span>
                              </label>
                              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.autoCreateTask || false}
                                  onChange={(e) => setEditForm({ ...editForm, autoCreateTask: e.target.checked })}
                                />
                                <span style={{ fontSize: 14 }}>Auto-create Task</span>
                              </label>
                            </div>
                            {editForm.autoCreateTask && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 16, marginBottom: 16 }}>
                                <div>
                                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Task Name</label>
                                  <input
                                    value={editForm.taskName || ""}
                                    onChange={(e) => setEditForm({ ...editForm, taskName: e.target.value })}
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid " + theme.colors.borderLight, borderRadius: 6, fontSize: 14 }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Priority</label>
                                  <select
                                    value={editForm.taskPriority || "MEDIUM"}
                                    onChange={(e) => setEditForm({ ...editForm, taskPriority: e.target.value })}
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid " + theme.colors.borderLight, borderRadius: 6, fontSize: 14 }}
                                  >
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => saveItem(template.id, item.id)}
                                disabled={saving}
                                style={{
                                  padding: "8px 16px",
                                  background: theme.colors.primary,
                                  color: "white",
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: 13,
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                {saving ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={cancelEdit}
                                style={{
                                  padding: "8px 16px",
                                  background: theme.colors.bgTertiary,
                                  color: theme.colors.textSecondary,
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: 13,
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div 
                            onClick={() => startEdit(item)}
                            style={{ 
                              padding: "14px 24px",
                              borderBottom: idx < template.items.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                              display: "grid",
                              gridTemplateColumns: "1fr 100px 80px 140px",
                              gap: 16,
                              alignItems: "center",
                              cursor: "pointer",
                              transition: "background 150ms ease",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.bgTertiary}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 14 }}>{item.name}</div>
                              {item.description && (
                                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                            <span style={{ 
                              fontSize: 11, 
                              color: theme.colors.textSecondary,
                              background: theme.colors.bgTertiary,
                              padding: "3px 8px",
                              borderRadius: 4,
                              width: "fit-content",
                            }}>
                              {item.itemType.replace("_", " ")}
                            </span>
                            <span style={{ 
                              fontSize: 12,
                              color: item.isRequired ? theme.colors.error : theme.colors.textMuted,
                              fontWeight: item.isRequired ? 600 : 400,
                            }}>
                              {item.isRequired ? "Required" : "Optional"}
                            </span>
                            <div>
                              {item.autoCreateTask ? (
                                <div>
                                  <div style={{ fontSize: 12, color: theme.colors.success }}>✓ Auto Task</div>
                                  {item.taskName && (
                                    <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                                      {item.taskName}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: theme.colors.textMuted }}>—</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && template.items.length === 0 && (
                  <div style={{ 
                    padding: 32, 
                    textAlign: "center", 
                    color: theme.colors.textMuted,
                    borderTop: "1px solid " + theme.colors.borderLight,
                  }}>
                    No items in this template
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {templates.length === 0 && (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            padding: 64, 
            borderRadius: theme.borderRadius.lg, 
            textAlign: "center",
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg></div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No Templates Found</div>
            <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
              Run the SQL seed script to add default onboarding templates.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
