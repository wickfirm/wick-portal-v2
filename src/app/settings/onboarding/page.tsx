"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Template = {
  id: string;
  name: string;
  description: string | null;
  order: number;
};

export default function OnboardingTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    const res = await fetch("/api/onboarding-templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  async function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);

    const res = await fetch("/api/onboarding-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc || null }),
    });

    if (res.ok) {
      setNewName("");
      setNewDesc("");
      fetchTemplates();
    }
    setAdding(false);
  }

  async function updateTemplate(template: Template) {
    if (!editName.trim() || editName === template.name) {
      setEditingId(null);
      return;
    }

    await fetch(`/api/onboarding-templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });

    setEditingId(null);
    fetchTemplates();
  }

  async function deleteTemplate(template: Template) {
    if (!confirm(`Delete "${template.name}"?`)) return;

    await fetch(`/api/onboarding-templates/${template.id}`, { method: "DELETE" });
    fetchTemplates();
  }

  async function moveTemplate(template: Template, direction: "up" | "down") {
    const currentIndex = templates.findIndex(t => t.id === template.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= templates.length) return;

    const otherTemplate = templates[newIndex];

    await Promise.all([
      fetch(`/api/onboarding-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: otherTemplate.order }),
      }),
      fetch(`/api/onboarding-templates/${otherTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: template.order }),
      }),
    ]);

    fetchTemplates();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 24 }}>
        <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
          <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
          <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
          <Link href="/analytics" style={{ color: "#666", textDecoration: "none" }}>Analytics</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: "#666", textDecoration: "none" }}>← Back to Settings</Link>
        </div>

        <h1 style={{ marginBottom: 8 }}>Onboarding Checklist Templates</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Define the default checklist items for new client onboarding.
        </p>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          {loading ? (
            <p style={{ color: "#888" }}>Loading...</p>
          ) : templates.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No templates defined yet</p>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {templates.map((template, index) => (
                <div key={template.id} style={{ display: "flex", alignItems: "flex-start", padding: 12, borderBottom: "1px solid #eee", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 4, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#666", flexShrink: 0 }}>
                    {template.order}
                  </div>

                  <div style={{ flex: 1 }}>
                    {editingId === template.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => updateTemplate(template)}
                        onKeyDown={(e) => e.key === "Enter" && updateTemplate(template)}
                        autoFocus
                        style={{ padding: 4, border: "1px solid #ddd", borderRadius: 4, width: "100%" }}
                      />
                    ) : (
                      <>
                        <div
                          onClick={() => { setEditingId(template.id); setEditName(template.name); }}
                          style={{ cursor: "pointer", fontWeight: 500 }}
                        >
                          {template.name}
                        </div>
                        {template.description && (
                          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{template.description}</div>
                        )}
                      </>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => moveTemplate(template, "up")}
                      disabled={index === 0}
                      style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, background: "white", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.3 : 1 }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveTemplate(template, "down")}
                      disabled={index === templates.length - 1}
                      style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, background: "white", cursor: index === templates.length - 1 ? "default" : "pointer", opacity: index === templates.length - 1 ? 0.3 : 1 }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => deleteTemplate(template)}
                      style={{ padding: "4px 8px", border: "1px solid #fcc", borderRadius: 4, background: "#fee", color: "#c00", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={addTemplate}>
            <div style={{ marginBottom: 12 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Checklist item name..."
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              {adding ? "Adding..." : "Add Item"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
