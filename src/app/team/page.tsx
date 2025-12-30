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

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Team</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer" }}
          >
            + Add User
          </button>
        </div>

        {showForm && (
          <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>Add New User</h3>
            <form onSubmit={addUser}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Name</label>
                  <input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SPECIALIST">Specialist</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={adding} style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                  {adding ? "Adding..." : "Add User"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          {users.length === 0 ? (
            <p style={{ padding: 48, textAlign: "center", color: "#888" }}>No team members yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Name</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Email</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Role</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Status</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12, fontWeight: 500 }}>{user.name || "-"}</td>
                    <td style={{ padding: 12, color: "#666" }}>{user.email}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: user.role === "ADMIN" ? "#e3f2fd" : user.role === "MANAGER" ? "#fff3e0" : "#f5f5f5",
                        color: user.role === "ADMIN" ? "#1976d2" : user.role === "MANAGER" ? "#ef6c00" : "#666"
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: user.isActive ? "#e8f5e9" : "#ffebee",
                        color: user.isActive ? "#2e7d32" : "#c62828"
                      }}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => toggleActive(user)}
                        style={{ padding: "4px 8px", marginRight: 8, background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        style={{ padding: "4px 8px", background: "#fee", color: "#c00", border: "none", borderRadius: 4, cursor: "pointer" }}
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
