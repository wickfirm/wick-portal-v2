"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type OnboardingTemplate = {
  id: string;
  name: string;
  description: string | null;
  serviceType: string;
  order: number;
  isActive: boolean;
};

const SERVICE_TYPES = [
  { value: "GENERAL", label: "General (All Clients)" },
  { value: "SEO", label: "SEO" },
  { value: "AEO", label: "AEO" },
  { value: "WEB_DEVELOPMENT", label: "Web Development" },
  { value: "PAID_MEDIA", label: "Paid Media" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "CONTENT", label: "Content" },
  { value: "BRANDING", label: "Branding" },
  { value: "CONSULTING", label: "Consulting" },
];

export default function OnboardingSettingsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("GENERAL");
  const [newItem, setNewItem] = useState({ name: "", description: "", serviceType: "GENERAL" });
  const [adding, setAdding] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", serviceType: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/onboarding-templates");
    setTemplates(await res.json());
    setLoading(false);
  }

  async function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    setAdding(true);

    const res = await fetch("/api/onboarding-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newItem, serviceType: activeTab }),
    });

    if (res.ok) {
      setNewItem({ name: "", description: "", serviceType: activeTab });
      fetchTemplates();
    }
    setAdding(false);
  }

  function startEdit(template: OnboardingTemplate) {
    setEditingId(template.id);
    setEditForm({
      name: template.name,
      description: template.description || "",
      serviceType: template.serviceType,
    });
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim()) return;
    setSaving(true);
    await fetch("/api/onboarding-templates/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    fetchTemplates();
    setSaving(false);
  }

  async function toggleActive(template: OnboardingTemplate) {
    await fetch("/api/onboarding-templates/" + template.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    fetchTemplates();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch("/api/onboarding-templates/" + id, { method: "DELETE" });
    fetchTemplates();
  }

  const filteredTemplates = templates
    .filter(t => t.serviceType === activeTab)
    .sort((a, b) => a.order - b.order);

  const inputStyle = {
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header userName={currentUser?.name} userRole={currentUser?.role} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Onboarding Templates</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Define default onboarding items for new clients, organized by service type.</p>
        </div>

        {/* Service Type Tabs */}
        <div style={{ 
          display: "flex", 
          gap: 4, 
          marginBottom: 24, 
          overflowX: "auto",
          paddingBottom: 4,
          borderBottom: "1px solid " + theme.colors.borderLight
        }}>
          {SERVICE_TYPES.map(type => {
            const count = templates.filter(t => t.serviceType === type.value).length;
            return (
              <button
                key={type.value}
                onClick={() => setActiveTab(type.value)}
                style={{
                  padding: "10px 16px",
                  background: activeTab === type.value ? theme.colors.primary + "15" : "transparent",
                  color: activeTab === type.value ? theme.colors.primary : theme.colors.textSecondary,
                  border: "none",
                  borderBottom: activeTab === type.value ? "2px solid " + theme.colors.primary : "2px solid transparent",
                  borderRadius: "6px 6px 0 0",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {type.label}
                {count > 0 && (
                  <span style={{
                    background: activeTab === type.value ? theme.colors.primary : theme.colors.bgTertiary,
                    color: activeTab === type.value ? "white" : theme.colors.textMuted,
                    padding: "2px 6px",
                    borderRadius: 10,
                    fontSize: 11,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Template Form */}
        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>
            Add Onboarding Item to "{SERVICE_TYPES.find(t => t.value === activeTab)?.label}"
          </h3>
          <form onSubmit={addTemplate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Item Name *</label>
                <input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Sign contract, Provide brand assets"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Description</label>
                <input
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Optional description or instructions"
                  style={inputStyle}
                />
              </div>
            </div>
            <button type="submit" disabled={adding || !newItem.name.trim()} style={{
              padding: "12px 24px",
              background: adding || !newItem.name.trim() ? theme.colors.bgTertiary : theme.colors.primary,
              color: adding || !newItem.name.trim() ? theme.colors.textMuted : "white",
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontWeight: 500,
              fontSize: 14,
              cursor: adding || !newItem.name.trim() ? "not-allowed" : "pointer",
            }}>
              {adding ? "Adding..." : "Add Item"}
            </button>
          </form>
        </div>

        {/* Edit Modal */}
        {editingId && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              background: theme.colors.bgSecondary,
              padding: 32,
              borderRadius: theme.borderRadius.xl,
              width: "100%",
              maxWidth: 500,
              boxShadow: theme.shadows.lg
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 0, marginBottom: 24, color: theme.colors.textPrimary }}>
                Edit Onboarding Item
              </h2>
              <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Item Name *</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Description</label>
                  <input
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Service Type</label>
                  <select
                    value={editForm.serviceType}
                    onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {SERVICE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setEditingId(null)} style={{
                  padding: "12px 24px",
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
                <button onClick={() => saveEdit(editingId)} disabled={saving || !editForm.name.trim()} style={{
                  padding: "12px 24px",
                  background: saving || !editForm.name.trim() ? theme.colors.bgTertiary : theme.colors.primary,
                  color: saving || !editForm.name.trim() ? theme.colors.textMuted : "white",
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: saving || !editForm.name.trim() ? "not-allowed" : "pointer"
                }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>
              {SERVICE_TYPES.find(t => t.value === activeTab)?.label} Items ({filteredTemplates.length})
            </h3>
          </div>

          {filteredTemplates.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted, fontSize: 14 }}>
              No onboarding items for this service type
            </div>
          ) : (
            <div>
              {filteredTemplates.map((template, idx) => (
                <div key={template.id} style={{
                  padding: "16px 20px",
                  borderBottom: idx < filteredTemplates.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  opacity: template.isActive ? 1 : 0.6
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: theme.colors.bgTertiary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 500,
                      color: theme.colors.textSecondary
                    }}>
                      {template.order}
                    </span>
                    <div>
                      <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{template.name}</div>
                      {template.description && (
                        <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>{template.description}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(template)} style={{
                      padding: "6px 12px",
                      background: theme.colors.infoBg,
                      color: theme.colors.info,
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}>
                      Edit
                    </button>
                    <button onClick={() => toggleActive(template)} style={{
                      padding: "6px 12px",
                      background: template.isActive ? theme.colors.successBg : theme.colors.bgTertiary,
                      color: template.isActive ? theme.colors.success : theme.colors.textSecondary,
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}>
                      {template.isActive ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => deleteTemplate(template.id)} style={{
                      padding: "6px 12px",
                      background: theme.colors.errorBg,
                      color: theme.colors.error,
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info box */}
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: theme.colors.infoBg, 
          borderRadius: theme.borderRadius.md,
          border: "1px solid " + theme.colors.info + "30"
        }}>
          <div style={{ fontWeight: 500, color: theme.colors.info, marginBottom: 4 }}>How it works</div>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
            When a new client is created, they automatically receive all <strong>General</strong> onboarding items plus items specific to their assigned services.
          </div>
        </div>
      </main>
    </div>
  );
}
