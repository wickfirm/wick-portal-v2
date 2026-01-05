"use client";

import { useState } from "react";
import { theme } from "@/lib/theme";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, adminSecret }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Password reset successfully!");
        setEmail("");
        setNewPassword("");
        setAdminSecret("");
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Something went wrong");
    }

    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.colors.bgPrimary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: theme.colors.bgSecondary,
        padding: 40,
        borderRadius: 16,
        border: "1px solid " + theme.colors.borderLight,
        width: "100%",
        maxWidth: 400,
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: "center" }}>
          Admin Password Reset
        </h1>
        <p style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 32, textAlign: "center" }}>
          Reset any user's password
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              Admin Secret
            </label>
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter admin secret"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              New Password
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              background: theme.colors.errorBg,
              color: theme.colors.error,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 14,
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: "12px 16px",
              background: theme.colors.successBg,
              color: theme.colors.success,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 14,
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: loading ? theme.colors.bgTertiary : theme.colors.primary,
              color: loading ? theme.colors.textMuted : "white",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <a href="/login" style={{ color: theme.colors.primary, fontSize: 14 }}>
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
