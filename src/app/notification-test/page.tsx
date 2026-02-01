/**
 * Notification Testing Page
 * Test all notification features
 */

"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export default function NotificationTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (result: string, success: boolean) => {
    const icon = success ? "✅" : "❌";
    setTestResults((prev) => [...prev, `${icon} ${result}`]);
  };

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setLoading(true);
    try {
      const success = await testFn();
      addResult(testName, success);
    } catch (error) {
      addResult(`${testName}: ${error}`, false);
    } finally {
      setLoading(false);
    }
  };

  // Test 1: Create notification
  const testCreateNotification = async () => {
    const res = await fetch("/api/test-notification", { method: "POST" });
    return res.ok;
  };

  // Test 2: Check unread count
  const testUnreadCount = async () => {
    const res = await fetch("/api/notifications/unread-count");
    const data = await res.json();
    addResult(`Unread count: ${data.count}`, true);
    return res.ok;
  };

  // Test 3: Fetch notifications
  const testFetchNotifications = async () => {
    const res = await fetch("/api/notifications?limit=5");
    const data = await res.json();
    addResult(`Found ${data.notifications.length} notifications`, true);
    return res.ok;
  };

  // Test 4: Mark as read
  const testMarkAsRead = async () => {
    // Get first notification
    const res = await fetch("/api/notifications?limit=1");
    const data = await res.json();
    
    if (data.notifications.length === 0) {
      addResult("No notifications to mark as read", false);
      return false;
    }

    const notificationId = data.notifications[0].id;
    const markRes = await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
    });
    return markRes.ok;
  };

  // Test 5: Check preferences
  const testPreferences = async () => {
    const res = await fetch("/api/notifications/preferences");
    const data = await res.json();
    addResult(`Email enabled: ${data.emailEnabled}`, true);
    return res.ok;
  };

  // Run all tests
  const runAllTests = async () => {
    setTestResults([]);
    
    await runTest("1. Create test notification", testCreateNotification);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await runTest("2. Check unread count", testUnreadCount);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await runTest("3. Fetch notifications", testFetchNotifications);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await runTest("4. Mark notification as read", testMarkAsRead);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    await runTest("5. Check user preferences", testPreferences);
    
    addResult("All tests completed!", true);
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Notification System Testing
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Run tests to verify Phase 2 is working correctly
          </p>
        </div>

        {/* Manual Checklist */}
        <div
          style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 600 }}>
            📋 Manual Checklist
          </h2>

          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "flex", gap: 12, alignItems: "start", fontSize: 14 }}>
              <input type="checkbox" style={{ marginTop: 4 }} />
              <span>
                <strong>Bell icon visible</strong> in header (top-right, between Timer and avatar)
              </span>
            </label>

            <label style={{ display: "flex", gap: 12, alignItems: "start", fontSize: 14 }}>
              <input type="checkbox" style={{ marginTop: 4 }} />
              <span>
                <strong>Red badge</strong> shows unread count on bell icon
              </span>
            </label>

            <label style={{ display: "flex", gap: 12, alignItems: "start", fontSize: 14 }}>
              <input type="checkbox" style={{ marginTop: 4 }} />
              <span>
                <strong>Click bell</strong> opens dropdown with notifications
              </span>
            </label>

            <label style={{ display: "flex", gap: 12, alignItems: "start", fontSize: 14 }}>
              <input type="checkbox" style={{ marginTop: 4 }} />
              <span>
                <strong>Click notification</strong> navigates to linked page
              </span>
            </label>

            <label style={{ display: "flex", gap: 12, alignItems: "start", fontSize: 14 }}>
              <input type="checkbox" style={{ marginTop: 4 }} />
              <span>
                <strong>"Mark all read"</strong> button clears badge
              </span>
            </label>

            <label style={{ display: "flex", gap: 12, alignItems: "start", fontSize: 14 }}>
              <input type="checkbox" style={{ marginTop: 4 }} />
              <span>
                <strong>"View all"</strong> link goes to /notifications page
              </span>
            </label>

            <label style={{ display: "flex", gap: 12, alignItems: "start", fontSize: 14 }}>
              <input type="checkbox" style={{ marginTop: 4 }} />
              <span>
                <strong>Notification center page</strong> shows full list with filters
              </span>
            </label>

            <label style={{ display: "flex", gap: 12, alignItems: "start", fontSize: 14 }}>
              <input type="checkbox" style={{ marginTop: 4 }} />
              <span>
                <strong>Polling works</strong> (badge updates within 30 seconds after creating notification)
              </span>
            </label>
          </div>
        </div>

        {/* Automated Tests */}
        <div
          style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 600 }}>
            🤖 Automated Tests
          </h2>

          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button
              onClick={runAllTests}
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading ? theme.colors.bgTertiary : theme.colors.primary,
                color: loading ? theme.colors.textMuted : "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Running tests..." : "Run All Tests"}
            </button>

            <button
              onClick={() => runTest("Create notification", testCreateNotification)}
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: theme.colors.bgTertiary,
                color: theme.colors.textPrimary,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Create Test Notification
            </button>

            <button
              onClick={() => setTestResults([])}
              style={{
                padding: "12px 24px",
                background: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                cursor: "pointer",
              }}
            >
              Clear Results
            </button>
          </div>

          {/* Test Results */}
          <div
            style={{
              background: "#1a1a1a",
              color: "#00ff00",
              padding: 16,
              borderRadius: theme.borderRadius.md,
              fontFamily: "monospace",
              fontSize: 13,
              minHeight: 200,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {testResults.length === 0 ? (
              <div style={{ color: "#666" }}>Click "Run All Tests" to start testing...</div>
            ) : (
              testResults.map((result, idx) => (
                <div key={idx} style={{ marginBottom: 4 }}>
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 600 }}>
            ⚡ Quick Actions
          </h2>

          <div style={{ display: "grid", gap: 12 }}>
            <a
              href="/api/test-notification"
              target="_blank"
              style={{
                padding: 12,
                background: theme.colors.infoBg,
                color: theme.colors.info,
                borderRadius: theme.borderRadius.md,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                display: "block",
              }}
            >
              📤 Create notification (opens in new tab)
            </a>

            <a
              href="/api/notifications/unread-count"
              target="_blank"
              style={{
                padding: 12,
                background: theme.colors.infoBg,
                color: theme.colors.info,
                borderRadius: theme.borderRadius.md,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                display: "block",
              }}
            >
              🔢 Check unread count
            </a>

            <a
              href="/api/notifications"
              target="_blank"
              style={{
                padding: 12,
                background: theme.colors.infoBg,
                color: theme.colors.info,
                borderRadius: theme.borderRadius.md,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                display: "block",
              }}
            >
              📋 View all notifications (API)
            </a>

            <a
              href="/notifications"
              style={{
                padding: 12,
                background: theme.colors.successBg,
                color: theme.colors.success,
                borderRadius: theme.borderRadius.md,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                display: "block",
              }}
            >
              📱 Open notification center page
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
