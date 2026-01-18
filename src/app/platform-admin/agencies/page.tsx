"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
  };
};

export default function TenantManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUser = session?.user as any;

  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    primaryColor: "#000000",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser && currentUser.role !== "PLATFORM_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchTenants();
  }, [currentUser, router]);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/platform-admin/agencies");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setTenants(data);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    }
    setLoading(false);
  }

  function openCreateModal() {
    setFormData({ name: "", slug: "", primaryColor: "#000000" });
    setEditingTenant(null);
    setError("");
    setShowCreateModal(true);
  }

  function openEditModal(tenant: Tenant) {
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      primaryColor: tenant.primaryColor,
    });
    setEditingTenant(tenant);
    setError("");
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
    setEditingTenant(null);
    setFormData({ name: "", slug: "", primaryColor: "#000000" });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = editingTenant
        ? `/api/platform-admin/agencies/${editingTenant.id}`
        : "/api/platform-admin/agencies";
      
      const method = editingTenant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save tenant");
        setSaving(false);
        return;
      }

      closeModal();
      fetchTenants();
    } catch (error) {
      setError("Failed to save tenant");
    }
    setSaving(false);
  }

  async function handleDelete(tenant: Tenant) {
    if (!confirm(`Delete tenant "${tenant.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/platform-admin/agencies/${tenant.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete tenant");
        return;
      }

      fetchTenants();
    } catch (error) {
      alert("Failed to delete tenant");
    }
  }

  async function toggleActive(tenant: Tenant) {
    try {
      const res = await fetch(`/api/platform-admin/agencies/${tenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tenant.name,
          primaryColor: tenant.primaryColor,
          isActive: !tenant.isActive,
        }),
      });

      if (!res.ok) {
        alert("Failed to update tenant");
        return;
      }

      fetchTenants();
    } catch (error) {
      alert("Failed to update tenant");
    }
  }

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

  if (currentUser?.role !== "PLATFORM_ADMIN") {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: theme.gradients.omnixia,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}>
              🏢
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
                Tenant Management
              </h1>
              <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
                Manage tenant agencies using Omnixia
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            style={{
              padding: "12px 24px",
              background: theme.gradients.primary,
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>+</span>
            Create Tenant
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Total Tenants
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: theme.colors.primary }}>
              {tenants.length}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Active Tenants
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: theme.colors.success }}>
              {tenants.filter(t => t.isActive).length}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Total Users
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: theme.colors.info }}>
              {tenants.reduce((sum, t) => sum + (t._count?.users || 0), 0)}
            </div>
          </div>
        </div>

        {/* Tenants Table */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 12,
          border: `1px solid ${theme.colors.borderLight}`,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.colors.borderLight}` }}>
                <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Tenant
                </th>
                <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Slug
                </th>
                <th style={{ padding: "16px 24px", textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Users
                </th>
                <th style={{ padding: "16px 24px", textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Status
                </th>
                <th style={{ padding: "16px 24px", textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Created
                </th>
                <th style={{ padding: "16px 24px", textAlign: "right", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: tenant.primaryColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}>
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                          {tenant.name}
                        </div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                          ID: {tenant.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <code style={{
                      fontSize: 13,
                      color: theme.colors.textSecondary,
                      background: theme.colors.bgTertiary,
                      padding: "4px 8px",
                      borderRadius: 4,
                    }}>
                      {tenant.slug}
                    </code>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.primary }}>
                      {tenant._count?.users || 0}
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center" }}>
                    <button
                      onClick={() => toggleActive(tenant)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 6,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: tenant.isActive ? theme.colors.successBg : theme.colors.errorBg,
                        color: tenant.isActive ? theme.colors.success : theme.colors.error,
                      }}
                    >
                      {tenant.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center", fontSize: 13, color: theme.colors.textSecondary }}>
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => openEditModal(tenant)}
                        style={{
                          padding: "8px 16px",
                          background: theme.colors.infoBg,
                          color: theme.colors.info,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tenant)}
                        style={{
                          padding: "8px 16px",
                          background: theme.colors.errorBg,
                          color: theme.colors.error,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tenants.length === 0 && (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
              No tenants yet. Create your first tenant to get started.
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            padding: 32,
            width: "100%",
            maxWidth: 500,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: theme.colors.textPrimary }}>
              {editingTenant ? "Edit Tenant" : "Create New Tenant"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                  Tenant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., The Wick Firm"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.borderLight}`,
                    background: theme.colors.bgPrimary,
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                  Slug (Subdomain)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                  placeholder="e.g., agency-wick"
                  disabled={!!editingTenant}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.borderLight}`,
                    background: editingTenant ? theme.colors.bgTertiary : theme.colors.bgPrimary,
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                    opacity: editingTenant ? 0.6 : 1,
                  }}
                />
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                  {editingTenant ? "Slug cannot be changed after creation" : "Lowercase letters, numbers, and hyphens only"}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                  Brand Color
                </label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{
                      width: 60,
                      height: 44,
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.borderLight}`,
                      cursor: "pointer",
                    }}
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.borderLight}`,
                      background: theme.colors.bgPrimary,
                      fontSize: 14,
                      color: theme.colors.textPrimary,
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  background: theme.colors.errorBg,
                  color: theme.colors.error,
                  fontSize: 14,
                  marginBottom: 20,
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    padding: "12px 24px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "12px 24px",
                    background: theme.gradients.primary,
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? "Saving..." : (editingTenant ? "Save Changes" : "Create Tenant")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
