"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type PartnerAgency = {
  id: string;
  name: string;
  createdAt: string;
};

export default function PartnerAgenciesPage() {
  const { data: session, status } = useSession();
  const currentUser = session?.user as any;

  // Redirect MEMBERs - they shouldn't access this page
  useEffect(() => {
    if (currentUser?.role === "MEMBER") {
      window.location.href = "/dashboard";
    }
  }, [currentUser]);

  const [showForm, setShowForm] = useState(false);
  const [newAgency, setNewAgency] = useState({ name: "" });
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingAgency, setEditingAgency] = useState<PartnerAgency | null>(null);
  const [editForm, setEditForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);

  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(currentUser?.role);

  // Fetch agencies with React Query
  const { data: agencies = [], isLoading: loading, refetch } = useQuery<PartnerAgency[]>({
    queryKey: ["partner-agencies"],
    queryFn: async () => {
      const res = await fetch("/api/partner-agencies");
      if (!res.ok) throw new Error("Failed to fetch agencies");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  async function addAgency(e: React.FormEvent) {
    e.preventDefault();
    if (!newAgency.name.trim()) return;

    setAdding(true);
    const res = await fetch("/api/partner-agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAgency),
    });

    if (res.ok) {
      setNewAgency({ name: "" });
      setShowForm(false);
      refetch(); // Refresh agencies
    }
    setAdding(false);
  }

  function openEditModal(agency: PartnerAgency) {
    setEditingAgency(agency);
    setEditForm({ name: agency.name });
  }

  async function saveEdit() {
    if (!editingAgency) return;
    setSaving(true);

    const res = await fetch(`/api/partner-agencies/${editingAgency.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditingAgency(null);
      refetch(); // Refresh agencies
    }
    setSaving(false);
  }

  async function deleteAgency(agency: PartnerAgency) {
    if (!confirm(`Delete ${agency.name}?`)) return;

    await fetch(`/api/partner-agencies/${agency.id}`, { method: "DELETE" });
    refetch(); // Refresh agencies
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

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          {/* Header Skeleton */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <div style={{ width: 200, height: 36, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ width: 320, height: 20, background: theme.colors.bgSecondary, borderRadius: 6 }} />
            </div>
            <div style={{ width: 140, height: 44, background: theme.colors.bgSecondary, borderRadius: 8 }} />
          </div>

          {/* Stats Skeleton */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ width: 80, height: 40, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: 120, height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
            ))}
          </div>

          {/* Agencies List Skeleton */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ padding: 24, borderBottom: i < 4 ? "1px solid " + theme.colors.bgTertiary : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ width: "50%", height: 24, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ width: "30%", height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ width: 70, height: 36, background: theme.colors.bgTertiary, borderRadius: 6 }} />
                    <div style={{ width: 70, height: 36, background: theme.colors.bgTertiary, borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
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
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>
              Partner Agencies
            </h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
              Manage external agencies that collaborate on your client projects (ATC, UDMS, etc.)
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
                boxShadow: theme.shadows.button,
              }}
            >
              <span style={{ fontSize: 18 }}>+</span> Add Partner Agency
            </button>
          )}
        </div>

        {/* Info Box */}
        <div style={{
          background: theme.colors.infoBg,
          border: `1px solid ${theme.colors.info}`,
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 14, color: theme.colors.info, margin: 0 }}>
            💡 <strong>What are Partner Agencies?</strong> These are external companies (like ATC, UDMS) that 
            collaborate with you on specific client projects. Assign them when creating/editing clients to show 
            transparency on client dashboards.
          </p>
        </div>

        {/* Add Form */}
        {showForm && isAdmin && (
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
            marginBottom: 24,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Add New Partner Agency</h3>
            <form onSubmit={addAgency}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Agency Name
                </label>
                <input
                  type="text"
                  value={newAgency.name}
                  onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })}
                  placeholder="e.g., ATC, UDMS"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "10px 20px",
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
                  type="submit"
                  disabled={adding}
                  style={{
                    padding: "10px 20px",
                    background: adding ? theme.colors.bgTertiary : theme.colors.primary,
                    color: adding ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: adding ? "not-allowed" : "pointer",
                  }}
                >
                  {adding ? "Adding..." : "Add Agency"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Agencies List */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          overflow: "hidden",
        }}>
          {agencies.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg></div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No partner agencies yet</h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                Add your first partner agency to get started
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16, padding: 24 }}>
              {agencies.map((agency) => (
                <div
                  key={agency.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 20,
                    background: theme.colors.bgPrimary,
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.borderLight}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: theme.gradients.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 18,
                      fontWeight: 600,
                    }}>
                      {agency.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                        {agency.name}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                        Added {new Date(agency.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openEditModal(agency)}
                        style={{
                          padding: "8px 16px",
                          background: theme.colors.infoBg,
                          color: theme.colors.info,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAgency(agency)}
                        style={{
                          padding: "8px 16px",
                          background: theme.colors.errorBg,
                          color: theme.colors.error,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
              Edit Partner Agency
            </h3>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                Agency Name
              </label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={inputStyle}
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
