"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

// Public page for guests to cancel or reschedule their booking
export default function ManageBookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const appointmentId = params.appointmentId as string;
  const token = searchParams.get("token"); // Security token from email

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"view" | "cancel" | "reschedule">("view");
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/bookings/manage/${appointmentId}?token=${token || ""}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Appointment not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAppointment(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load appointment");
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/manage/${appointmentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          reason: cancelReason,
        }),
      });

      if (res.ok) {
        setCancelled(true);
        setAction("view");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel");
      }
    } catch (err) {
      alert("Failed to cancel appointment");
    }
    setCancelling(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const brandColor = "#76527c";

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={{ margin: 0, marginBottom: 8 }}>Error</h2>
          <p style={{ margin: 0, color: "#666" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ ...styles.statusIcon, background: "#fee2e2", color: "#dc2626" }}>✓</div>
          <h2 style={{ margin: 0, marginBottom: 8, color: "#dc2626" }}>Appointment Cancelled</h2>
          <p style={{ margin: 0, color: "#666" }}>
            Your appointment has been cancelled. A confirmation email has been sent.
          </p>
        </div>
      </div>
    );
  }

  const isPast = new Date(appointment.startTime) < new Date();
  const isCancelled = appointment.status === "CANCELLED";

  return (
    <div
      style={{
        ...styles.container,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={{ ...styles.title, color: brandColor }}>
            {action === "cancel" ? "Cancel Appointment" : "Manage Appointment"}
          </h1>
        </div>

        {/* Appointment Details */}
        <div style={styles.detailsSection}>
          <div style={styles.detailBox}>
            <div style={{ ...styles.colorBar, background: appointment.bookingType?.color || brandColor }} />
            <div>
              <div style={styles.bookingTypeName}>{appointment.bookingType?.name}</div>
              <div style={styles.duration}>{appointment.bookingType?.duration} minutes</div>
            </div>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📅 Date</span>
              <span style={styles.infoValue}>{formatDate(appointment.startTime)}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>🕐 Time</span>
              <span style={styles.infoValue}>
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </span>
            </div>
            {appointment.host && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>👤 Host</span>
                <span style={styles.infoValue}>{appointment.host.name}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>Status:</span>
            <span
              style={{
                ...styles.statusBadge,
                background: isCancelled ? "#fee2e2" : isPast ? "#e5e7eb" : "#d1fae5",
                color: isCancelled ? "#dc2626" : isPast ? "#6b7280" : "#059669",
              }}
            >
              {isCancelled ? "Cancelled" : isPast ? "Past" : appointment.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!isCancelled && !isPast && action === "view" && (
          <div style={styles.actionsSection}>
            <button
              onClick={() => setAction("cancel")}
              style={{ ...styles.cancelButton, borderColor: "#dc2626", color: "#dc2626" }}
            >
              Cancel Appointment
            </button>
            {/* Reschedule functionality - can be added later */}
            {/* <button
              onClick={() => setAction("reschedule")}
              style={{ ...styles.rescheduleButton, borderColor: brandColor, color: brandColor }}
            >
              Reschedule
            </button> */}
          </div>
        )}

        {/* Cancel Form */}
        {action === "cancel" && (
          <div style={styles.cancelForm}>
            <p style={{ margin: 0, marginBottom: 16, color: "#666" }}>
              Are you sure you want to cancel this appointment?
            </p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let us know why you're cancelling..."
                style={styles.textarea}
                rows={3}
              />
            </div>
            <div style={styles.cancelActions}>
              <button
                onClick={() => setAction("view")}
                style={styles.backButton}
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  ...styles.confirmCancelButton,
                  background: cancelling ? "#ccc" : "#dc2626",
                }}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        )}

        {/* Meeting Link */}
        {appointment.meetingLink && !isCancelled && !isPast && action === "view" && (
          <div style={styles.meetingLinkSection}>
            <a
              href={appointment.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.joinButton, background: brandColor }}
            >
              🔗 Join Meeting
            </a>
          </div>
        )}

        {/* Already Cancelled/Past */}
        {(isCancelled || isPast) && (
          <div style={styles.inactiveMessage}>
            {isCancelled
              ? "This appointment has been cancelled."
              : "This appointment has already passed."}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          Need help? Contact us at support@example.com
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingBox: {
    padding: 40,
    textAlign: "center",
    color: "#666",
  },
  card: {
    background: "white",
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
    maxWidth: 500,
    width: "100%",
    overflow: "hidden",
  },
  header: {
    padding: "28px 28px 20px",
    borderBottom: "1px solid #eee",
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: "center",
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    margin: "0 auto 20px",
  },
  detailsSection: {
    padding: 28,
  },
  detailBox: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 16,
    background: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 20,
  },
  colorBar: {
    width: 6,
    height: 40,
    borderRadius: 4,
  },
  bookingTypeName: {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: 2,
  },
  duration: {
    fontSize: 13,
    color: "#666",
  },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 20,
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: "#888",
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  statusLabel: {
    fontSize: 13,
    color: "#888",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  actionsSection: {
    padding: "0 28px 28px",
    display: "flex",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: "12px 20px",
    background: "transparent",
    border: "2px solid",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  rescheduleButton: {
    flex: 1,
    padding: "12px 20px",
    background: "transparent",
    border: "2px solid",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  cancelForm: {
    padding: "0 28px 28px",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
    color: "#333",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #ddd",
    borderRadius: 10,
    fontSize: 14,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  cancelActions: {
    display: "flex",
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: "12px 20px",
    background: "#f5f5f5",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    color: "#666",
  },
  confirmCancelButton: {
    flex: 1,
    padding: "12px 20px",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    color: "white",
  },
  meetingLinkSection: {
    padding: "0 28px 28px",
    textAlign: "center",
  },
  joinButton: {
    display: "inline-block",
    padding: "14px 32px",
    color: "white",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
  },
  inactiveMessage: {
    padding: "20px 28px",
    background: "#f8f9fa",
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
  footer: {
    padding: "16px 28px",
    borderTop: "1px solid #eee",
    textAlign: "center",
    fontSize: 12,
    color: "#999",
  },
};
