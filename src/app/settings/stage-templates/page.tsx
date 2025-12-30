"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type Template = {
  id: string;
  serviceType: string;
  name: string;
  order: number;
};

const SERVICE_TYPES = ["SEO", "AEO", "WEB_DEV", "PAID_MEDIA", "SOCIAL_MEDIA", "CONTENT", "BRANDING", "CONSULTING"];

export default function StageTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({ serviceType: "SEO", name: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/stage-templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  async function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;
    setAdding(true);

    await fetch("/api/stage-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTemplate),
    });

    setNewTemplate({ ...newTemplate, name: "" });
    fetchTemplates();
    setAdding(false);
  }

  async function deleteTemplate(id: string) {
    await fetch(`/api/stage-templates/${id}`, { method: "DELETE" });
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

        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Stage Templates</h1>

        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Add Stage Template</h3>
          <form onSubmit={addTemplate} style={{ display: "flex", gap: 12 }}>
            <select
              value={newTemplate.serviceType}
              onChange={(e) => setNewTemplate({ ...newTemplate, serviceType: e.target.value })}
              style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
            >
              {SERVICE_TYPES.map(type => (
                <option key={type} value={type}>{type.replace("_", " ")}</option>
              ))}
            </select>
            <input
              placeholder="Stage name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
            />
            <button type="submit" disabled={adding} style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
              {adding ? "Adding..." : "Add"}
            </button>
          </form>
        </div>

        {SERVICE_TYPES.map(type => {
          const typeTemplates = templates.filter(t => t.serviceType === type);
          if (typeTemplates.length === 0) return null;

          return (
            <div key={type} style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 16 }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>{type.replace("_", " ")}</h3>
              {typeTemplates.map((template, idx) => (
                <div key={template.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: idx < typeTemplates.length - 1 ? "1px solid #eee" : "none" }}>
                  <span>{template.order}. {template.name}</span>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    style={{ padding: "4px 8px", background: "#fee", color: "#c00", border: "none", borderRadius: 4, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </main>
    </div>
  );
}
