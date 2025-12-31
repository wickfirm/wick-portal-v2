"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(res => res.json()),
      fetch("/api/clients").then(res => res.json()),
    ]).then(([projectData, clientsData]) => {
      setProject(projectData);
      setClients(clientsData);
      setLoading(false);
    });
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description") || null,
      clientId: formData.get("clientId"),
      serviceType: formData.get("serviceType"),
      status: formData.get("status"),
      startDate: formData.get("startDate") || null,
      endDate: formData.get("endDate") || null,
      budget: formData.get("budget") ? parseFloat(formData.get("budget") as string) : null,
    };

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(`/projects/${projectId}`);
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to update project");
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #dadce0",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box" as const,
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontWeight: 500,
    fontSize: 14,
    color: "#1a1a1a",
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "#5f6368" }}>Loading...</div>;
  if (!project) return <div style={{ padding: 48, textAlign: "center", color: "#5f6368" }}>Project not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/projects/${projectId}`} style={{ color: "#5f6368", textDecoration: "none", fontSize: 14 }}>
            ← Back to {project.name}
          </Link>
        </div>

        <div style={{ background: "white", padding: 32, borderRadius: 12, border: "1px solid #e8eaed" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1a1a", marginTop: 0, marginBottom: 8 }}>Edit Project</h1>
          <p style={{ color: "#5f6368", marginBottom: 32, fontSize: 14 }}>Update project details</p>

          {error && (
            <div style={{ background: "#fce8e6", color: "#ea4335", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Project Name *</label>
              <input name="name" required defaultValue={project.name} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Client *</label>
              <select name="clientId" required defaultValue={project.clientId} style={{ ...inputStyle, cursor: "pointer" }}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Service Type *</label>
                <select name="serviceType" required defaultValue={project.serviceType} style={{ ...inputStyle, cursor: "pointer" }}>
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
                <select name="status" defaultValue={project.status} style={{ ...inputStyle, cursor: "pointer" }}>
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
              <textarea name="description" rows={3} defaultValue={project.description || ""} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input name="startDate" type="date" defaultValue={project.startDate?.split("T")[0] || ""} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input name="endDate" type="date" defaultValue={project.endDate?.split("T")[0] || ""} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>Budget (USD)</label>
              <input name="budget" type="number" step="0.01" defaultValue={project.budget || ""} style={inputStyle} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} style={{
                flex: 1,
                padding: 14,
                background: saving ? "#f1f3f4" : "linear-gradient(135deg, #e85a4f, #d44a3f)",
                color: saving ? "#9aa0a6" : "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
              }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link href={`/projects/${projectId}`} style={{
                padding: "14px 24px",
                border: "1px solid #dadce0",
                borderRadius: 8,
                textDecoration: "none",
                color: "#5f6368",
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
