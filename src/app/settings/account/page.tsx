"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export default function AccountSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Password updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update password" });
    }
    setSaving(false);
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
      <Header />

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>Account Settings</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage your account and security</p>
        </div>

        {/* Profile Info (read-only) */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20, color: theme.colors.textPrimary }}>Profile</h2>
          
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 }}>Name</label>
              <div style={{
                padding: "12px 14px",
                background: theme.colors.bgTertiary,
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                color: theme.colors.textPrimary,
              }}>
                {user?.name || "—"}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 }}>Email</label>
              <div style={{
                padding: "12px 14px",
                background: theme.colors.bgTertiary,
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                color: theme.colors.textPrimary,
              }}>
                {user?.email || "—"}
              </div>
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
          
          <p style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 16, marginBottom: 0 }}>
            Contact your administrator to update profile information.
          </p>
        </div>

        {/* Password Change */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20, color: theme.colors.textPrimary }}>Change Password</h2>
          
          {message && (
            <div style={{
              padding: "12px 16px",
              borderRadius: theme.borderRadius.md,
              marginBottom: 20,
              background: message.type === "success" ? theme.colors.successBg : theme.colors.errorBg,
              color: message.type === "success" ? theme.colors.success : theme.colors.error,
              fontSize: 14,
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
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
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
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
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 20,
                padding: "12px 24px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Updating..." : "Update Password"}
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
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
            Sign out of your account on this device.
          </p>
          <Link
            href="/auth/signout"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: theme.colors.bgTertiary,
              color: theme.colors.textSecondary,
              border: `1px solid ${theme.colors.borderMedium}`,
              borderRadius: theme.borderRadius.md,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Sign Out
          </Link>
        </div>
      </main>
    </div>
  );
}
