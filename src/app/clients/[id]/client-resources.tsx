"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";

type Resource = {
  id: string;
  name: string;
  url: string;
  type: string;
  order: number;
};

const RESOURCE_ICONS: Record<string, string> = {
  DRIVE: "📁",
  FIGMA: "🎨",
  DOCS: "📄",
  SHEETS: "📊",
  STAGING: "🌐",
  LIVE: "🚀",
  ANALYTICS: "📈",
  ADS: "💰",
  SOCIAL: "📱",
  CRM: "👥",
  SLACK: "💬",
  OTHER: "🔗",
  LINK: "🔗",
};

const RESOURCE_TYPES = [
  { value: "DRIVE", label: "Google Drive" },
  { value: "FIGMA", label: "Figma" },
  { value: "DOCS", label: "Google Docs" },
  { value: "SHEETS", label: "Google Sheets" },
  { value: "ANALYTICS", label: "Analytics" },
  { value: "ADS", label: "Ad Account" },
  { value: "SOCIAL", label: "Social Media" },
  { value: "CRM", label: "CRM" },
  { value: "SLACK", label: "Slack/Comms" },
  { value: "LIVE", label: "Live Site" },
  { value: "OTHER", label: "Other" },
];

export default function ClientResources({
  clientId,
  initialResources,
}: {
  clientId: string;
  initialResources: Resource[];
}) {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [showForm, setShowForm] = useState(false);
  const [newResource, setNewResource] = useState({ name: "", url: "", type: "LINK" });
  const [adding, setAdding] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", url: "", type: "" });

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!newResource.name.trim() || !newResource.url.trim()) return;
    setAdding(true);

    const res = await fetch("/api/client-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newResource, clientId }),
    });

    if (res.ok) {
      const resource = await res.json();
      setResources([...resources, resource]);
      setNewResource({ name: "", url: "", type: "LINK" });
      setShowForm(false);
      router.refresh();
    }
    setAdding(false);
  }

  function startEdit(resource: Resource) {
    setEditingId(resource.id);
    setEditForm({ name: resource.name, url: resource.url, type: resource.type });
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim() || !editForm.url.trim()) return;
    
    const res = await fetch("/api/client-resources/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      const updated = await res.json();
      setResources(resources.map(r => r.id === id ? updated : r));
      setEditingId(null);
      router.refresh();
    }
  }

  async function deleteResource(id: string) {
    if (!confirm("Delete this resource?")) return;
    
    const res = await fetch("/api/client-resources/" + id, { method: "DELETE" });
    if (res.ok) {
      setResources(resources.filter(r => r.id !== id));
      router.refresh();
    }
  }

  function guessTypeFromUrl(url: string): string {
    if (url.includes("drive.google.com")) return "DRIVE";
    if (url.includes("figma.com")) return "FIGMA";
    if (url.includes("docs.google.com")) return "DOCS";
    if (url.includes("sheets.google.com")) return "SHEETS";
    if (url.includes("analytics.google.com")) return "ANALYTICS";
    if (url.includes("ads.google.com") || url.includes("business.facebook.com")) return "ADS";
    if (url.includes("slack.com")) return "SLACK";
    if (url.includes("hubspot") || url.includes("salesforce") || url.includes("pipedrive")) return "CRM";
    return "OTHER";
  }

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ 
      background: theme.colors.bgSecondary, 
      borderRadius: theme.borderRadius.lg, 
      border: "1px solid " + theme.colors.borderLight,
      overflow: "hidden",
      marginBottom: 24
    }}>
      {/* Header */}
      <div style={{ 
        padding: "16px 20px", 
        borderBottom: "1px solid " + theme.colors.borderLight,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary }}>
          Client Resources
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "6px 14px",
              background: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={addResource} style={{ padding: 20, borderBottom: "1px solid " + theme.colors.borderLight, background: theme.colors.bgPrimary }}>
          <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
            <input
              value={newResource.name}
              onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
              placeholder="Resource name (e.g., Client Drive Folder)"
              style={inputStyle}
              autoFocus
            />
            <input
              value={newResource.url}
              onChange={(e) => {
                const url = e.target.value;
                setNewResource({ 
                  ...newResource, 
                  url,
                  type: newResource.type === "LINK" ? guessTypeFromUrl(url) : newResource.type
                });
              }}
              placeholder="https://..."
              style={inputStyle}
            />
            <select
              value={newResource.type}
              onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {RESOURCE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={adding || !newResource.name.trim() || !newResource.url.trim()}
              style={{
                padding: "10px 20px",
                background: adding || !newResource.name.trim() || !newResource.url.trim() ? theme.colors.bgTertiary : theme.colors.primary,
                color: adding || !newResource.name.trim() || !newResource.url.trim() ? theme.colors.textMuted : "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                cursor: adding || !newResource.name.trim() || !newResource.url.trim() ? "not-allowed" : "pointer",
              }}
            >
              {adding ? "Adding..." : "Add Resource"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewResource({ name: "", url: "", type: "LINK" }); }}
              style={{
                padding: "10px 20px",
                background: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted, fontSize: 14 }}>
          No resources yet. Add links to client files and tools.
        </div>
      ) : (
        <div>
          {resources.sort((a, b) => a.order - b.order).map((resource) => (
            <div key={resource.id}>
              {editingId === resource.id ? (
                <div style={{ padding: 16, borderBottom: "1px solid " + theme.colors.bgTertiary, background: theme.colors.bgPrimary }}>
                  <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={inputStyle}
                      autoFocus
                    />
                    <input
                      value={editForm.url}
                      onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      style={inputStyle}
                    />
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {RESOURCE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveEdit(resource.id)} style={{ padding: "8px 16px", background: theme.colors.primary, color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: "8px 16px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid " + theme.colors.bgTertiary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textDecoration: "none",
                      flex: 1,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{RESOURCE_ICONS[resource.type] || "🔗"}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                        {resource.name}
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                        {RESOURCE_TYPES.find(t => t.value === resource.type)?.label || resource.type}
                      </div>
                    </div>
                  </a>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => startEdit(resource)}
                      style={{
                        padding: "6px 12px",
                        background: theme.colors.bgTertiary,
                        color: theme.colors.textSecondary,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteResource(resource.id)}
                      style={{
                        padding: "6px 12px",
                        background: theme.colors.errorBg,
                        color: theme.colors.error,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
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
  );
}
