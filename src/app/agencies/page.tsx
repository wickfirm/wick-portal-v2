"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type Agency = {
  id: string;
  name: string;
  createdAt: string;
  _count?: {
    users: number;
  };
};

export default function AgenciesPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAgency, setNewAgency] = useState({ name: "" });
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editForm, setEditForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(currentUser?.role);

  useEffect(() => {
    fetchAgencies();
  }, []);

  async function fetchAgencies() {
    try {
      const res = await fetch("/api/agencies");
      const data = await res.json();
      setAgencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch agencies:", error);
    }
    setLoading(false);
  }

  async function addAgency(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    const res = await fetch("/api/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAgency),
    });

    if (res.ok) {
      setNewAgency({ name: "" });
      setShowForm(false);
      fetchAgencies();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add agency");
    }
    setAdding(false);
  }

  function openEditModal(agency: Agency) {
    setEditingAgency(agency);
    setEditForm({ name: agency.name });
  }

  async function saveEdit() {
    if (!editingAgency) return;
    setSaving(true);

    const res = await fetch(`/api/agencies/${editingAgency.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditingAgency(null);
      fetchAgencies();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update agency");
    }
    setSaving(false);
  }

  async function deleteAgency(agency: Agency) {
    if (!confirm(`Delete "${agency.name}"? This will remove the agency assignment from all users.`)) return;
    
    const res = await fetch(`/api/agencies/${agency.id}`, { method: "DELETE" });
    if (res.ok) {
      fetchAgencies();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete agency");
    }
  }

  function navigateToAgency(agencyId: string) {
    window.location.href = `/agencies/${agencyId}`;
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
              Agencies
            </h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
              Manage partner agencies and their team members
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                background: theme.gradients.primary,
                color: "white",
                padding: "12px 24px",
                borderRadius: theme.borderRadius.md,
                border: "none",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: theme.shadows.button
              }}
            >
              <span style={{ fontSize: 18 }}>+</span> Add Agency
            </button>
          )}
        </div>

        {/* Add Agency Form */}
        {showForm && isAdmin && (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            padding: 24, 
            borderRadius: theme.borderRadius.lg, 
            border: "1px solid " + theme.colors.borderLight, 
            marginBottom: 24 
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Add New Agency</h3>
            <form onSubmit={addAgency}>
              <div style={{ maxWidth: 400, marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name *</label>
                <input
                  value={newAgency.name}
                  onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })}
                  required
                  style={inputStyle}
                  placeholder="Agency Name"
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={adding} style={{
                  padding: "10px 20px",
                  background: adding ? theme.colors.bgTertiary : theme.colors.primary,
                  color: adding ? theme.colors.textMuted : "white",
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: adding ? "not-allowed" : "pointer"
                }}>
                  {adding ? "Adding..." : "Add Agency"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: "10px 20px",
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textSecondary,
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer"
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Agencies Grid */}
        {agencies.length === 0 ? (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            borderRadius: theme.borderRadius.lg, 
            border: "1px solid " + theme.colors.borderLight,
            padding: 64, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>
              No agencies yet
            </div>
            <div style={{ color: theme.colors.textSecondary }}>
              Add your first partner agency to get started
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
            {agencies.map((agency) => (
              <div
                key={agency.id}
                onClick={() => navigateToAgency(agency.id)}
                style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.borderRadius.lg,
                  border: "1px solid " + theme.colors.borderLight,
                  padding: 24,
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.boxShadow = theme.shadows.card;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.borderLight;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: theme.gradients.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 20,
                    }}>
                      {agency.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary }}>
                        {agency.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary }}>
                        {agency._count?.users || 0}
                      </span>
                      <span style={{ fontSize: 13, color: theme.colors.textMuted, marginLeft: 4 }}>
                        members
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(agency);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: theme.colors.infoBg,
                          color: theme.colors.info,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAgency(agency);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: theme.colors.errorBg,
                          color: theme.colors.error,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingAgency && (
        <>
          <div
            onClick={() => setEditingAgency(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 1000,
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            padding: 32,
            width: 400,
            zIndex: 1001,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: 20, fontWeight: 600 }}>
              Edit Agency
            </h3>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name *</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={inputStyle}
                placeholder="Agency Name"
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setEditingAgency(null)}
                style={{
                  flex: 1,
                  padding: "12px 20px",
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
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  background: saving ? theme.colors.bgTertiary : theme.colors.primary,
                  color: saving ? theme.colors.textMuted : "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
