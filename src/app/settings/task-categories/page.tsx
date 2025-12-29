"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  order: number;
};

export default function TaskCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch("/api/task-categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);

    const res = await fetch("/api/task-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (res.ok) {
      setNewName("");
      fetchCategories();
    }
    setAdding(false);
  }

  async function updateCategory(category: Category) {
    if (!editName.trim() || editName === category.name) {
      setEditingId(null);
      return;
    }

    await fetch(`/api/task-categories/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });

    setEditingId(null);
    fetchCategories();
  }

  async function deleteCategory(category: Category) {
    if (!confirm(`Delete "${category.name}"? Tasks in this category will become uncategorized.`)) return;

    await fetch(`/api/task-categories/${category.id}`, { method: "DELETE" });
    fetchCategories();
  }

  async function moveCategory(category: Category, direction: "up" | "down") {
    const currentIndex = categories.findIndex(c => c.id === category.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= categories.length) return;

    const otherCategory = categories[newIndex];

    await Promise.all([
      fetch(`/api/task-categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: otherCategory.order }),
      }),
      fetch(`/api/task-categories/${otherCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: category.order }),
      }),
    ]);

    fetchCategories();
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

      <main style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: "#666", textDecoration: "none" }}>← Back to Settings</Link>
        </div>

        <h1 style={{ marginBottom: 8 }}>Task Categories</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Manage categories for organizing client tasks.
        </p>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          {loading ? (
            <p style={{ color: "#888" }}>Loading...</p>
          ) : categories.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No categories yet</p>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {categories.map((category, index) => (
                <div key={category.id} style={{ display: "flex", alignItems: "center", padding: 12, borderBottom: "1px solid #eee", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 4, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#666" }}>
                    {category.order}
                  </div>

                  <div style={{ flex: 1 }}>
                    {editingId === category.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => updateCategory(category)}
                        onKeyDown={(e) => e.key === "Enter" && updateCategory(category)}
                        autoFocus
                        style={{ padding: 4, border: "1px solid #ddd", borderRadius: 4, width: "100%" }}
                      />
                    ) : (
                      <div
                        onClick={() => { setEditingId(category.id); setEditName(category.name); }}
                        style={{ cursor: "pointer", fontWeight: 500 }}
                      >
                        {category.name}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => moveCategory(category, "up")}
                      disabled={index === 0}
                      style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, background: "white", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.3 : 1 }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveCategory(category, "down")}
                      disabled={index === categories.length - 1}
                      style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, background: "white", cursor: index === categories.length - 1 ? "default" : "pointer", opacity: index === categories.length - 1 ? 0.3 : 1 }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => deleteCategory(category)}
                      style={{ padding: "4px 8px", border: "1px solid #fcc", borderRadius: 4, background: "#fee", color: "#c00", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={addCategory} style={{ display: "flex", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name..."
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
