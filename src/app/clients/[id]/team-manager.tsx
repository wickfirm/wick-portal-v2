"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

type TeamMember = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Props = {
  clientId: string;
  initialTeam: TeamMember[];
  canEdit: boolean;
};

export default function TeamManager({ clientId, initialTeam, canEdit }: Props) {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch all users for the modal
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter out CLIENT role users
          setAllUsers(data.filter((u: User) => u.role !== "CLIENT"));
        }
      });
  }, []);

  function openModal() {
    setSelectedUserIds(team.map(t => t.userId));
    setShowModal(true);
  }

  function toggleUser(userId: string) {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  async function saveTeam() {
    setSaving(true);

    const res = await fetch(`/api/clients/${clientId}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: selectedUserIds }),
    });

    if (res.ok) {
      const data = await res.json();
      setTeam(data.map((tm: any) => ({
        id: tm.id,
        userId: tm.userId,
        name: tm.user.name,
        email: tm.user.email,
        role: tm.user.role,
      })));
      setShowModal(false);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update team");
    }

    setSaving(false);
  }

  const roleColors: Record<string, { bg: string; color: string }> = {
    SUPER_ADMIN: { bg: "#FEE2E2", color: "#DC2626" },
    ADMIN: { bg: "#DBEAFE", color: "#2563EB" },
    MANAGER: { bg: "#E0E7FF", color: "#4F46E5" },
    MEMBER: { bg: "#F3F4F6", color: "#6B7280" },
  };

  return (
    <>
      <div style={{ 
        background: theme.colors.bgSecondary, 
        padding: 24, 
        borderRadius: theme.borderRadius.lg, 
        border: "1px solid " + theme.colors.borderLight, 
        marginBottom: 24 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: theme.colors.textSecondary, 
            textTransform: "uppercase", 
            letterSpacing: "0.5px", 
            margin: 0 
          }}>
            Team Members ({team.length})
          </h3>
          {canEdit && (
            <button
              onClick={openModal}
              style={{
                padding: "6px 12px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Manage
            </button>
          )}
        </div>

        {team.length === 0 ? (
          <div style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: "center", padding: 16 }}>
            No team members assigned
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {team.map(member => (
              <div 
                key={member.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: theme.colors.bgPrimary,
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: "50%", 
                    background: theme.colors.primary + "20", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.colors.primary,
                  }}>
                    {member.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, color: theme.colors.textPrimary }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{member.email}</div>
                  </div>
                </div>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: roleColors[member.role]?.bg || theme.colors.bgTertiary,
                  color: roleColors[member.role]?.color || theme.colors.textMuted,
                }}>
                  {member.role.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div 
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 999,
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480,
            maxHeight: "80vh",
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            zIndex: 1000,
            overflow: "hidden",
          }}>
            <div style={{ 
              padding: "20px 24px", 
              borderBottom: "1px solid " + theme.colors.borderLight,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Manage Team</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: theme.colors.textMuted,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 24, maxHeight: 400, overflow: "auto" }}>
              <p style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 0, marginBottom: 16 }}>
                Select team members who should have access to this client:
              </p>

              {allUsers.length === 0 ? (
                <div style={{ textAlign: "center", color: theme.colors.textMuted, padding: 24 }}>
                  No users available
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allUsers.map(user => (
                    <label 
                      key={user.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 12,
                        padding: "10px 12px",
                        background: selectedUserIds.includes(user.id) ? theme.colors.primaryBg : theme.colors.bgPrimary,
                        borderRadius: 8,
                        cursor: "pointer",
                        border: "1px solid " + (selectedUserIds.includes(user.id) ? theme.colors.primary : "transparent"),
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        style={{ cursor: "pointer" }}
                      />
                      <div style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: "50%", 
                        background: theme.colors.primary + "20", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.colors.primary,
                      }}>
                        {user.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{user.email}</div>
                      </div>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background: roleColors[user.role]?.bg || theme.colors.bgTertiary,
                        color: roleColors[user.role]?.color || theme.colors.textMuted,
                      }}>
                        {user.role.replace("_", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ 
              padding: "16px 24px", 
              borderTop: "1px solid " + theme.colors.borderLight,
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setShowModal(false)}
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
                onClick={saveTeam}
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
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
