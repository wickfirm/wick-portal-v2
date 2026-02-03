"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

// Generate default slug from name (lowercase, no spaces, remove special chars)
function generateDefaultSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Remove consecutive dashes
    .trim();
}

export default function AccountSettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Booking URL state
  const [bookingSlug, setBookingSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugMessage, setSlugMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingSlug, setLoadingSlug] = useState(true);

  // Default slug based on name
  const defaultSlug = user?.name ? generateDefaultSlug(user.name) : "";

  // Load current booking slug
  useEffect(() => {
    async function loadBookingSlug() {
      try {
        const res = await fetch("/api/user/booking-slug");
        if (res.ok) {
          const data = await res.json();
          setBookingSlug(data.bookingSlug || "");
          setOriginalSlug(data.bookingSlug || "");
        }
      } catch (err) {
        console.error("Failed to load booking slug:", err);
      }
      setLoadingSlug(false);
    }

    if (user?.id) {
      loadBookingSlug();
    }
  }, [user?.id]);

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

  async function handleSlugSave() {
    setSlugMessage(null);

    // Validate slug format
    const slugToSave = bookingSlug.trim().toLowerCase();
    if (slugToSave && !/^[a-z0-9-]+$/.test(slugToSave)) {
      setSlugMessage({ type: "error", text: "URL can only contain lowercase letters, numbers, and dashes" });
      return;
    }

    if (slugToSave.length > 0 && slugToSave.length < 3) {
      setSlugMessage({ type: "error", text: "URL must be at least 3 characters" });
      return;
    }

    setSavingSlug(true);
    try {
      const res = await fetch("/api/user/booking-slug", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSlug: slugToSave || null }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookingSlug(data.bookingSlug || "");
        setOriginalSlug(data.bookingSlug || "");
        setSlugMessage({ type: "success", text: "Booking URL updated successfully" });
      } else {
        const data = await res.json();
        setSlugMessage({ type: "error", text: data.error || "Failed to update booking URL" });
      }
    } catch {
      setSlugMessage({ type: "error", text: "Failed to update booking URL" });
    }
    setSavingSlug(false);
  }

  const hasSlugChanges = bookingSlug !== originalSlug;
  const displaySlug = bookingSlug || defaultSlug;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wick.omnixia.ai";

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

        {/* Booking URL */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 8, color: theme.colors.textPrimary }}>
            📅 Personal Booking URL
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 20 }}>
            Customize your personal booking page URL. Share this link to let people book meetings directly with you.
          </p>

          {slugMessage && (
            <div style={{
              padding: "12px 16px",
              borderRadius: theme.borderRadius.md,
              marginBottom: 20,
              background: slugMessage.type === "success" ? theme.colors.successBg : theme.colors.errorBg,
              color: slugMessage.type === "success" ? theme.colors.success : theme.colors.error,
              fontSize: 14,
            }}>
              {slugMessage.text}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>
              Your Booking URL Slug
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: theme.colors.textMuted, fontSize: 14 }}>
                {baseUrl}/book/
              </span>
              <input
                type="text"
                value={bookingSlug}
                onChange={(e) => setBookingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={defaultSlug || "your-name"}
                disabled={loadingSlug}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: `1px solid ${theme.colors.borderMedium}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>
            {!bookingSlug && defaultSlug && (
              <p style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 8, marginBottom: 0 }}>
                💡 Default based on your name: <strong>{defaultSlug}</strong>
              </p>
            )}
          </div>

          {/* URL Preview */}
          <div style={{
            padding: 16,
            background: theme.colors.bgTertiary,
            borderRadius: theme.borderRadius.md,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>Preview</div>
            <div style={{ fontSize: 14, color: theme.colors.textPrimary, wordBreak: "break-all" }}>
              <span style={{ color: theme.colors.textMuted }}>{baseUrl}/book/</span>
              <span style={{ color: theme.colors.primary, fontWeight: 500 }}>{displaySlug}</span>
              <span style={{ color: theme.colors.textMuted }}>/</span>
              <span style={{ color: theme.colors.textSecondary }}>meeting-type</span>
            </div>
            <p style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 8, marginBottom: 0 }}>
              Replace "meeting-type" with your actual booking type slug (e.g., discovery-call, consultation)
            </p>
          </div>

          <button
            onClick={handleSlugSave}
            disabled={savingSlug || !hasSlugChanges}
            style={{
              padding: "12px 24px",
              background: hasSlugChanges ? theme.colors.primary : theme.colors.bgTertiary,
              color: hasSlugChanges ? "white" : theme.colors.textMuted,
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontSize: 14,
              fontWeight: 500,
              cursor: savingSlug || !hasSlugChanges ? "not-allowed" : "pointer",
              opacity: savingSlug ? 0.7 : 1,
            }}
          >
            {savingSlug ? "Saving..." : hasSlugChanges ? "Save Booking URL" : "No Changes"}
          </button>
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
