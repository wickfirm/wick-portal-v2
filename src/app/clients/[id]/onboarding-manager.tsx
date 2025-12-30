"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OnboardingItem = {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
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
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

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

  // Only show for LEAD or ONBOARDING clients
  if (clientStatus !== "LEAD" && clientStatus !== "ONBOARDING") {
    return null;
  }

  return (
    <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Onboarding Checklist</h3>
        {items.length > 0 && (
          <span style={{ fontSize: 14, color: "#666" }}>{completed}/{total} completed ({pct}%)</span>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ height: 8, background: "#eee", borderRadius: 4, marginBottom: 16 }}>
          <div style={{ 
            height: "100%", 
            width: `${pct}%`, 
            background: pct === 100 ? "#4caf50" : "#2196f3", 
            borderRadius: 4,
            transition: "width 0.3s ease"
          }} />
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ color: "#888", marginBottom: 16 }}>No onboarding checklist initialized yet.</p>
          <button
            onClick={initializeOnboarding}
            disabled={initializing}
            style={{ 
              padding: "12px 24px", 
              background: "#333", 
              color: "white", 
              border: "none", 
              borderRadius: 4, 
              cursor: "pointer" 
            }}
          >
            {initializing ? "Initializing..." : "Start Onboarding"}
          </button>
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <div 
              key={item.id} 
              style={{ 
                padding: 12, 
                borderBottom: "1px solid #eee",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <button
                  onClick={() => toggleItem(item)}
                  style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 4, 
                    border: item.isCompleted ? "none" : "2px solid #ddd",
                    background: item.isCompleted ? "#4caf50" : "white",
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
                    color: item.isCompleted ? "#888" : "#333"
                  }}>
                    {item.name}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                      {item.description}
                    </div>
                  )}
                  {item.completedAt && item.completedBy && (
                    <div style={{ fontSize: 12, color: "#4caf50", marginTop: 4 }}>
                      ✓ Completed by {item.completedBy} on {new Date(item.completedAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Notes section */}
                  <div style={{ marginTop: 8 }}>
                    {editingNotesId === item.id ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add notes (e.g., N/A, pending, etc.)"
                          style={{ flex: 1, padding: 6, border: "1px solid #ddd", borderRadius: 4, fontSize: 13 }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveNotes(item);
                            if (e.key === "Escape") setEditingNotesId(null);
                          }}
                        />
                        <button
                          onClick={() => saveNotes(item)}
                          style={{ padding: "6px 12px", background: "#333", color: "white", border: "none", borderRadius: 4, fontSize: 13, cursor: "pointer" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          style={{ padding: "6px 12px", background: "#eee", color: "#333", border: "none", borderRadius: 4, fontSize: 13, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => { setEditingNotesId(item.id); setNotesValue(item.notes || ""); }}
                        style={{ 
                          fontSize: 13, 
                          color: item.notes ? "#666" : "#aaa", 
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
              background: "#e8f5e9", 
              borderRadius: 4, 
              textAlign: "center",
              color: "#2e7d32"
            }}>
              🎉 Onboarding complete! Consider changing client status to <strong>ACTIVE</strong>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
