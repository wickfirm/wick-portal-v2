"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface UserIntegrations {
  calendarConnected: boolean;
  googleCalendarId: string | null;
  zoomConnected: boolean;
}

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<UserIntegrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchIntegrations();

    // Handle success/error from OAuth callback
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      setMessage({ type: "success", text: "Google Calendar has been successfully connected!" });
      window.history.replaceState({}, "", "/settings/integrations");
    } else if (success === "zoom_connected") {
      setMessage({ type: "success", text: "Zoom has been successfully connected!" });
      window.history.replaceState({}, "", "/settings/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Google authentication failed. Please try again.",
        zoom_auth_failed: "Zoom authentication failed. Please try again.",
        missing_params: "Missing required parameters.",
        invalid_state: "Invalid state parameter.",
        save_failed: "Failed to save connection.",
        callback_failed: "Callback processing failed.",
      };
      setMessage({ type: "error", text: errorMessages[error] || "An error occurred." });
      window.history.replaceState({}, "", "/settings/integrations");
    }
  }, [searchParams]);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/user/integrations");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogle = async () => {
    setConnecting("google");
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/google/auth");
      if (res.ok) {
        const { authUrl } = await res.json();
        window.location.href = authUrl;
      } else {
        setMessage({ type: "error", text: "Failed to initiate Google connection." });
        setConnecting(null);
      }
    } catch (error) {
      console.error("Error connecting Google:", error);
      setMessage({ type: "error", text: "Failed to connect to Google." });
      setConnecting(null);
    }
  };

  const disconnectGoogle = async () => {
    setConnecting("google-disconnect");
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/google/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Google Calendar has been disconnected." });
        fetchIntegrations();
      } else {
        setMessage({ type: "error", text: "Failed to disconnect Google Calendar." });
      }
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      setMessage({ type: "error", text: "Failed to disconnect Google Calendar." });
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: theme.colors.textMuted }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Integrations
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Connect external services to enhance your booking experience.
          </p>
        </div>

        {message && (
          <div style={{
            padding: "12px 16px",
            borderRadius: theme.borderRadius.md,
            marginBottom: 24,
            background: message.type === "success" ? theme.colors.successBg : theme.colors.errorBg,
            color: message.type === "success" ? theme.colors.success : theme.colors.error,
            fontSize: 14,
          }}>
            {message.text}
          </div>
        )}

        {/* Google Calendar */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}>
                📅
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: theme.colors.textPrimary }}>
                  Google Calendar
                </h2>
                <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: "4px 0 0" }}>
                  Sync bookings and create Google Meet links
                </p>
              </div>
            </div>
            <span style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background: integrations?.calendarConnected ? "#DCFCE7" : theme.colors.bgTertiary,
              color: integrations?.calendarConnected ? "#166534" : theme.colors.textMuted,
            }}>
              {integrations?.calendarConnected ? "✓ Connected" : "Not connected"}
            </span>
          </div>

          <ul style={{
            margin: "0 0 20px",
            paddingLeft: 20,
            color: theme.colors.textSecondary,
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            <li>Automatic calendar event creation</li>
            <li>Google Meet links for video calls</li>
            <li>Sync updates when meetings are rescheduled</li>
            <li>Delete events when meetings are cancelled</li>
          </ul>

          {integrations?.calendarConnected ? (
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={connectGoogle}
                disabled={connecting === "google"}
                style={{
                  padding: "10px 20px",
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textPrimary,
                  border: `1px solid ${theme.colors.borderMedium}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: connecting === "google" ? "not-allowed" : "pointer",
                  opacity: connecting === "google" ? 0.7 : 1,
                }}
              >
                {connecting === "google" ? "Connecting..." : "Reconnect"}
              </button>
              <button
                onClick={disconnectGoogle}
                disabled={connecting === "google-disconnect"}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: theme.colors.error,
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: connecting === "google-disconnect" ? "not-allowed" : "pointer",
                  opacity: connecting === "google-disconnect" ? 0.7 : 1,
                }}
              >
                {connecting === "google-disconnect" ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={connectGoogle}
              disabled={connecting === "google"}
              style={{
                padding: "12px 24px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                fontWeight: 500,
                cursor: connecting === "google" ? "not-allowed" : "pointer",
                opacity: connecting === "google" ? 0.7 : 1,
              }}
            >
              {connecting === "google" ? "Connecting..." : "Connect Google Calendar"}
            </button>
          )}
        </div>

        {/* Zoom - Coming Soon */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          marginBottom: 24,
          opacity: 0.6,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}>
                🎥
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: theme.colors.textPrimary }}>
                  Zoom
                </h2>
                <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: "4px 0 0" }}>
                  Create Zoom meeting links for video bookings
                </p>
              </div>
            </div>
            <span style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background: theme.colors.bgTertiary,
              color: theme.colors.textMuted,
            }}>
              Coming Soon
            </span>
          </div>

          <ul style={{
            margin: "0 0 20px",
            paddingLeft: 20,
            color: theme.colors.textSecondary,
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            <li>Automatic Zoom meeting creation</li>
            <li>Unique meeting links per booking</li>
            <li>Meeting recordings (optional)</li>
          </ul>

          <button
            disabled
            style={{
              padding: "12px 24px",
              background: theme.colors.bgTertiary,
              color: theme.colors.textMuted,
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontSize: 14,
              fontWeight: 500,
              cursor: "not-allowed",
            }}
          >
            Coming Soon
          </button>
        </div>

        {/* Setup Instructions */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 24,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 8, color: theme.colors.textPrimary }}>
            Setup Instructions
          </h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
            To enable Google Calendar integration, an administrator needs to configure Google Cloud credentials.
          </p>
          <ol style={{
            margin: 0,
            paddingLeft: 20,
            color: theme.colors.textSecondary,
            fontSize: 14,
            lineHeight: 2,
          }}>
            <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary }}>Google Cloud Console</a></li>
            <li>Create a project and enable the Google Calendar API</li>
            <li>Create OAuth 2.0 credentials</li>
            <li>Set redirect URI to: <code style={{ background: theme.colors.bgTertiary, padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>https://wick.omnixia.ai/api/integrations/google/callback</code></li>
            <li>Add credentials to environment variables</li>
            <li>Click "Connect Google Calendar" above</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
