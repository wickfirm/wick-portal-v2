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

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;
  if (!project) return <div style={{ padding: 48, textAlign: "center" }}>Project not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header />

      <main style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/projects/${projectId}`} style={{ color: "#666", textDecoration: "none" }}>← Back to {project.name}</Link>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h1 style={{ marginTop: 0, marginBottom: 24 }}>Edit Project</h1>

          {error && <div style={{ background: "#fee", color: "#c00", padding: 12, borderRadius: 4, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Project Name *</label>
              <input name="name" required defaultValue={project.name} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Client *</label>
              <select name="clientId" required defaultValue={project.clientId} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Service Type *</label>
              <select name="serviceType" required defaultValue={project.serviceType} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
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
              <select name="status" defaultValue={project.status} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
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
              <textarea name="description" rows={3} defaultValue={project.description || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Start Date</label>
                <input name="startDate" type="date" defaultValue={project.startDate?.split("T")[0] || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>End Date</label>
                <input name="endDate" type="date" defaultValue={project.endDate?.split("T")[0] || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Budget (USD)</label>
              <input name="budget" type="number" step="0.01" defaultValue={project.budget || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: 12, background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link href={`/projects/${projectId}`} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 4, textDecoration: "none", color: "#333", textAlign: "center" }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
