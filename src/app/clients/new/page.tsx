"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      industry: formData.get("industry") || null,
      website: formData.get("website") || null,
      status: formData.get("status") || "LEAD",
      primaryContact: formData.get("primaryContact") || null,
      primaryEmail: formData.get("primaryEmail") || null,
      monthlyRetainer: formData.get("monthlyRetainer") ? parseFloat(formData.get("monthlyRetainer") as string) : null,
    };

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/clients");
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to create client");
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #dadce0",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box" as const,
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontWeight: 500,
    fontSize: 14,
    color: "#1a1a1a",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/clients" style={{ color: "#5f6368", textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
            ← Back to Clients
          </Link>
        </div>

        <div style={{ background: "white", padding: 32, borderRadius: 12, border: "1px solid #e8eaed" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1a1a", marginTop: 0, marginBottom: 8 }}>New Client</h1>
          <p style={{ color: "#5f6368", marginBottom: 32, fontSize: 14 }}>Add a new client to your portfolio</p>

          {error && (
            <div style={{ background: "#fce8e6", color: "#ea4335", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Client Name *</label>
              <input name="name" required style={inputStyle} placeholder="Acme Corporation" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Industry</label>
                <input name="industry" style={inputStyle} placeholder="Technology" />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input name="website" type="url" style={inputStyle} placeholder="https://example.com" />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Status</label>
              <select name="status" defaultValue="LEAD" style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="LEAD">Lead</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CHURNED">Churned</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Primary Contact</label>
                <input name="primaryContact" style={inputStyle} placeholder="John Smith" />
              </div>
              <div>
                <label style={labelStyle}>Primary Email</label>
                <input name="primaryEmail" type="email" style={inputStyle} placeholder="john@example.com" />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>Monthly Retainer (USD)</label>
              <input name="monthlyRetainer" type="number" step="0.01" style={inputStyle} placeholder="5000" />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={loading} style={{
                flex: 1,
                padding: 14,
                background: loading ? "#f1f3f4" : "linear-gradient(135deg, #e85a4f, #d44a3f)",
                color: loading ? "#9aa0a6" : "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Creating..." : "Create Client"}
              </button>
              <Link href="/clients" style={{
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
