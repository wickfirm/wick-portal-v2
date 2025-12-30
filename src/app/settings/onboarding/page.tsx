"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type Template = {
  id: string;
  name: string;
  description: string | null;
  order: number;
};

export default function OnboardingTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/onboarding-templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  async function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;
    setAdding(true);

    await fetch("/api/onboarding-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTemplate),
    });

    setNewTemplate({ name: "", description: "" });
    fetchTemplates();
    setAdding(false);
  }

  async function deleteTemplate(id: string) {
    await fetch(`/api/onboarding-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: "#666", textDecoration: "none" }}>← Back to Settings</Link>
        </div>

        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Onboarding Templates</h1>

        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Add Onboarding Item</h3>
          <form onSubmit={addTemplate}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <input
                placeholder="Item name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <input
                placeholder="Description (optional)"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
              />
              <button type="submit" disabled={adding} style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Current Onboarding Items</h3>
          {templates.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center" }}>No templates yet</p>
          ) : (
            templates.map((template, idx) => (
              <div key={template.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: idx < templates.length - 1 ? "1px solid #eee" : "none" }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{template.order}. {template.name}</div>
                  {template.description && <div style={{ fontSize: 13, color: "#666" }}>{template.description}</div>}
                </div>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  style={{ padding: "4px 8px", background: "#fee", color: "#c00", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
