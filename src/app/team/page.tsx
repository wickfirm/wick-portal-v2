"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type Agency = { id: string; name: string };
type Client = { id: string; name: string; nickname: string | null };
type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  agency: Agency | null;
  clientAssignments: { client: Client }[];
};

export default function TeamPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: "", 
    name: "", 
    password: "", 
    role: "MEMBER",
    agencyId: "",
    clientIds: [] as string[]
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/team").then(res => res.json()),
      fetch("/api/agencies").then(res => res.json()),
      fetch("/api/clients").then(res => res.json()),
    ]).then(([usersData, agenciesData, clientsData]) => {
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAgencies(Array.isArray(agenciesData) ? agenciesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setLoading(false);
    });
  }, []);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");

    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (res.ok) {
      setNewUser({ email: "", name: "", password: "", role: "MEMBER", agencyId: "", clientIds: [] });
      setShowForm(false);
      const updated = await fetch("/api/team").then(r => r.json());
      setUsers(updated);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add user");
    }
    setAdding(false);
  }

  function toggleClientSelection(clientId: string) {
    setNewUser(prev => ({
      ...prev,
      clientIds: prev.clientIds.includes(clientId)
        ? prev.clientIds.filter(id => id !== clientId)
        : [...prev.clientIds, clientId]
    }));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    boxSizing: "border-box",
  };

  const roleColors: Record<string, { bg: string; color: string }> = {
    SUPER_ADMIN: { bg: "#FEE2E2", color: "#DC2626" },
    ADMIN: { bg: "#DBEAFE", color: "#2563EB" },
    MANAGER: { bg: "#FEF3C7", color: "#D97706" },
    MEMBER: { bg: "#E0E7FF", color: "#4F46E5" },
    CLIENT: { bg: "#D1FAE5", color: "#059669" },
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Team</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage your team members</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "12px 24px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>+</span> Add User
            </button>
          )}
        </div>

        {/* Add User Form */}
        {showForm && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Add New User</h3>
            
            {error && (
              <div style={{ padding: 12, background: theme.colors.errorBg, color: theme.colors.error, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Email *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name</label>
                  <input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Password *</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Agency</label>
                  <select
                    value={newUser.agencyId}
                    onChange={(e) => setNewUser({ ...newUser, agencyId: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">No Agency</option>
                    {agencies.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Assignment */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Assign to Clients</label>
                <div style={{ 
                  border: "1px solid " + theme.colors.borderMedium, 
                  borderRadius: theme.borderRadius.md, 
                  maxHeight: 160, 
                  overflowY: "auto",
                  padding: 8,
                }}>
                  {clients.length === 0 ? (
                    <div style={{ padding: 12, color: theme.colors.textMuted, fontSize: 13 }}>No clients available</div>
                  ) : (
                    clients.map(client => (
                      <label
                        key={client.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          background: newUser.clientIds.includes(client.id) ? theme.colors.infoBg : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newUser.clientIds.includes(client.id)}
                          onChange={() => toggleClientSelection(client.id)}
                        />
                        <span style={{ fontSize: 14 }}>{client.name}</span>
                        {client.nickname && (
                          <span style={{ fontSize: 12, color: theme.colors.textMuted }}>({client.nickname})</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
                {newUser.clientIds.length > 0 && (
                  <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 6 }}>
                    {newUser.clientIds.length} client(s) selected
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={adding}
                  style={{
                    padding: "10px 20px",
                    background: adding ? theme.colors.bgTertiary : theme.colors.primary,
                    color: adding ? theme.colors.textMuted : "white",
                    border: "none",
                    borderRadius: theme.borderRadius.md,
                    fontWeight: 500,
                    cursor: adding ? "not-allowed" : "pointer",
                  }}
                >
                  {adding ? "Adding..." : "Add User"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                    setNewUser({ email: "", name: "", password: "", role: "MEMBER", agencyId: "", clientIds: [] });
                  }}
                  style={{
                    padding: "10px 20px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: theme.borderRadius.md,
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

        {/* Users List */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, background: theme.colors.bgPrimary }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Team Members ({users.length})</h3>
          </div>

          {users.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>No team members yet</div>
          ) : (
            <div>
              {users.map((user, idx) => (
                <div
                  key={user.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: idx < users.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      background: theme.gradients.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 16,
                    }}>
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 2 }}>
                        {user.name || "No name"}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{user.email}</div>
                      {user.agency && (
                        <div style={{ fontSize: 11, color: theme.colors.primary, marginTop: 2 }}>
                          {user.agency.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Assigned Clients */}
                    {user.clientAssignments.length > 0 && (
                      <div style={{ display: "flex", gap: 4 }}>
                        {user.clientAssignments.slice(0, 3).map(ca => (
                          <span
                            key={ca.client.id}
                            style={{
                              padding: "2px 8px",
                              background: theme.colors.bgTertiary,
                              borderRadius: 4,
                              fontSize: 11,
                              color: theme.colors.textSecondary,
                            }}
                          >
                            {ca.client.nickname || ca.client.name}
                          </span>
                        ))}
                        {user.clientAssignments.length > 3 && (
                          <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
                            +{user.clientAssignments.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <span style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: roleColors[user.role]?.bg || theme.colors.bgTertiary,
                      color: roleColors[user.role]?.color || theme.colors.textMuted,
                    }}>
                      {user.role.replace("_", " ")}
                    </span>

                    <Link
                      href={`/team/${user.id}/edit`}
                      style={{
                        padding: "6px 14px",
                        background: theme.colors.bgTertiary,
                        color: theme.colors.textSecondary,
                        borderRadius: 6,
                        fontSize: 13,
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Edit
                    </Link>
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
