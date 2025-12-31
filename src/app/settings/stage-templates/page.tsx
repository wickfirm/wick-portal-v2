"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type StageTemplate = {
  id: string;
  serviceType: string;
  name: string;
  order: number;
};

const SERVICE_TYPES = [
  "SEO", "AEO", "WEB_DEVELOPMENT", "PAID_MEDIA",
  "SOCIAL_MEDIA", "CONTENT", "BRANDING", "CONSULTING"
];

export default function StageTemplatesPage() {
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
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

    const res = await fetch("/api/stage-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTemplate),
    });

    if (res.ok) {
      setNewTemplate({ ...newTemplate, name: "" });
      fetchTemplates();
    }
    setAdding(false);
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/stage-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  const groupedTemplates = SERVICE_TYPES.reduce((acc, type) => {
    acc[type] = templates.filter(t => t.serviceType === type).sort((a, b) => a.order - b.order);
    return acc;
  }, {} as Record<string, StageTemplate[]>);

  const inputStyle = {
    padding: "12px 16px",
    border: "1px solid #dadce0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "#5f6368" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: "#5f6368", textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Stage Templates</h1>
          <p style={{ color: "#5f6368", fontSize: 15 }}>Define default stages for each service type. New projects will automatically use these stages.</p>
        </div>

        {/* Add Template Form */}
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Add New Stage Template</h3>
          <form onSubmit={addTemplate} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: "0 0 200px" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Service Type</label>
              <select
                value={newTemplate.serviceType}
                onChange={(e) => setNewTemplate({ ...newTemplate, serviceType: e.target.value })}
                style={{ ...inputStyle, width: "100%", cursor: "pointer" }}
              >
                {SERVICE_TYPES.map(type => (
                  <option key={type} value={type}>{type.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Stage Name</label>
              <input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., Discovery, Strategy, Implementation"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <button type="submit" disabled={adding || !newTemplate.name.trim()} style={{
              padding: "12px 24px",
              background: adding || !newTemplate.name.trim() ? "#f1f3f4" : "#e85a4f",
              color: adding || !newTemplate.name.trim() ? "#9aa0a6" : "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              cursor: adding || !newTemplate.name.trim() ? "not-allowed" : "pointer",
            }}>
              {adding ? "Adding..." : "Add Stage"}
            </button>
          </form>
        </div>

        {/* Templates by Service Type */}
        <div style={{ display: "grid", gap: 20 }}>
          {SERVICE_TYPES.map(type => (
            <div key={type} style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
              <div style={{
                padding: "16px 20px",
                background: "#f8f9fa",
                borderBottom: "1px solid #e8eaed",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                  {type.replace("_", " ")}
                </h3>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: "#f1f3f4",
                  color: "#5f6368"
                }}>
                  {groupedTemplates[type].length} stages
                </span>
              </div>
              
              {groupedTemplates[type].length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#9aa0a6", fontSize: 14 }}>
                  No stages defined
                </div>
              ) : (
                <div>
                  {groupedTemplates[type].map((template, idx) => (
                    <div key={template.id} style={{
                      padding: "14px 20px",
                      borderBottom: idx < groupedTemplates[type].length - 1 ? "1px solid #f1f3f4" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: "#f1f3f4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#5f6368"
                        }}>
                          {template.order}
                        </span>
                        <span style={{ fontWeight: 500, color: "#1a1a1a" }}>{template.name}</span>
                      </div>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#fce8e6",
                          color: "#ea4335",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
