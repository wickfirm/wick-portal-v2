/**
 * Notification Center Page
 * Full list of notifications with filters and pagination
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface Notification {
  id: string;
  userId: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterRead, setFilterRead] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = ["ALL", "TASK", "PROJECT", "TIME", "FINANCE", "APPROVAL", "SYSTEM"];

  useEffect(() => {
    fetchNotifications();
  }, [page, filterCategory, filterRead]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (filterCategory !== "ALL") {
        params.append("category", filterCategory);
      }

      if (filterRead === "UNREAD") {
        params.append("unread", "true");
      }

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  async function deleteNotification(id: string) {
    if (!confirm("Delete this notification?")) return;
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case "TASK": return "📋";
      case "PROJECT": return "📁";
      case "TIME": return "⏰";
      case "FINANCE": return "💰";
      case "APPROVAL": return "✅";
      case "SYSTEM": return "🔔";
      default: return "📢";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return theme.colors.error;
      case "HIGH": return theme.colors.warning;
      case "NORMAL": return theme.colors.info;
      case "LOW": return theme.colors.textMuted;
      default: return theme.colors.textMuted;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Notifications
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Manage your notifications and stay up to date
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            background: theme.colors.bgSecondary,
            padding: 20,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            marginBottom: 24,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.borderLight}`,
                fontSize: 14,
                cursor: "pointer",
                background: theme.colors.bgPrimary,
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
                </option>
              ))}
            </select>

            {/* Read/Unread Filter */}
            <select
              value={filterRead}
              onChange={(e) => {
                setFilterRead(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.borderLight}`,
                fontSize: 14,
                cursor: "pointer",
                background: theme.colors.bgPrimary,
              }}
            >
              <option value="ALL">All</option>
              <option value="UNREAD">Unread Only</option>
              <option value="READ">Read Only</option>
            </select>
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: "8px 16px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div
          style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: theme.colors.textMuted }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: theme.colors.textMuted }}>
              <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>No notifications</div>
              <div style={{ fontSize: 14 }}>You're all caught up!</div>
            </div>
          ) : (
            notifications.map((notification, idx) => (
              <div
                key={notification.id}
                style={{
                  padding: "20px 24px",
                  borderBottom: idx < notifications.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                  background: notification.isRead ? "transparent" : `${theme.colors.primary}06`,
                  transition: "background 150ms ease",
                }}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
                  {/* Icon */}
                  <div style={{ fontSize: 28, flexShrink: 0 }}>
                    {getNotificationIcon(notification.category)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "start", gap: 12, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <h3
                          onClick={() => handleNotificationClick(notification)}
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: notification.isRead ? 500 : 600,
                            color: theme.colors.textPrimary,
                            cursor: notification.link ? "pointer" : "default",
                            marginBottom: 4,
                          }}
                        >
                          {notification.title}
                        </h3>
                        <div
                          style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            lineHeight: 1.5,
                          }}
                        >
                          {notification.message}
                        </div>
                      </div>

                      {/* Priority Badge */}
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: getPriorityColor(notification.priority),
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          flexShrink: 0,
                        }}
                      >
                        {notification.priority}
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                      <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                        {getRelativeTime(notification.createdAt)}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: theme.colors.bgTertiary,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        {notification.category}
                      </span>

                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          style={{
                            fontSize: 13,
                            color: theme.colors.primary,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            fontWeight: 500,
                          }}
                        >
                          Mark as read
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(notification.id)}
                        style={{
                          fontSize: 13,
                          color: theme.colors.error,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          marginLeft: "auto",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "8px 16px",
                background: page === 1 ? theme.colors.bgTertiary : theme.colors.bgSecondary,
                color: page === 1 ? theme.colors.textMuted : theme.colors.textPrimary,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                cursor: page === 1 ? "not-allowed" : "pointer",
                fontSize: 14,
              }}
            >
              Previous
            </button>

            <div style={{ padding: "8px 16px", color: theme.colors.textSecondary, fontSize: 14 }}>
              Page {page} of {totalPages}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "8px 16px",
                background: page === totalPages ? theme.colors.bgTertiary : theme.colors.bgSecondary,
                color: page === totalPages ? theme.colors.textMuted : theme.colors.textPrimary,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                cursor: page === totalPages ? "not-allowed" : "pointer",
                fontSize: 14,
              }}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
