"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type TenantAgency = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
  };
};

export default function PlatformAdminAgenciesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUser = session?.user as any;

  const [agencies, setAgencies] = useState<TenantAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    primaryColor: "#000000",
  });

  // Edit state
  const [editingAgency, setEditingAgency] = useState<TenantAgency | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    primaryColor: "",
    isActive: true,
  });

  useEffect(() => {
    // Check if user is PLATFORM_ADMIN
    if (currentUser && currentUser.role !== "PLATFORM_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchAgencies();
  }, [currentUser, router]);

  async function fetchAgencies() {
    try {
      const res = await fetch("/api/platform-admin/agencies");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setAgencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch agencies:", error);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/platform-admin/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setFormData({ name: "", slug: "", primaryColor: "#000000" });
      setShowForm(false);
      fetchAgencies();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to create agency");
    }
    setSaving(false);
  }

  function openEditModal(agency: TenantAgency) {
    setEditingAgency(agency);
    setEditForm({
      name: agency.name,
      primaryColor: agency.primaryColor,
      isActive: agency.isActive,
    });
  }

  async function handleUpdate() {
    if (!editingAgency) return;
    setSaving(true);

    const res = await fetch(`/api/platform-admin/agencies/${editingAgency.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditingAgency(null);
      fetchAgencies();
    }
    setSaving(false);
  }

  async function handleDelete(agency: TenantAgency) {
    if (!confirm(`Delete ${agency.name}? This will remove ${agency._count.users} users!`)) return;

    const res = await fetch(`/api/platform-admin/agencies/${agency.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchAgencies();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to delete agency");
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
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

  // Access denied if not PLATFORM_ADMIN
  if (currentUser?.role !== "PLATFORM_ADMIN") {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}>
              🏢
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
                Platform Admin
              </h1>
              <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
                Manage tenant agencies across Omnixia platform
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.primary }}>
              {agencies.length}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Total Tenant Agencies</div>
          </div>
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.success }}>
              {agencies.filter(a => a.isActive).length}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Agencies</div>
          </div>
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.info }}>
              {agencies.reduce((sum, a) => sum + a._count.users, 0)}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Total Users</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Tenant Agencies</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>+</span> Create Tenant Agency
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Create New Tenant Agency</h3>
            {error && (
              <div style={{
                background: theme.colors.errorBg,
                color: theme.colors.error,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14,
              }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                    Agency Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Acme Corp"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                    Slug * (subdomain)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    placeholder="e.g., acme"
                    style={inputStyle}
                    required
                  />
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                    Will be: {formData.slug || 'slug'}.omnixia.com
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                    Brand Color
                  </label>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{ ...inputStyle, height: 48 }}
                  />
                </div>
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
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    background: saving ? theme.colors.bgTertiary : theme.colors.primary,
                    color: saving ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Creating..." : "Create Agency"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Agencies List */}
        <div style={{ display: "grid", gap: 16 }}>
          {agencies.map((agency) => (
            <div
              key={agency.id}
              style={{
                background: theme.colors.bgSecondary,
                borderRadius: 12,
                padding: 24,
                border: `1px solid ${theme.colors.borderLight}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: agency.primaryColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 24,
                  fontWeight: 700,
                }}>
                  {agency.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                      {agency.name}
                    </h3>
                    {agency.isActive ? (
                      <span style={{
                        padding: "4px 12px",
                        background: theme.colors.successBg,
                        color: theme.colors.success,
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        Active
                      </span>
                    ) : (
                      <span style={{
                        padding: "4px 12px",
                        background: theme.colors.errorBg,
                        color: theme.colors.error,
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {agency.slug}.omnixia.com • {agency._count.users} users • 
                    Created {new Date(agency.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
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
                  onClick={() => handleDelete(agency)}
                  disabled={agency._count.users > 0}
                  style={{
                    padding: "8px 16px",
                    background: agency._count.users > 0 ? theme.colors.bgTertiary : theme.colors.errorBg,
                    color: agency._count.users > 0 ? theme.colors.textMuted : theme.colors.error,
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: agency._count.users > 0 ? "not-allowed" : "pointer",
                  }}
                  title={agency._count.users > 0 ? "Cannot delete agency with users" : "Delete agency"}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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
            width: 500,
            zIndex: 1001,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: 20, fontWeight: 600 }}>
              Edit {editingAgency.name}
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                Agency Name
              </label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                Brand Color
              </label>
              <input
                type="color"
                value={editForm.primaryColor}
                onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })}
                style={{ ...inputStyle, height: 48 }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Agency is Active</span>
              </label>
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
                onClick={handleUpdate}
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
