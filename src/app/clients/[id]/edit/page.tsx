"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then(res => res.json())
      .then(data => {
        setClient(data);
        setLoading(false);
      });
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      industry: formData.get("industry") || null,
      website: formData.get("website") || null,
      status: formData.get("status"),
      primaryContact: formData.get("primaryContact") || null,
      primaryEmail: formData.get("primaryEmail") || null,
      monthlyRetainer: formData.get("monthlyRetainer") ? parseFloat(formData.get("monthlyRetainer") as string) : null,
    };

    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(`/clients/${clientId}`);
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to update client");
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;
  if (!client) return <div style={{ padding: 48, textAlign: "center" }}>Client not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header />

      <main style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/clients/${clientId}`} style={{ color: "#666", textDecoration: "none" }}>← Back to {client.name}</Link>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h1 style={{ marginTop: 0, marginBottom: 24 }}>Edit Client</h1>

          {error && <div style={{ background: "#fee", color: "#c00", padding: 12, borderRadius: 4, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Client Name *</label>
              <input name="name" required defaultValue={client.name} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Industry</label>
              <input name="industry" defaultValue={client.industry || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Website</label>
              <input name="website" type="url" defaultValue={client.website || ""} placeholder="https://" style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Status</label>
              <select name="status" defaultValue={client.status} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}>
                <option value="LEAD">Lead</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CHURNED">Churned</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Primary Contact</label>
              <input name="primaryContact" defaultValue={client.primaryContact || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Primary Email</label>
              <input name="primaryEmail" type="email" defaultValue={client.primaryEmail || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Monthly Retainer (USD)</label>
              <input name="monthlyRetainer" type="number" step="0.01" defaultValue={client.monthlyRetainer || ""} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: 12, background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link href={`/clients/${clientId}`} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 4, textDecoration: "none", color: "#333", textAlign: "center" }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
