"use client";

import { useState } from "react";
import { theme } from "@/lib/theme";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  hourlyRate: number | null;
}

interface Client {
  id: string;
  name: string;
  nickname: string | null;
  billRate: number | null;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
  billRate: number | null;
  client: { name: string; nickname: string | null };
}

interface Props {
  teamMembers: TeamMember[];
  clients: Client[];
  projects: Project[];
}

export default function RatesManager({ teamMembers: initialTeam, clients: initialClients, projects: initialProjects }: Props) {
  const [teamMembers, setTeamMembers] = useState(initialTeam);
  const [clients, setClients] = useState(initialClients);
  const [projects, setProjects] = useState(initialProjects);
  const [activeTab, setActiveTab] = useState<"team" | "clients" | "projects">("team");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (id: string, currentRate: number | null) => {
    setEditingId(id);
    setEditValue(currentRate ? currentRate.toString() : "");
  };

  const handleSaveTeamRate = async (memberId: string) => {
    const rate = editValue ? parseFloat(editValue) : null;
    
    if (editValue && (isNaN(rate!) || rate! < 0)) {
      alert("Please enter a valid rate");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: rate }),
      });

      if (res.ok) {
        setTeamMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, hourlyRate: rate } : m
        ));
        setEditingId(null);
      } else {
        const error = await res.json();
        alert("Failed to save: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving rate:", error);
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClientRate = async (clientId: string) => {
    const rate = editValue ? parseFloat(editValue) : null;
    
    if (editValue && (isNaN(rate!) || rate! < 0)) {
      alert("Please enter a valid rate");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billRate: rate }),
      });

      if (res.ok) {
        setClients(prev => prev.map(c => 
          c.id === clientId ? { ...c, billRate: rate } : c
        ));
        setEditingId(null);
      } else {
        const error = await res.json();
        alert("Failed to save: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving rate:", error);
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProjectRate = async (projectId: string) => {
    const rate = editValue ? parseFloat(editValue) : null;
    
    if (editValue && (isNaN(rate!) || rate! < 0)) {
      alert("Please enter a valid rate");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billRate: rate }),
      });

      if (res.ok) {
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, billRate: rate } : p
        ));
        setEditingId(null);
      } else {
        const error = await res.json();
        alert("Failed to save: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving rate:", error);
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const tabStyle = (isActive: boolean) => ({
    padding: "12px 24px",
    background: isActive ? theme.colors.bgSecondary : "transparent",
    border: "none",
    borderBottom: isActive ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  });

  return (
    <div>
      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        borderBottom: "1px solid " + theme.colors.borderLight,
        marginBottom: 24,
      }}>
        <button style={tabStyle(activeTab === "team")} onClick={() => setActiveTab("team")}>
          Team Cost Rates
        </button>
        <button style={tabStyle(activeTab === "clients")} onClick={() => setActiveTab("clients")}>
          Client Bill Rates
        </button>
        <button style={tabStyle(activeTab === "projects")} onClick={() => setActiveTab("projects")}>
          Project Bill Rates
        </button>
      </div>

      {/* Team Cost Rates */}
      {activeTab === "team" && (
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.borderLight,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid " + theme.colors.borderLight,
            background: theme.colors.bgTertiary,
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Team Cost Rates</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: theme.colors.textSecondary }}>
              Internal hourly cost for each team member (what you pay them)
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: theme.colors.bgTertiary }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Team Member</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Role</th>
                <th style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Hourly Rate</th>
                <th style={{ padding: "12px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} style={{ borderBottom: "1px solid " + theme.colors.borderLight }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{member.name || "—"}</div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{member.email}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      background: member.role === "SUPER_ADMIN" ? theme.colors.primaryBg : theme.colors.bgTertiary,
                      color: member.role === "SUPER_ADMIN" ? theme.colors.primary : theme.colors.textSecondary,
                    }}>
                      {member.role.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    {editingId === member.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        autoFocus
                        style={{
                          width: 100,
                          padding: "6px 10px",
                          borderRadius: theme.borderRadius.sm,
                          border: "1px solid " + theme.colors.primary,
                          fontSize: 14,
                          textAlign: "right",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTeamRate(member.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <span style={{ 
                        fontWeight: 600, 
                        color: member.hourlyRate ? theme.colors.textPrimary : theme.colors.textMuted,
                        fontSize: 15,
                      }}>
                        {formatCurrency(effectiveRate ?? null)}/hr
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    {editingId === member.id ? (
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                          onClick={() => handleSaveTeamRate(member.id)}
                          disabled={isSaving}
                          style={{
                            padding: "6px 12px",
                            borderRadius: theme.borderRadius.sm,
                            border: "none",
                            background: theme.colors.success,
                            color: "white",
                            fontSize: 12,
                            cursor: "pointer",
                            opacity: isSaving ? 0.5 : 1,
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: theme.borderRadius.sm,
                            border: "1px solid " + theme.colors.borderLight,
                            background: "transparent",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(member.id, member.hourlyRate)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: theme.borderRadius.sm,
                          border: "1px solid " + theme.colors.borderLight,
                          background: "transparent",
                          fontSize: 12,
                          cursor: "pointer",
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Client Bill Rates */}
      {activeTab === "clients" && (
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.borderLight,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid " + theme.colors.borderLight,
            background: theme.colors.bgTertiary,
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Client Bill Rates</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: theme.colors.textSecondary }}>
              Default hourly rate charged to each client (applies to all their projects unless overridden)
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: theme.colors.bgTertiary }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Client</th>
                <th style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Bill Rate</th>
                <th style={{ padding: "12px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: "1px solid " + theme.colors.borderLight }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{client.name}</div>
                    {client.nickname && (
                      <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{client.nickname}</div>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    {editingId === client.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        autoFocus
                        style={{
                          width: 100,
                          padding: "6px 10px",
                          borderRadius: theme.borderRadius.sm,
                          border: "1px solid " + theme.colors.primary,
                          fontSize: 14,
                          textAlign: "right",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveClientRate(client.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <span style={{ 
                        fontWeight: 600, 
                        color: client.billRate ? theme.colors.textPrimary : theme.colors.textMuted,
                        fontSize: 15,
                      }}>
                        {formatCurrency(client.billRate)}/hr
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    {editingId === client.id ? (
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button
                          onClick={() => handleSaveClientRate(client.id)}
                          disabled={isSaving}
                          style={{
                            padding: "6px 12px",
                            borderRadius: theme.borderRadius.sm,
                            border: "none",
                            background: theme.colors.success,
                            color: "white",
                            fontSize: 12,
                            cursor: "pointer",
                            opacity: isSaving ? 0.5 : 1,
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: theme.borderRadius.sm,
                            border: "1px solid " + theme.colors.borderLight,
                            background: "transparent",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(client.id, client.billRate)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: theme.borderRadius.sm,
                          border: "1px solid " + theme.colors.borderLight,
                          background: "transparent",
                          fontSize: 12,
                          cursor: "pointer",
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Project Bill Rates */}
      {activeTab === "projects" && (
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.borderLight,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid " + theme.colors.borderLight,
            background: theme.colors.bgTertiary,
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Project Bill Rates</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: theme.colors.textSecondary }}>
              Override the client's default rate for specific projects (leave blank to use client rate)
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: theme.colors.bgTertiary }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Project</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Client</th>
                <th style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Bill Rate</th>
                <th style={{ padding: "12px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const clientBillRate = clients.find(c => c.id === project.clientId)?.billRate;
                const effectiveRate = project.billRate ?? clientBillRate;
                const isOverride = project.billRate !== null;

                return (
                  <tr key={project.id} style={{ borderBottom: "1px solid " + theme.colors.borderLight }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{project.name}</div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                        {project.client.nickname || project.client.name}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      {editingId === project.id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder={clientBillRate ? `${clientBillRate} (client default)` : "0.00"}
                          step="0.01"
                          min="0"
                          autoFocus
                          style={{
                            width: 120,
                            padding: "6px 10px",
                            borderRadius: theme.borderRadius.sm,
                            border: "1px solid " + theme.colors.primary,
                            fontSize: 14,
                            textAlign: "right",
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveProjectRate(project.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                      ) : (
                        <div>
                          <span style={{ 
                            fontWeight: 600, 
                            color: effectiveRate ? theme.colors.textPrimary : theme.colors.textMuted,
                            fontSize: 15,
                          }}>
                            {formatCurrency(effectiveRate)}/hr
                          </span>
                          {isOverride && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: theme.colors.warningBg,
                              color: theme.colors.warning,
                            }}>
                              Override
                            </span>
                          )}
                          {!isOverride && clientBillRate && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: theme.colors.bgTertiary,
                              color: theme.colors.textMuted,
                            }}>
                              From client
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      {editingId === project.id ? (
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => handleSaveProjectRate(project.id)}
                            disabled={isSaving}
                            style={{
                              padding: "6px 12px",
                              borderRadius: theme.borderRadius.sm,
                              border: "none",
                              background: theme.colors.success,
                              color: "white",
                              fontSize: 12,
                              cursor: "pointer",
                              opacity: isSaving ? 0.5 : 1,
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: theme.borderRadius.sm,
                              border: "1px solid " + theme.colors.borderLight,
                              background: "transparent",
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(project.id, project.billRate)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: theme.borderRadius.sm,
                            border: "1px solid " + theme.colors.borderLight,
                            background: "transparent",
                            fontSize: 12,
                            cursor: "pointer",
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {isOverride ? "Edit" : "Override"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
