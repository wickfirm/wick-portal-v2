"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/team/${params.id}`).then(res => res.json()),
      fetch("/api/clients").then(res => res.json())
    ]).then(([u, c]) => {
      setUser(u);
      setClients(c);
      setLoading(false);
    }).catch(() => { setError("Failed to load"); setLoading(false); });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      clientId: formData.get("clientId") || null,
      isActive: formData.get("isActive") === "true",
    };
    
    const newPassword = formData.get("password") as string;
    if (newPassword) data.password = newPassword;

    const res = await fetch(`/api/team/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/team");
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to update");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/team/${params.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/team"); router.refresh(); }
    else setError("Failed to delete");
  }

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;
  if (!user) return <div style={{ padding: 48, textAlign: "center" }}>User not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 24 }}>
        <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
          <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
          <Link href="/team" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Team</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>← Back to Team</Link>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h1 style={{ marginTop: 0, marginBottom: 24 }}>Edit Team Member</h1>

          {error && <div style={{ background: "#fee", color: "#c00", padding: 12, borderRadius: 4, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Name *</label>
              <input name="name" required defaultValue={user.name} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Email *</label>
              <input name="email" type="email" required defaultValue={user.email} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>New Password <span style={{ fontWeight: 400, color: "#888" }}>(leave blank to keep current)</span></label>
              <input name="password" type="password" minLength={6} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Role *</label>
              <select name="role" required defaultValue={user.role} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
                <option value="SPECIALIST">Specialist</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Associated Client</label>
              <select name="clientId" defaultValue={user.clientId || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
                <option value="">None</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Status</label>
              <select name="isActive" defaultValue={user.isActive ? "true" : "false"} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: 12, background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link href="/team" style={{ padding: 12, border: "1px solid #ddd", borderRadius: 4, textDecoration: "none", color: "#333", textAlign: "center" }}>
                Cancel
              </Link>
            </div>
          </form>

          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #eee" }} />
          <button onClick={handleDelete} style={{ width: "100%", padding: 12, background: "#fee", color: "#c00", border: "1px solid #fcc", borderRadius: 4, cursor: "pointer" }}>
            Delete User
          </button>
        </div>
      </main>
    </div>
  );
}
