"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/clients")
      .then(res => res.json())
      .then(data => {
        if (data && data.clients && Array.isArray(data.clients)) {
          setClients(data.clients);
        } else if (Array.isArray(data)) {
          setClients(data);
        } else {
          setClients([]);
        }
      })
      .catch(err => {
        console.error("Failed to load clients:", err);
        setClients([]);
      });
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

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    boxSizing: "border-box" as const,
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontWeight: 500,
    fontSize: 14,
    color: theme.colors.textPrimary,
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/projects" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Projects
          </Link>
        </div>

        <div style={{ background: theme.colors.bgSecondary, padding: 32, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textPrimary, marginTop: 0, marginBottom: 8 }}>New Project</h1>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 32, fontSize: 14 }}>Create a new project for a client</p>

          {error && (
            <div style={{ background: theme.colors.errorBg, color: theme.colors.error, padding: "12px 16px", borderRadius: theme.borderRadius.md, marginBottom: 24, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Project Name *</label>
              <input name="name" required style={inputStyle} placeholder="Website Redesign" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Client *</label>
              <select name="clientId" required defaultValue={preselectedClientId || ""} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Select a client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Service Type *</label>
                <select name="serviceType" required style={{ ...inputStyle, cursor: "pointer" }}>
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
              <div>
                <label style={labelStyle}>Status</label>
                <select name="status" defaultValue="DRAFT" style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Description</label>
              <textarea name="description" rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Brief project description..." />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input name="startDate" type="date" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Budget (USD)</label>
                <input name="budget" type="number" step="0.01" style={inputStyle} placeholder="5000" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={loading} style={{
                flex: 1,
                padding: 14,
                background: loading ? theme.colors.bgTertiary : theme.gradients.primary,
                color: loading ? theme.colors.textMuted : "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Creating..." : "Create Project"}
              </button>
              <Link href="/projects" style={{
                padding: "14px 24px",
                border: "1px solid " + theme.colors.borderMedium,
                borderRadius: theme.borderRadius.md,
                textDecoration: "none",
                color: theme.colors.textSecondary,
                fontWeight: 500,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
              }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
