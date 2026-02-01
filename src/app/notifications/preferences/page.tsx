"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type NotificationPreferences = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailDigest: string;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  preferences: Record<string, { enabled: boolean }>;
};

const NOTIFICATION_TYPES = [
  { key: "TASK_ASSIGNED", label: "Task Assigned to Me", description: "When someone assigns a task to you" },
  { key: "TASK_COMPLETED", label: "Task Completed", description: "When a task you're watching is completed" },
  { key: "TASK_UPDATED", label: "Task Updated", description: "When task priority changes to urgent" },
  { key: "TASK_DUE_SOON", label: "Task Due Soon", description: "Reminder 1 day before task due date" },
  { key: "TASK_COMMENT", label: "Task Comments", description: "When someone comments on your task" },
];

export default function NotificationPreferencesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    emailDigest: "REAL_TIME",
    quietHoursStart: null,
    quietHoursEnd: null,
    preferences: {},
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPreferences();
    }
  }, [status]);

  async function fetchPreferences() {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs({
          emailEnabled: data.emailEnabled ?? true,
          pushEnabled: data.pushEnabled ?? true,
          emailDigest: data.emailDigest ?? "REAL_TIME",
          quietHoursStart: data.quietHoursStart,
          quietHoursEnd: data.quietHoursEnd,
          preferences: data.preferences ?? {},
        });
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (res.ok) {
        alert("Preferences saved successfully!");
      } else {
        alert("Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  function toggleNotificationType(type: string, enabled: boolean) {
    setPrefs({
      ...prefs,
      preferences: {
        ...prefs.preferences,
        [type]: { enabled },
      },
    });
  }

  if (loading || status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
            Loading preferences...
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 8 }}>
            Notification Preferences
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Manage how and when you receive notifications
          </p>
        </div>

        {/* General Settings */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          padding: 24,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>General Settings</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={prefs.emailEnabled}
                onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                  Email Notifications
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  Receive notifications via email
                </div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={prefs.pushEnabled}
                onChange={(e) => setPrefs({ ...prefs, pushEnabled: e.target.checked })}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                  Push Notifications
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  Receive browser push notifications (coming soon)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Email Digest */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          padding: 24,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Email Frequency</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["REAL_TIME", "DAILY", "WEEKLY", "NEVER"].map((digest) => (
              <label key={digest} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="emailDigest"
                  checked={prefs.emailDigest === digest}
                  onChange={() => setPrefs({ ...prefs, emailDigest: digest })}
                  style={{ cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                    {digest.replace("_", " ")}
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                    {digest === "REAL_TIME" && "Immediate email for each notification"}
                    {digest === "DAILY" && "Daily digest at 9 AM"}
                    {digest === "WEEKLY" && "Weekly digest on Monday at 9 AM"}
                    {digest === "NEVER" && "No email notifications"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          padding: 24,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Quiet Hours</h2>
          <p style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 16 }}>
            Don't send notifications during these hours
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                Start (24-hour)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={prefs.quietHoursStart ?? ""}
                onChange={(e) => setPrefs({ ...prefs, quietHoursStart: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="22"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.borderMedium}`,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                End (24-hour)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={prefs.quietHoursEnd ?? ""}
                onChange={(e) => setPrefs({ ...prefs, quietHoursEnd: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="8"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.borderMedium}`,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          padding: 24,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Notification Types</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {NOTIFICATION_TYPES.map((type) => {
              const isEnabled = prefs.preferences[type.key]?.enabled !== false;
              return (
                <label key={type.key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => toggleNotificationType(type.key, e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                      {type.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={savePreferences}
            disabled={saving}
            style={{
              padding: "12px 24px",
              background: saving ? theme.colors.bgTertiary : theme.colors.primary,
              color: saving ? theme.colors.textMuted : "white",
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontSize: 14,
              fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>

          <button
            onClick={() => router.push("/notifications")}
            style={{
              padding: "12px 24px",
              background: theme.colors.bgTertiary,
              color: theme.colors.textSecondary,
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </main>
    </div>
  );
}
