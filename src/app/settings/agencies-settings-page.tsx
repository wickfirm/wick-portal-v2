"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type Agency = {
  id: string;
  name: string;
  isDefault: boolean;
};

export default function AgenciesSettingsPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", isDefault: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAgencies();
  }, []);

  async function fetchAgencies() {
    const res = await fetch("/api/agencies");
    if (res.ok) {
      const data = await res.json();
      setAgencies(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setSaving(true);
    setError("");

    const url = editingId ? `/api/agencies/${editingId}` : "/api/agencies";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setFormData({ name: "", isDefault: false });
      setShowForm(false);
      setEditingId(null);
      fetchAgencies();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save agency");
    }
    
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this agency?")) return;

    const res = await fetch(`/api/agencies/${id}`, { method: "DELETE" });
    
    if (res.ok) {
      fetchAgencies();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete agency");
    }
  }

  function startEdit(agency: Agency) {
    setEditingId(agency.id);
    setFormData({ name: agency.name, isDefault: agency.isDefault });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ name: "", isDefault: false });
    setShowForm(false);
    setError("");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>Agencies</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage agencies that service your clients</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "12px 24px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>+</span> Add Agency
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            padding: 24, 
            borderRadius: 12, 
            border: "1px solid " + theme.colors.borderLight, 
            marginBottom: 24 
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>
              {editingId ? "Edit Agency" : "New Agency"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Agency Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wick, UDMS, Around the Clock"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>Set as default agency for new clients</span>
                </label>
              </div>

              {error && (
                <div style={{ 
                  padding: 12, 
                  background: theme.colors.errorBg, 
                  color: theme.colors.error, 
                  borderRadius: 8, 
                  marginBottom: 16,
                  fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "12px 24px",
                    background: saving ? theme.colors.bgTertiary : theme.colors.primary,
                    color: saving ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Agency"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: "12px 24px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Agencies List */}
        <div style={{ 
          background: theme.colors.bgSecondary, 
          borderRadius: 12, 
          border: "1px solid " + theme.colors.borderLight, 
          overflow: "hidden" 
        }}>
          <div style={{ 
            padding: "16px 20px", 
            borderBottom: "1px solid " + theme.colors.borderLight, 
            background: theme.colors.bgPrimary 
          }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Agencies ({agencies.length})</h3>
          </div>

          {agencies.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
              No agencies yet. Add your first agency above.
            </div>
          ) : (
            <div>
              {agencies.map((agency, idx) => (
                <div
                  key={agency.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: idx < agencies.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 8, 
                      background: theme.colors.primary + "15", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      fontSize: 16,
                    }}>
                      🏢
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                        {agency.name}
                        {agency.isDefault && (
                          <span style={{ 
                            marginLeft: 8, 
                            padding: "2px 8px", 
                            background: theme.colors.successBg, 
                            color: theme.colors.success, 
                            fontSize: 10, 
                            fontWeight: 600,
                            borderRadius: 4,
                          }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => startEdit(agency)}
                      style={{
                        padding: "6px 12px",
                        background: theme.colors.bgTertiary,
                        color: theme.colors.textSecondary,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(agency.id)}
                      style={{
                        padding: "6px 12px",
                        background: theme.colors.errorBg,
                        color: theme.colors.error,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
