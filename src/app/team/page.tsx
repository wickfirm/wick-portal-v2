"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import { theme, ROLE_STYLES } from "@/lib/theme";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
};

export default function TeamPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "SPECIALIST" });
  const [adding, setAdding] = useState(false);
  
  // Edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const res = await fetch("/api/team");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (res.ok) {
      setNewUser({ email: "", name: "", password: "", role: "SPECIALIST" });
      setShowForm(false);
      fetchUsers();
    } else {
      alert("Failed to add user");
    }
    setAdding(false);
  }

  function startEdit(user: User) {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email,
      role: user.role,
      password: ""
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);

    const payload: any = {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
    };
    
    if (editForm.password) {
      payload.password = editForm.password;
    }

    const res = await fetch("/api/team/" + editingUser.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditingUser(null);
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update user");
    }
    setSaving(false);
  }

  async function toggleActive(user: User) {
    await fetch("/api/team/" + user.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    fetchUsers();
  }

  async function deleteUser(user: User) {
    if (!confirm("Delete " + user.email + "?")) return;
    await fetch("/api/team/" + user.id, { method: "DELETE" });
    fetchUsers();
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

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header userName={currentUser?.name} userRole={currentUser?.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Team</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage your team members</p>
          </div>
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
            <span style={{ fontSize: 18 }}>+</span> Add User
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Add New User</h3>
            <form onSubmit={addUser}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    style={inputStyle}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name</label>
                  <input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    style={inputStyle}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    style={inputStyle}
                    placeholder="********"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SPECIALIST">Specialist</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>
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
                  {adding ? "Adding..." : "Add User"}
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

        {/* Edit User Modal */}
        {editingUser && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              background: theme.colors.bgSecondary,
              padding: 32,
              borderRadius: theme.borderRadius.xl,
              width: "100%",
              maxWidth: 500,
              boxShadow: theme.shadows.lg
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 0, marginBottom: 24, color: theme.colors.textPrimary }}>
                Edit User
              </h2>
              <form onSubmit={saveEdit}>
                <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={inputStyle}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SPECIALIST">Specialist</option>
                      <option value="CLIENT">Client</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                      New Password <span style={{ color: theme.colors.textMuted, fontWeight: 400 }}>(leave blank to keep current)</span>
                    </label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      style={inputStyle}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    style={{
                      padding: "12px 24px",
                      background: theme.colors.bgTertiary,
                      color: theme.colors.textSecondary,
                      border: "none",
                      borderRadius: theme.borderRadius.md,
                      fontWeight: 500,
                      fontSize: 14,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: "12px 24px",
                      background: saving ? theme.colors.bgTertiary : theme.colors.primary,
                      color: saving ? theme.colors.textMuted : "white",
                      border: "none",
                      borderRadius: theme.borderRadius.md,
                      fontWeight: 500,
                      fontSize: 14,
                      cursor: saving ? "not-allowed" : "pointer"
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          {users.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No team members yet</div>
              <div style={{ color: theme.colors.textSecondary }}>Add your first team member to get started</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: theme.colors.bgPrimary }}>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>User</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Role</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Status</th>
                  <th style={{ padding: 16, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: theme.gradients.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 600,
                          fontSize: 14
                        }}>
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{user.name || "-"}</div>
                          <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        background: ROLE_STYLES[user.role]?.bg || theme.colors.bgTertiary,
                        color: ROLE_STYLES[user.role]?.color || theme.colors.textSecondary
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        background: user.isActive ? theme.colors.successBg : theme.colors.errorBg,
                        color: user.isActive ? theme.colors.success : theme.colors.error
                      }}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: 16, textAlign: "right" }}>
                      <button
                        onClick={() => startEdit(user)}
                        style={{
                          padding: "6px 12px",
                          marginRight: 8,
                          background: theme.colors.infoBg,
                          color: theme.colors.info,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        style={{
                          padding: "6px 12px",
                          marginRight: 8,
                          background: theme.colors.bgTertiary,
                          color: theme.colors.textSecondary,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        style={{
                          padding: "6px 12px",
                          background: theme.colors.errorBg,
                          color: theme.colors.error,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
