"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/clients").then(res => res.json()).then(setClients);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      clientId: formData.get("clientId"),
      serviceType: formData.get("serviceType"),
      status: formData.get("status"),
      startDate: formData.get("startDate") || null,
      budget: formData.get("budget") ? parseFloat(formData.get("budget") as string) : null,
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/projects");
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to create project");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 24 }}>
        <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
          <Link href="/projects" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Projects</Link>
          <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>← Back to Projects</Link>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h1 style={{ marginTop: 0, marginBottom: 24 }}>New Project</h1>

          {error && <div style={{ background: "#fee", color: "#c00", padding: 12, borderRadius: 4, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Project Name *</label>
              <input name="name" required style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Client *</label>
              <select name="clientId" required style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
                <option value="">Select a client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Service Type *</label>
              <select name="serviceType" required style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
                <option value="SEO">SEO</option>
                <option value="AEO">AEO</option>
                <option value="WEB_DEVELOPMENT">Web Development</option>
                <option value="PAID_MEDIA">Paid Media</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="CONTENT">Content</option>
                <option value="BRANDING">Branding</option>
                <option value="CONSULTING">Consulting</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Status</label>
              <select name="status" defaultValue="DRAFT" style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Description</label>
              <textarea name="description" rows={3} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Start Date</label>
              <input name="startDate" type="date" style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Budget (USD)</label>
              <input name="budget" type="number" step="0.01" style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: 12, background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                {loading ? "Creating..." : "Create Project"}
              </button>
              <Link href="/projects" style={{ padding: 12, border: "1px solid #ddd", borderRadius: 4, textDecoration: "none", color: "#333", textAlign: "center" }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
