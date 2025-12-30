"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

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
    if (!newName.trim()) return;
    setAdding(true);

    await fetch("/api/task-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    setNewName("");
    fetchCategories();
    setAdding(false);
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/task-categories/${id}`, { method: "DELETE" });
    fetchCategories();
  }

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: "#666", textDecoration: "none" }}>← Back to Settings</Link>
        </div>

        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Task Categories</h1>

        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Add Category</h3>
          <form onSubmit={addCategory} style={{ display: "flex", gap: 12 }}>
            <input
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
            />
            <button type="submit" disabled={adding} style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
              {adding ? "Adding..." : "Add"}
            </button>
          </form>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Current Categories</h3>
          {categories.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center" }}>No categories yet</p>
          ) : (
            categories.map((category, idx) => (
              <div key={category.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: idx < categories.length - 1 ? "1px solid #eee" : "none" }}>
                <span style={{ fontWeight: 500 }}>{category.order}. {category.name}</span>
                <button
                  onClick={() => deleteCategory(category.id)}
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
