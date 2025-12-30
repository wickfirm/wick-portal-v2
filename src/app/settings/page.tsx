"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/settings/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (res.ok) {
      setMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to update password");
    }
    setSaving(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
            <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
            <Link href="/analytics" style={{ color: "#666", textDecoration: "none" }}>Analytics</Link>
            <Link href="/settings" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Settings</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginBottom: 24 }}>Settings</h1>

        {/* Configuration Links */}
        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Configuration</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Link href="/settings/stage-templates" style={{ textDecoration: "none" }}>
              <div style={{ padding: 20, border: "1px solid #eee", borderRadius: 8, cursor: "pointer" }}>
                <h3 style={{ margin: "0 0 8px", color: "#333" }}>📋 Stage Templates</h3>
                <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Manage default project stages for each service type</p>
              </div>
            </Link>
            <Link href="/settings/task-categories" style={{ textDecoration: "none" }}>
              <div style={{ padding: 20, border: "1px solid #eee", borderRadius: 8, cursor: "pointer" }}>
                <h3 style={{ margin: "0 0 8px", color: "#333" }}>📁 Task Categories</h3>
                <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Manage categories for weekly client tasks</p>
              </div>
            </Link>
            <Link href="/settings/onboarding" style={{ textDecoration: "none" }}>
              <div style={{ padding: 20, border: "1px solid #eee", borderRadius: 8, cursor: "pointer" }}>
                <h3 style={{ margin: "0 0 8px", color: "#333" }}>✅ Onboarding Checklist</h3>
                <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Manage default onboarding checklist items</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Profile */}
        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Profile</h2>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#888" }}>Name</div>
            <div style={{ fontWeight: 500 }}>{session?.user?.name || "-"}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#888" }}>Email</div>
            <div style={{ fontWeight: 500 }}>{session?.user?.email || "-"}</div>
          </div>
        </div>

        {/* Change Password */}
        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              />
            </div>
            {message && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 4, background: message.includes("success") ? "#e8f5e9" : "#ffebee", color: message.includes("success") ? "#2e7d32" : "#c62828" }}>
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
