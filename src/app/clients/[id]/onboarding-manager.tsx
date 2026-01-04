"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";

type OnboardingItem = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
  resourceUrl: string | null;
  resourceLabel: string | null;
};

export default function OnboardingManager({ 
  clientId, 
  clientStatus,
  initialItems 
}: { 
  clientId: string; 
  clientStatus: string;
  initialItems: OnboardingItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<OnboardingItem[]>(initialItems);
  const [initializing, setInitializing] = useState(false);
  
  // Notes editing
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  
  // Resource editing
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceLabel, setResourceLabel] = useState("");

  const completed = items.filter(i => i.isCompleted).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function initializeOnboarding() {
    setInitializing(true);
    const res = await fetch(`/api/clients/${clientId}/onboarding`, {
      method: "POST",
    });

    if (res.ok) {
      const newItems = await res.json();
      setItems(newItems);
      router.refresh();
    }
    setInitializing(false);
  }

  async function toggleItem(item: OnboardingItem) {
    const res = await fetch(`/api/onboarding-items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !item.isCompleted }),
    });

    if (res.ok) {
      const updated = await res.json();
      setItems(items.map(i => i.id === item.id ? {
        ...i,
        ...updated,
        completedAt: updated.completedAt ? updated.completedAt : null,
      } : i));
      router.refresh();
    }
  }

  async function saveNotes(item: OnboardingItem) {
    const res = await fetch(`/api/onboarding-items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesValue }),
    });

    if (res.ok) {
      const updated = await res.json();
      setItems(items.map(i => i.id === item.id ? { ...i, notes: updated.notes } : i));
    }
    setEditingNotesId(null);
  }

  async function saveResource(item: OnboardingItem) {
    const res = await fetch(`/api/onboarding-items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        resourceUrl: resourceUrl || null,
        resourceLabel: resourceLabel || null
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setItems(items.map(i => i.id === item.id ? { 
        ...i, 
        resourceUrl: updated.resourceUrl,
        resourceLabel: updated.resourceLabel 
      } : i));
    }
    setEditingResourceId(null);
  }

  function startEditResource(item: OnboardingItem) {
    setEditingResourceId(item.id);
    setResourceUrl(item.resourceUrl || "");
    setResourceLabel(item.resourceLabel || "");
  }

  function removeResource(item: OnboardingItem) {
    setResourceUrl("");
    setResourceLabel("");
    fetch(`/api/onboarding-items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceUrl: null, resourceLabel: null }),
    }).then(res => {
      if (res.ok) {
        setItems(items.map(i => i.id === item.id ? { 
          ...i, 
          resourceUrl: null,
          resourceLabel: null 
        } : i));
      }
    });
  }

  // Guess label from URL
  function guessLabelFromUrl(url: string): string {
    if (url.includes("drive.google.com")) return "Google Drive";
    if (url.includes("docs.google.com")) return "Google Docs";
    if (url.includes("sheets.google.com")) return "Google Sheets";
    if (url.includes("dropbox.com")) return "Dropbox";
    if (url.includes("notion.so") || url.includes("notion.site")) return "Notion";
    if (url.includes("figma.com")) return "Figma";
    if (url.includes("canva.com")) return "Canva";
    if (url.includes("slack.com")) return "Slack";
    if (url.includes("trello.com")) return "Trello";
    if (url.includes("asana.com")) return "Asana";
    if (url.includes("github.com")) return "GitHub";
    if (url.includes("gitlab.com")) return "GitLab";
    if (url.includes("onedrive")) return "OneDrive";
    if (url.includes("sharepoint")) return "SharePoint";
    return "Link";
  }

  // Only show for LEAD or ONBOARDING clients
  if (clientStatus !== "LEAD" && clientStatus !== "ONBOARDING") {
    return null;
  }

  const inputStyle = {
    padding: "8px 12px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary }}>Onboarding Checklist</h3>
        {items.length > 0 && (
          <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>{completed}/{total} completed ({pct}%)</span>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ height: 8, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 16 }}>
          <div style={{ 
            height: "100%", 
            width: `${pct}%`, 
            background: pct === 100 ? theme.colors.success : theme.colors.primary, 
            borderRadius: 4,
            transition: "width 0.3s ease"
          }} />
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ color: theme.colors.textMuted, marginBottom: 16 }}>No onboarding checklist initialized yet.</p>
          <button
            onClick={initializeOnboarding}
            disabled={initializing}
            style={{ 
              padding: "12px 24px", 
              background: theme.colors.primary, 
              color: "white", 
              border: "none", 
              borderRadius: theme.borderRadius.md, 
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14
            }}
          >
            {initializing ? "Initializing..." : "Start Onboarding"}
          </button>
        </div>
      ) : (
        <div>
          {items.sort((a, b) => a.order - b.order).map((item) => (
            <div 
              key={item.id} 
              style={{ 
                padding: 16, 
                borderBottom: "1px solid " + theme.colors.bgTertiary,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <button
                  onClick={() => toggleItem(item)}
                  style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 6, 
                    border: item.isCompleted ? "none" : "2px solid " + theme.colors.borderMedium,
                    background: item.isCompleted ? theme.colors.success : "white",
                    color: "white", 
                    fontSize: 14, 
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  {item.isCompleted ? "✓" : ""}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 500, 
                    textDecoration: item.isCompleted ? "line-through" : "none",
                    color: item.isCompleted ? theme.colors.textMuted : theme.colors.textPrimary
                  }}>
                    {item.name}
                  </div>
                  
                  {item.description && (
                    <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
                      {item.description}
                    </div>
                  )}

                  {item.completedAt && item.completedBy && (
                    <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>
                      ✓ Completed by {item.completedBy} on {new Date(item.completedAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Resource Link Section */}
                  <div style={{ marginTop: 10 }}>
                    {editingResourceId === item.id ? (
                      <div style={{ 
                        background: theme.colors.bgPrimary, 
                        padding: 12, 
                        borderRadius: 8, 
                        border: "1px solid " + theme.colors.borderLight 
                      }}>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4, color: theme.colors.textSecondary }}>Resource URL</label>
                          <input
                            value={resourceUrl}
                            onChange={(e) => {
                              setResourceUrl(e.target.value);
                              if (!resourceLabel && e.target.value) {
                                setResourceLabel(guessLabelFromUrl(e.target.value));
                              }
                            }}
                            placeholder="https://drive.google.com/..."
                            style={inputStyle}
                            autoFocus
                          />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4, color: theme.colors.textSecondary }}>Label (optional)</label>
                          <input
                            value={resourceLabel}
                            onChange={(e) => setResourceLabel(e.target.value)}
                            placeholder="e.g., Brand Guidelines PDF"
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => saveResource(item)}
                            style={{ 
                              padding: "8px 16px", 
                              background: theme.colors.primary, 
                              color: "white", 
                              border: "none", 
                              borderRadius: 6, 
                              fontSize: 13, 
                              fontWeight: 500,
                              cursor: "pointer" 
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingResourceId(null)}
                            style={{ 
                              padding: "8px 16px", 
                              background: theme.colors.bgTertiary, 
                              color: theme.colors.textSecondary, 
                              border: "none", 
                              borderRadius: 6, 
                              fontSize: 13, 
                              fontWeight: 500,
                              cursor: "pointer" 
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : item.resourceUrl ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        
                          href={item.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            background: theme.colors.infoBg,
                            color: theme.colors.info,
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          🔗 {item.resourceLabel || "View Resource"}
                        </a>
                        <button
                          onClick={() => startEditResource(item)}
                          style={{
                            padding: "6px 10px",
                            background: theme.colors.bgTertiary,
                            color: theme.colors.textSecondary,
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeResource(item)}
                          style={{
                            padding: "6px 10px",
                            background: theme.colors.errorBg,
                            color: theme.colors.error,
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: "pointer"
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditResource(item)}
                        style={{
                          padding: "6px 12px",
                          background: "transparent",
                          color: theme.colors.textMuted,
                          border: "1px dashed " + theme.colors.borderMedium,
                          borderRadius: 6,
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        + Add resource link
                      </button>
                    )}
                  </div>

                  {/* Notes section */}
                  <div style={{ marginTop: 10 }}>
                    {editingNotesId === item.id ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add notes (e.g., N/A, pending, etc.)"
                          style={{ ...inputStyle, flex: 1 }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveNotes(item);
                            if (e.key === "Escape") setEditingNotesId(null);
                          }}
                        />
                        <button
                          onClick={() => saveNotes(item)}
                          style={{ padding: "8px 12px", background: theme.colors.primary, color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          style={{ padding: "8px 12px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => { setEditingNotesId(item.id); setNotesValue(item.notes || ""); }}
                        style={{ 
                          fontSize: 13, 
                          color: item.notes ? theme.colors.textSecondary : theme.colors.textMuted, 
                          cursor: "pointer",
                          fontStyle: item.notes ? "normal" : "italic",
                          padding: "4px 0"
                        }}
                      >
                        {item.notes || "+ Add notes"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pct === 100 && (
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              background: theme.colors.successBg, 
              borderRadius: 8, 
              textAlign: "center",
              color: theme.colors.success
            }}>
              🎉 Onboarding complete! Consider changing client status to <strong>ACTIVE</strong>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
