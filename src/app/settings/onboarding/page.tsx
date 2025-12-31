"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type OnboardingTemplate = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
};

export default function OnboardingSettingsPage() {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: "", description: "" });
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
    if (!newItem.name.trim()) return;
    setAdding(true);

    const res = await fetch("/api/onboarding-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });

    if (res.ok) {
      setNewItem({ name: "", description: "" });
      fetchTemplates();
    }
    setAdding(false);
  }

  async function toggleActive(template: OnboardingTemplate) {
    await fetch(`/api/onboarding-templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    fetchTemplates();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/onboarding-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  const inputStyle = {
    padding: "12px 16px",
    border: "1px solid #dadce0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
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
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Onboarding Templates</h1>
          <p style={{ color: "#5f6368", fontSize: 15 }}>Define default onboarding items that will be applied to new clients.</p>
        </div>

        {/* Add Template Form */}
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Add New Onboarding Item</h3>
          <form onSubmit={addTemplate}>
            <div style={{ display: "grid", gap: 16, marginBottom: 16 }}>
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
              background: adding || !newItem.name.trim() ? "#f1f3f4" : "#e85a4f",
              color: adding || !newItem.name.trim() ? "#9aa0a6" : "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              cursor: adding || !newItem.name.trim() ? "not-allowed" : "pointer",
            }}>
              {adding ? "Adding..." : "Add Item"}
            </button>
          </form>
        </div>

        {/* Templates List */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "#f8f9fa", borderBottom: "1px solid #e8eaed" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
              Onboarding Items ({templates.length})
            </h3>
          </div>

          {templates.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#9aa0a6", fontSize: 14 }}>
              No onboarding items defined
            </div>
          ) : (
            <div>
              {templates.sort((a, b) => a.order - b.order).map((template, idx) => (
                <div key={template.id} style={{
                  padding: "16px 20px",
                  borderBottom: idx < templates.length - 1 ? "1px solid #f1f3f4" : "none",
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
                    <div>
                      <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{template.name}</div>
                      {template.description && (
                        <div style={{ fontSize: 13, color: "#9aa0a6", marginTop: 2 }}>{template.description}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => toggleActive(template)}
                      style={{
                        padding: "6px 12px",
                        background: template.isActive ? "#e6f4ea" : "#f1f3f4",
                        color: template.isActive ? "#34a853" : "#5f6368",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </button>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
