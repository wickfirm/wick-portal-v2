/**
 * NotificationBell Component
 * Bell icon with badge, dropdown with last 10 notifications
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications({ limit: 10 });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Format relative time
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

  // Get icon based on notification type
  const getNotificationIcon = (type: string, category: string) => {
    switch (category) {
      case "TASK":
        return "📋";
      case "PROJECT":
        return "📁";
      case "TIME":
        return "⏰";
      case "FINANCE":
        return "💰";
      case "APPROVAL":
        return "✅";
      case "SYSTEM":
        return "🔔";
      default:
        return "📢";
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to link if exists
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 8,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.colors.bgTertiary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Bell Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.textSecondary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: theme.colors.error,
              color: "white",
              borderRadius: "50%",
              minWidth: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              padding: "0 4px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 400,
            maxHeight: 500,
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${theme.colors.borderLight}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: theme.colors.primary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", maxHeight: 400 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: theme.colors.textMuted,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                <div style={{ fontSize: 14 }}>No notifications</div>
              </div>
            ) : (
              notifications.map((notification, idx) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: "12px 20px",
                    borderBottom:
                      idx < notifications.length - 1
                        ? `1px solid ${theme.colors.bgTertiary}`
                        : "none",
                    cursor: notification.link ? "pointer" : "default",
                    background: notification.isRead
                      ? "transparent"
                      : `${theme.colors.primary}08`,
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (notification.link) {
                      e.currentTarget.style.background = theme.colors.bgTertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.isRead
                      ? "transparent"
                      : `${theme.colors.primary}08`;
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
                    {/* Icon */}
                    <div style={{ fontSize: 20, marginTop: 2 }}>
                      {getNotificationIcon(notification.type, notification.category)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: notification.isRead ? 400 : 600,
                          color: theme.colors.textPrimary,
                          marginBottom: 4,
                        }}
                      >
                        {notification.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: theme.colors.textSecondary,
                          marginBottom: 6,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {notification.message}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.colors.textMuted,
                        }}
                      >
                        {getRelativeTime(notification.createdAt)}
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: theme.colors.primary,
                          marginTop: 8,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "12px 20px",
                borderTop: `1px solid ${theme.colors.borderLight}`,
                textAlign: "center",
              }}
            >
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                style={{
                  color: theme.colors.primary,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
