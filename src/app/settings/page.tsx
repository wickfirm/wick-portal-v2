"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (res.ok) {
      setMessage("Password updated successfully");
      (e.target as HTMLFormElement).reset();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to update password");
    }
    setSaving(false);
  }

  const user = session?.user as any;

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
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginBottom: 24 }}>Settings</h1>

        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Profile</h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#888" }}>Name</div>
            <div>{user?.name}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#888" }}>Email</div>
            <div>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#888" }}>Role</div>
            <div>{user?.role}</div>
          </div>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Change Password</h3>

          {message && <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: 12, borderRadius: 4, marginBottom: 16 }}>{message}</div>}
          {error && <div style={{ background: "#fee", color: "#c00", padding: 12, borderRadius: 4, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Current Password</label>
              <input name="currentPassword" type="password" required style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>New Password</label>
              <input name="newPassword" type="password" required minLength={6} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Confirm New Password</label>
              <input name="confirmPassword" type="password" required minLength={6} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
            </div>

            <button type="submit" disabled={saving} style={{ padding: "12px 24px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

