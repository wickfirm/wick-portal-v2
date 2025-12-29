"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Stage = {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
};

export default function StageManager({ projectId, initialStages }: { projectId: string; initialStages: Stage[] }) {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [newStageName, setNewStageName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newStageName.trim()) return;
    setAdding(true);

    const res = await fetch(`/api/projects/${projectId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newStageName }),
    });

    if (res.ok) {
      const stage = await res.json();
      setStages([...stages, stage]);
      setNewStageName("");
      router.refresh();
    }
    setAdding(false);
  }

  async function toggleComplete(stage: Stage) {
    const res = await fetch(`/api/stages/${stage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !stage.isCompleted }),
    });

    if (res.ok) {
      const updated = await res.json();
      setStages(stages.map(s => s.id === stage.id ? updated : s));
      router.refresh();
    }
  }

  async function updateStageName(stage: Stage) {
    if (!editName.trim() || editName === stage.name) {
      setEditingId(null);
      return;
    }

    const res = await fetch(`/api/stages/${stage.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });

    if (res.ok) {
      const updated = await res.json();
      setStages(stages.map(s => s.id === stage.id ? updated : s));
      setEditingId(null);
    }
  }

  async function deleteStage(stage: Stage) {
    if (!confirm(`Delete stage "${stage.name}"?`)) return;

    const res = await fetch(`/api/stages/${stage.id}`, { method: "DELETE" });

    if (res.ok) {
      setStages(stages.filter(s => s.id !== stage.id));
      router.refresh();
    }
  }

  async function moveStage(stage: Stage, direction: "up" | "down") {
    const currentIndex = stages.findIndex(s => s.id === stage.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= stages.length) return;

    const otherStage = stages[newIndex];

    await Promise.all([
      fetch(`/api/stages/${stage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: otherStage.order }),
      }),
      fetch(`/api/stages/${otherStage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: stage.order }),
      }),
    ]);

    const newStages = [...stages];
    newStages[currentIndex] = { ...otherStage, order: stage.order };
    newStages[newIndex] = { ...stage, order: otherStage.order };
    setStages(newStages.sort((a, b) => a.order - b.order));
    router.refresh();
  }

  return (
    <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Project Stages</h3>

      {stages.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No stages defined yet</p>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {stages.map((stage, index) => (
            <div key={stage.id} style={{ display: "flex", alignItems: "center", padding: 12, borderBottom: "1px solid #eee", gap: 12 }}>
              <button
                onClick={() => toggleComplete(stage)}
                style={{ 
                  width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: stage.isCompleted ? "#4caf50" : "#eee",
                  color: "white", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                {stage.isCompleted ? "✓" : stage.order}
              </button>

              <div style={{ flex: 1 }}>
                {editingId === stage.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => updateStageName(stage)}
                    onKeyDown={(e) => e.key === "Enter" && updateStageName(stage)}
                    autoFocus
                    style={{ padding: 4, border: "1px solid #ddd", borderRadius: 4, width: "100%" }}
                  />
                ) : (
                  <div
                    onClick={() => { setEditingId(stage.id); setEditName(stage.name); }}
                    style={{ cursor: "pointer", fontWeight: 500, textDecoration: stage.isCompleted ? "line-through" : "none", color: stage.isCompleted ? "#888" : "#333" }}
                  >
                    {stage.name}
                  </div>
                )}
                {stage.completedAt && (
                  <div style={{ fontSize: 12, color: "#888" }}>Completed {new Date(stage.completedAt).toLocaleDateString()}</div>
                )}
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => moveStage(stage, "up")}
                  disabled={index === 0}
                  style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, background: "white", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.3 : 1 }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveStage(stage, "down")}
                  disabled={index === stages.length - 1}
                  style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, background: "white", cursor: index === stages.length - 1 ? "default" : "pointer", opacity: index === stages.length - 1 ? 0.3 : 1 }}
                >
                  ↓
                </button>
                <button
                  onClick={() => deleteStage(stage)}
                  style={{ padding: "4px 8px", border: "1px solid #fcc", borderRadius: 4, background: "#fee", color: "#c00", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addStage} style={{ display: "flex", gap: 8 }}>
        <input
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          placeholder="Add a new stage..."
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
        />
        <button
          type="submit"
          disabled={adding || !newStageName.trim()}
          style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          {adding ? "Adding..." : "Add Stage"}
        </button>
      </form>
    </div>
  );
}
