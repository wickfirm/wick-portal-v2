"use client";

import { useState, useEffect } from "react";
import { theme, ROLE_STYLES } from "@/lib/theme";

type LinkedUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
};

type AvailableUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function LinkedUsersManager({
  clientId,
  initialUsers,
}: {
  clientId: string;
  initialUsers: LinkedUser[];
}) {
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>(initialUsers);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [linking, setLinking] = useState(false);

  async function fetchAvailableUsers() {
    setLoadingUsers(true);
    const res = await fetch("/api/team?unlinked=true");
    const data = await res.json();
    setAvailableUsers(data.filter((u: any) => !linkedUsers.some(lu => lu.id === u.id)));
    setLoadingUsers(false);
  }

  function openLinkModal() {
    setShowLinkModal(true);
    fetchAvailableUsers();
  }

  async function linkUser(userId: string) {
    setLinking(true);
    const res = await fetch(`/api/clients/${clientId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      const user = availableUsers.find(u => u.id === userId);
      if (user) {
        setLinkedUsers([...linkedUsers, { ...user, isActive: true }]);
        setAvailableUsers(availableUsers.filter(u => u.id !== userId));
      }
    }
    setLinking(false);
  }

  async function unlinkUser(userId: string) {
    if (!confirm("Remove this user's access to this client?")) return;
    
    const res = await fetch(`/api/clients/${clientId}/users/${userId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setLinkedUsers(linkedUsers.filter(u => u.id !== userId));
    }
  }

  return (
    <>
      <div style={{
        background: theme.colors.bgSecondary,
        borderRadius: theme.borderRadius.lg,
        border: "1px solid " + theme.colors.borderLight,
        overflow: "hidden"
      }}>
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid " + theme.colors.borderLight,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Portal Access ({linkedUsers.length})
          </h2>
          <button
            onClick={openLinkModal}
            style={{
              background: theme.colors.primary,
              color: "white",
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              fontWeight: 500,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            + Link User
          </button>
        </div>

        {linkedUsers.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
            No users linked to this client yet
          </div>
        ) : (
          <div>
            {linkedUsers.map((user, idx) => (
              <div
                key={user.id}
                style={{
                  padding: "16px 24px",
                  borderBottom: idx < linkedUsers.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: theme.gradients.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 13
                  }}>
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{user.name || "—"}</div>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    background: ROLE_STYLES[user.role]?.bg || theme.colors.bgTertiary,
                    color: ROLE_STYLES[user.role]?.color || theme.colors.textSecondary
                  }}>
                    {user.role}
                  </span>
                  <button
                    onClick={() => unlinkUser(user.id)}
                    style={{
                      padding: "6px 12px",
                      background: theme.colors.errorBg,
                      color: theme.colors.error,
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link User Modal */}
      {showLinkModal && (
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
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: theme.shadows.lg
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: theme.colors.textPrimary }}>
                Link User to Client
              </h2>
              <button
                onClick={() => setShowLinkModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: theme.colors.textMuted
                }}
              >
                ×
              </button>
            </div>

            {loadingUsers ? (
              <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted }}>
                Loading users...
              </div>
            ) : availableUsers.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted }}>
                No available users to link. Create a new user with CLIENT role in Team management.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {availableUsers.map(user => (
                  <div
                    key={user.id}
                    style={{
                      padding: 16,
                      background: theme.colors.bgPrimary,
                      borderRadius: theme.borderRadius.md,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: theme.gradients.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 13
                      }}>
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{user.name || "—"}</div>
                        <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => linkUser(user.id)}
                      disabled={linking}
                      style={{
                        padding: "8px 16px",
                        background: theme.colors.primary,
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: linking ? "not-allowed" : "pointer",
                        opacity: linking ? 0.7 : 1
                      }}
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowLinkModal(false)}
              style={{
                marginTop: 24,
                width: "100%",
                padding: 12,
                background: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
