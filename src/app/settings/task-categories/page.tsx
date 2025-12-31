"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type TaskCategory = {
  id: string;
  name: string;
  color: string | null;
};

const COLOR_OPTIONS = [
  { value: "#e85a4f", label: "Red" },
  { value: "#f9ab00", label: "Yellow" },
  { value: "#34a853", label: "Green" },
  { value: "#4285f4", label: "Blue" },
  { value: "#7b1fa2", label: "Purple" },
  { value: "#5f6368", label: "Gray" },
];

export default function TaskCategoriesPage() {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#4285f4" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const res = await fetch("/api/task-categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    setAdding(true);

    const res = await fetch("/api/task-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategory),
    });

    if (res.ok) {
      setNewCategory({ name: "", color: "#4285f4" });
      fetchCategories();
    }
    setAdding(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/task-categories/${id}`, { method: "DELETE" });
    fetchCategories();
  }

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
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Task Categories</h1>
          <p style={{ color: "#5f6368", fontSize: 15 }}>Organize client tasks with custom categories.</p>
        </div>

        {/* Add Category Form */}
        <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Add New Category</h3>
          <form onSubmit={addCategory} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Category Name</label>
              <input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Content, Technical, Design"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <div style={{ flex: "0 0 150px" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Color</label>
              <select
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                style={{ ...inputStyle, width: "100%", cursor: "pointer" }}
              >
                {COLOR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={adding || !newCategory.name.trim()} style={{
              padding: "12px 24px",
              background: adding || !newCategory.name.trim() ? "#f1f3f4" : "#e85a4f",
              color: adding || !newCategory.name.trim() ? "#9aa0a6" : "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              cursor: adding || !newCategory.name.trim() ? "not-allowed" : "pointer",
            }}>
              {adding ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "#f8f9fa", borderBottom: "1px solid #e8eaed" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
              Categories ({categories.length})
            </h3>
          </div>

          {categories.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#9aa0a6", fontSize: 14 }}>
              No categories defined
            </div>
          ) : (
            <div>
              {categories.map((category, idx) => (
                <div key={category.id} style={{
                  padding: "16px 20px",
                  borderBottom: idx < categories.length - 1 ? "1px solid #f1f3f4" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: category.color || "#5f6368"
                    }} />
                    <span style={{ fontWeight: 500, color: "#1a1a1a" }}>{category.name}</span>
                  </div>
                  <button
                    onClick={() => deleteCategory(category.id)}
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
      </main>
    </div>
  );
}
