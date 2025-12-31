"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
};

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: "#fce8e6", color: "#ea4335" },
  MANAGER: { bg: "#fef7e0", color: "#f9ab00" },
  SPECIALIST: { bg: "#e8f0fe", color: "#4285f4" },
  CLIENT: { bg: "#e6f4ea", color: "#34a853" },
};

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "SPECIALIST" });
  const [adding, setAdding] = useState(false);

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

  async function toggleActive(user: User) {
    await fetch(`/api/team/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    fetchUsers();
  }

  async function deleteUser(user: User) {
    if (!confirm(`Delete ${user.email}?`)) return;
    await fetch(`/api/team/${user.id}`, { method: "DELETE" });
    fetchUsers();
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #dadce0",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box" as const,
    outline: "none",
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "#5f6368" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Team</h1>
            <p style={{ color: "#5f6368", fontSize: 15 }}>Manage your team members</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "linear-gradient(135deg, #e85a4f, #d44a3f)",
              color: "white",
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(232, 90, 79, 0.3)"
            }}
          >
            <span style={{ fontSize: 18 }}>+</span> Add User
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", marginBottom: 24 }}>
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
                    placeholder="••••••••"
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
                  background: adding ? "#f1f3f4" : "#e85a4f",
                  color: adding ? "#9aa0a6" : "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: adding ? "not-allowed" : "pointer"
                }}>
                  {adding ? "Adding..." : "Add User"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: "10px 20px",
                  background: "#f1f3f4",
                  color: "#5f6368",
                  border: "none",
                  borderRadius: 8,
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

        {/* Users Table */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
          {users.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>No team members yet</div>
              <div style={{ color: "#5f6368" }}>Add your first team member to get started</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>User</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Role</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Status</th>
                  <th style={{ padding: 16, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: "linear-gradient(135deg, #e85a4f, #f8b739)",
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
                          <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{user.name || "—"}</div>
                          <div style={{ fontSize: 13, color: "#9aa0a6" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        background: ROLE_STYLES[user.role]?.bg || "#f1f3f4",
                        color: ROLE_STYLES[user.role]?.color || "#5f6368"
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
                        background: user.isActive ? "#e6f4ea" : "#fce8e6",
                        color: user.isActive ? "#34a853" : "#ea4335"
                      }}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: 16, textAlign: "right" }}>
                      <button
                        onClick={() => toggleActive(user)}
                        style={{
                          padding: "6px 12px",
                          marginRight: 8,
                          background: "#f1f3f4",
                          color: "#5f6368",
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
                          background: "#fce8e6",
                          color: "#ea4335",
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
