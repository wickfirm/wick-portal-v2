"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { theme } from "@/lib/theme";

export default function AccountSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);

    if (!name.trim()) {
      setProfileMessage({ type: "error", text: "Name is required" });
      return;
    }

    setSavingProfile(true);
    try {
      const payload: any = { name };
      if (isAdmin) {
        payload.email = email;
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setProfileMessage({ type: "success", text: "Profile updated successfully" });
        // Update the session with new data
        await updateSession({ name, email: isAdmin ? email : user.email });
      } else {
        const data = await res.json();
        setProfileMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch {
      setProfileMessage({ type: "error", text: "Failed to update profile" });
    }
    setSavingProfile(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Password updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordMessage({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Failed to update password" });
    }
    setSavingPassword(false);
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: theme.colors.textMuted }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <header style={{
        background: theme.colors.bgSecondary,
        padding: "0 24px",
        borderBottom: `1px solid ${theme.colors.borderLight}`,
        height: 64,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}>
        <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
          ← Back to Settings
        </Link>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Account Settings</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage your account and security</p>
        </div>

        {/* Profile Info */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20, color: theme.colors.textPrimary }}>Profile</h2>
          
          {profileMessage && (
            <div style={{
              padding: "12px 16px",
              borderRadius: theme.borderRadius.md,
              marginBottom: 20,
              background: profileMessage.type === "success" ? theme.colors.successBg : theme.colors.errorBg,
              color: profileMessage.type === "success" ? theme.colors.success : theme.colors.error,
              fontSize: 14,
            }}>
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate}>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>
                  Email {!isAdmin && <span style={{ color: theme.colors.textMuted }}>(contact admin to change)</span>}
                </label>
                {isAdmin ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: `1px solid ${theme.colors.borderMedium}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <div style={{
                    padding: "12px 14px",
                    background: theme.colors.bgTertiary,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                  }}>
                    {user?.email || "—"}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 }}>Role</label>
                <div style={{
                  padding: "12px 14px",
                  background: theme.colors.bgTertiary,
                  borderRadius: theme.borderRadius.md,
                  fontSize: 14,
                  color: theme.colors.textPrimary,
                  textTransform: "capitalize",
                }}>
                  {user?.role?.toLowerCase() || "—"}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              style={{
                marginTop: 20,
                padding: "12px 24px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                fontWeight: 500,
                cursor: savingProfile ? "not-allowed" : "pointer",
                opacity: savingProfile ? 0.7 : 1,
              }}
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20, color: theme.colors.textPrimary }}>Change Password</h2>
          
          {passwordMessage && (
            <div style={{
              padding: "12px 16px",
              borderRadius: theme.borderRadius.md,
              marginBottom: 20,
              background: passwordMessage.type === "success" ? theme.colors.successBg : theme.colors.errorBg,
              color: passwordMessage.type === "success" ? theme.colors.success : theme.colors.error,
              fontSize: 14,
            }}>
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ width: "100%", padding: "12px 14px", border: `1px solid ${theme.colors.borderMedium}`, borderRadius: theme.borderRadius.md, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${theme.colors.borderMedium}`, borderRadius: theme.borderRadius.md, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} style={{ width: "100%", padding: "12px 14px", border: `1px solid ${theme.colors.borderMedium}`, borderRadius: theme.borderRadius.md, fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>
            <button type="submit" disabled={savingPassword} style={{ marginTop: 20, padding: "12px 24px", background: theme.colors.primary, color: "white", border: "none", borderRadius: theme.borderRadius.md, fontSize: 14, fontWeight: 500, cursor: savingPassword ? "not-allowed" : "pointer", opacity: savingPassword ? 0.7 : 1 }}>
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Sign Out */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          marginTop: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 8, color: theme.colors.textPrimary }}>Sign Out</h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>Sign out of your account on this device.</p>
          <Link href="/auth/signout" style={{ display: "inline-block", padding: "12px 24px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: `1px solid ${theme.colors.borderMedium}`, borderRadius: theme.borderRadius.md, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Sign Out
          </Link>
        </div>
      </main>
    </div>
  );
}
