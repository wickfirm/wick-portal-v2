"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import { theme, ROLE_STYLES } from "@/lib/theme";
import Link from "next/link";

type Agency = {
  id: string;
  name: string;
};

type ClientAssignment = {
  id: string;
  client: {
    id: string;
    name: string;
    nickname: string | null;
  };
};

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  agencyId?: string | null;
  agency?: Agency | null;
  clientAssignments?: ClientAssignment[];
};

type Client = {
  id: string;
  name: string;
  nickname: string | null;
};

export default function TeamPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  // Redirect MEMBERs - they shouldn't access this page
  useEffect(() => {
    if (currentUser?.role === "MEMBER") {
      window.location.href = "/dashboard";
    }
  }, [currentUser]);

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
    clientIds: [] as string[],
  });
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    agencyId: "",
    clientIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const isClientRole = currentUser?.role === "CLIENT";
  const isExternalPartner = currentUser?.agencyId === null && currentUser?.role !== "PLATFORM_ADMIN";

  // Redirect external partners - they shouldn't access team management
  useEffect(() => {
    if (isExternalPartner) {
      window.location.href = "/dashboard";
    }
  }, [isExternalPartner]);

  useEffect(() => {
    if (isExternalPartner) return; // Don't fetch if redirecting
    fetchData();
  }, [isExternalPartner]);

  async function fetchData() {
    try {
      const [usersRes, agenciesRes, clientsRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/agencies"),
        fetch("/api/clients"),
      ]);
      
      const [usersData, agenciesData, clientsData] = await Promise.all([
        usersRes.json(),
        agenciesRes.json(),
        clientsRes.json(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setAgencies(Array.isArray(agenciesData) ? agenciesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
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
      setNewUser({ email: "", name: "", password: "", role: "MEMBER", agencyId: "", clientIds: [] });
      setShowForm(false);
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add user");
    }
    setAdding(false);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      role: user.role,
      agencyId: user.agencyId || "",
      clientIds: user.clientAssignments?.map(ca => ca.client.id) || [],
    });
  }

  async function saveEdit() {
    if (!editingUser) return;
    setSaving(true);

    const res = await fetch("/api/team/" + editingUser.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setEditingUser(null);
      fetchData();
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
    fetchData();
  }

  async function deleteUser(user: User) {
    if (!confirm("Delete " + user.email + "?")) return;
    await fetch("/api/team/" + user.id, { method: "DELETE" });
    fetchData();
  }

  function toggleClientSelection(clientId: string, isEdit = false) {
    if (isEdit) {
      if (editForm.clientIds.includes(clientId)) {
        setEditForm({ ...editForm, clientIds: editForm.clientIds.filter(id => id !== clientId) });
      } else {
        setEditForm({ ...editForm, clientIds: [...editForm.clientIds, clientId] });
      }
    } else {
      if (newUser.clientIds.includes(clientId)) {
        setNewUser({ ...newUser, clientIds: newUser.clientIds.filter(id => id !== clientId) });
      } else {
        setNewUser({ ...newUser, clientIds: [...newUser.clientIds, clientId] });
      }
    }
  }

  function navigateToUser(userId: string) {
    window.location.href = `/team/${userId}`;
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

  const displayUsers = isClientRole 
    ? users.filter(u => u.role !== "CLIENT")
    : users;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
              {isClientRole ? "Your Team" : "Team"}
            </h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
              {isClientRole ? "Agency team members working on your projects" : "Manage your team members"}
            </p>
          </div>
          {!isClientRole && (
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
          )}
        </div>

        {/* Add User Form */}
        {showForm && !isClientRole && (
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

              {/* Client Assignments */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Assign to Clients
                </label>
                <div style={{ 
                  border: "1px solid " + theme.colors.borderMedium, 
                  borderRadius: 8, 
                  maxHeight: 150, 
                  overflow: "auto",
                  background: theme.colors.bgPrimary,
                }}>
                  {clients.length === 0 ? (
                    <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 13 }}>No clients available</div>
                  ) : (
                    clients.map(client => (
                      <label 
                        key={client.id} 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 10, 
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid " + theme.colors.borderLight,
                          background: newUser.clientIds.includes(client.id) ? theme.colors.successBg : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newUser.clientIds.includes(client.id)}
                          onChange={() => toggleClientSelection(client.id)}
                          style={{ cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 14 }}>
                          {client.nickname || client.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {newUser.clientIds.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.textMuted }}>
                    {newUser.clientIds.length} client(s) selected
                  </div>
                )}
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

        {/* Users Table */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          {displayUsers.length === 0 ? (
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
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Agency</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Clients</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Role</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Status</th>
                  {!isClientRole && (
                    <th style={{ padding: 16, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + theme.colors.borderLight }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => navigateToUser(user.id)}
                    style={{ 
                      borderBottom: "1px solid " + theme.colors.bgTertiary,
                      cursor: "pointer",
                      transition: "background 150ms",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.bgTertiary}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
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
  {user.agency ? (
    <Link
      href={`/agencies/${user.agency.id}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        background: theme.colors.infoBg,
        color: theme.colors.info,
        textDecoration: "none",
        transition: "opacity 150ms",
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    >
      {user.agency.name}
    </Link>
  ) : user.agencyId === null ? (
    <span style={{
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      background: "#f0f9ff",
      color: "#0284c7",
      border: "1px solid #bae6fd"
    }}>
      🌐 External Partner
    </span>
  ) : (
    <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>—</span>
  )}
</td>
                    <td style={{ padding: 16 }}>
                      {user.clientAssignments && user.clientAssignments.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {user.clientAssignments.slice(0, 3).map(ca => (
                            <Link 
                              key={ca.id}
                              href={`/clients/${ca.client.id}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: "3px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 500,
                                background: theme.colors.successBg,
                                color: theme.colors.success,
                                textDecoration: "none",
                                transition: "opacity 150ms",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                              {ca.client.nickname || ca.client.name}
                            </Link>
                          ))}
                          {user.clientAssignments.length > 3 && (
                            <span style={{ fontSize: 11, color: theme.colors.textMuted, padding: "3px 4px" }}>
                              +{user.clientAssignments.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>—</span>
                      )}
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
                    {!isClientRole && (
                      <td style={{ padding: 16, textAlign: "right" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(user);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActive(user);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUser(user);
                          }}
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingUser && (
        <>
          <div
            onClick={() => setEditingUser(null)}
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
            maxHeight: "90vh",
            overflow: "auto",
            zIndex: 1001,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: 20, fontWeight: 600 }}>
              Edit User
            </h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Email</label>
              <input
                value={editingUser.email}
                disabled
                style={{ ...inputStyle, background: theme.colors.bgTertiary, color: theme.colors.textMuted }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={inputStyle}
                placeholder="John Smith"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
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
                  value={editForm.agencyId}
                  onChange={(e) => setEditForm({ ...editForm, agencyId: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">No Agency</option>
                  {agencies.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                Assign to Clients
              </label>
              <div style={{ 
                border: "1px solid " + theme.colors.borderMedium, 
                borderRadius: 8, 
                maxHeight: 200, 
                overflow: "auto",
                background: theme.colors.bgPrimary,
              }}>
                {clients.length === 0 ? (
                  <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 13 }}>No clients available</div>
                ) : (
                  clients.map(client => (
                    <label 
                      key={client.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 10, 
                        padding: "10px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid " + theme.colors.borderLight,
                        background: editForm.clientIds.includes(client.id) ? theme.colors.successBg : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.clientIds.includes(client.id)}
                        onChange={() => toggleClientSelection(client.id, true)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 14 }}>
                        {client.nickname || client.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {editForm.clientIds.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.textMuted }}>
                  {editForm.clientIds.length} client(s) selected
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setEditingUser(null)}
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
