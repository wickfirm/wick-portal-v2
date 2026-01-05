"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type TaskCategory = {
  id: string;
  name: string;
};

export default function TaskCategoriesPage() {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: "" });
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
      setNewCategory({ name: "" });
      fetchCategories();
    }
    setAdding(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch("/api/task-categories/" + id, { method: "DELETE" });
    fetchCategories();
  }

  const inputStyle = {
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    outline: "none",
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings/tasks" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Task Settings
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Task Categories</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Organize client tasks with custom categories.</p>
        </div>

        {/* Add Category Form */}
        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Add New Category</h3>
          <form onSubmit={addCategory} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Category Name</label>
              <input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ name: e.target.value })}
                placeholder="e.g., Content, Technical, Design"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <button type="submit" disabled={adding || !newCategory.name.trim()} style={{
              padding: "12px 24px",
              background: adding || !newCategory.name.trim() ? theme.colors.bgTertiary : theme.colors.primary,
              color: adding || !newCategory.name.trim() ? theme.colors.textMuted : "white",
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontWeight: 500,
              fontSize: 14,
              cursor: adding || !newCategory.name.trim() ? "not-allowed" : "pointer",
            }}>
              {adding ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.borderLight }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>
              Categories ({categories.length})
            </h3>
          </div>

          {categories.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted, fontSize: 14 }}>
              No categories defined
            </div>
          ) : (
            <div>
              {categories.map((category, idx) => (
                <div key={category.id} style={{
                  padding: "16px 20px",
                  borderBottom: idx < categories.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: theme.colors.info
                    }} />
                    <span style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{category.name}</span>
                  </div>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    style={{
                      padding: "6px 12px",
                      background: theme.colors.errorBg,
                      color: theme.colors.error,
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
