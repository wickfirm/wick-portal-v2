"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SERVICE_TYPES = [
  { value: "SEO", label: "SEO" },
  { value: "AEO", label: "AEO" },
  { value: "WEB_DEVELOPMENT", label: "Web Development" },
  { value: "PAID_MEDIA", label: "Paid Media" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "CONTENT", label: "Content" },
  { value: "BRANDING", label: "Branding" },
  { value: "CONSULTING", label: "Consulting" },
];

type Template = {
  id: string;
  serviceType: string;
  name: string;
  order: number;
};

export default function TemplatesPage() {
  const [selectedService, setSelectedService] = useState("SEO");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, [selectedService]);

  async function fetchTemplates() {
    setLoading(true);
    const res = await fetch(`/api/templates?serviceType=${selectedService}`);
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  async function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);

    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType: selectedService, name: newName }),
    });

    if (res.ok) {
      setNewName("");
      fetchTemplates();
    }
    setAdding(false);
  }

  async function updateTemplate(template: Template) {
    if (!editName.trim() || editName === template.name) {
      setEditingId(null);
      return;
    }

    await fetch(`/api/templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });

    setEditingId(null);
    fetchTemplates();
  }

  async function deleteTemplate(template: Template) {
    if (!confirm(`Delete stage "${template.name}"?`)) return;

    await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
    fetchTemplates();
  }

  async function moveTemplate(template: Template, direction: "up" | "down") {
    const currentIndex = templates.findIndex(t => t.id === template.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= templates.length) return;

    const otherTemplate = templates[newIndex];

    await Promise.all([
      fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: otherTemplate.order }),
      }),
      fetch(`/api/templates/${otherTemplate.id}`, {
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

        <h1 style={{ marginBottom: 24 }}>Stage Templates</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Define default stages for each service type. These will auto-populate when creating new projects.
        </p>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Service Type</label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4, fontSize: 16 }}
          >
            {SERVICE_TYPES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            {SERVICE_TYPES.find(s => s.value === selectedService)?.label} Stages
          </h3>

          {loading ? (
            <p style={{ color: "#888" }}>Loading...</p>
          ) : templates.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No stages defined for this service</p>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {templates.map((template, index) => (
                <div key={template.id} style={{ display: "flex", alignItems: "center", padding: 12, borderBottom: "1px solid #eee", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#666" }}>
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
                      <div
                        onClick={() => { setEditingId(template.id); setEditName(template.name); }}
                        style={{ cursor: "pointer", fontWeight: 500 }}
                      >
                        {template.name}
                      </div>
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

          <form onSubmit={addTemplate} style={{ display: "flex", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a new stage..."
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              {adding ? "Adding..." : "Add Stage"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
