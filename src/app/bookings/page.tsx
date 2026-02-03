"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type Appointment = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCompany?: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  meetingLink?: string;
  bookingType: {
    id: string;
    name: string;
    duration: number;
    color?: string;
  };
  host?: {
    id: string;
    name: string;
    email: string;
  };
};

const STATUS_COLORS: { [key: string]: { bg: string; color: string } } = {
  SCHEDULED: { bg: "#dbeafe", color: "#1d4ed8" },
  CONFIRMED: { bg: "#d1fae5", color: "#059669" },
  COMPLETED: { bg: "#e5e7eb", color: "#6b7280" },
  CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
  NO_SHOW: { bg: "#fef3c7", color: "#d97706" },
  RESCHEDULED: { bg: "#e0e7ff", color: "#4f46e5" },
};

export default function BookingsDashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [viewMode, setViewMode] = useState<"upcoming" | "past">("upcoming");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchAppointments();
  }, [viewMode, filterStatus]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") {
        params.append("status", filterStatus);
      }
      if (viewMode === "upcoming") {
        params.append("startDate", new Date().toISOString());
      } else {
        params.append("endDate", new Date().toISOString());
      }

      const res = await fetch(`/api/bookings/appointments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
    setLoading(false);
  };

  const cancelAppointment = async (id: string) => {
    const reason = prompt("Reason for cancellation (optional):");
    if (reason === null) return; // User clicked cancel

    try {
      const res = await fetch(`/api/bookings/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          cancelledBy: "HOST",
          cancellationReason: reason,
        }),
      });

      if (res.ok) {
        fetchAppointments();
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error("Error cancelling:", error);
    }
  };

  const markAsCompleted = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (res.ok) {
        fetchAppointments();
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error("Error completing:", error);
    }
  };

  const markAsNoShow = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "NO_SHOW" }),
      });

      if (res.ok) {
        fetchAppointments();
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error("Error marking no-show:", error);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const groupAppointmentsByDate = (appts: Appointment[]) => {
    const groups: { [date: string]: Appointment[] } = {};
    appts.forEach((appt) => {
      const dateKey = new Date(appt.startTime).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(appt);
    });
    return groups;
  };

  const groupedAppointments = groupAppointmentsByDate(
    [...appointments].sort((a, b) =>
      viewMode === "upcoming"
        ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        : new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
  );

  const inputStyle: React.CSSProperties = {
    padding: "8px 14px",
    border: "1px solid " + theme.colors.borderLight,
    borderRadius: 8,
    fontSize: 13,
    background: theme.colors.bgPrimary,
    color: theme.colors.textPrimary,
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.colors.bgPrimary,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 32,
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: 6,
              }}
            >
              Bookings
            </h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
              Manage your scheduled meetings and appointments
            </p>
          </div>
          <a
            href="/settings/bookings"
            style={{
              padding: "10px 20px",
              background: theme.colors.bgSecondary,
              color: theme.colors.textSecondary,
              border: "1px solid " + theme.colors.borderLight,
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ⚙️ Settings
          </a>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {/* View Toggle */}
          <div
            style={{
              display: "flex",
              background: theme.colors.bgSecondary,
              borderRadius: 10,
              padding: 4,
              border: "1px solid " + theme.colors.borderLight,
            }}
          >
            {(["upcoming", "past"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "8px 16px",
                  background: viewMode === mode ? theme.gradients.primary : "transparent",
                  color: viewMode === mode ? "white" : theme.colors.textSecondary,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={inputStyle}
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>

          {/* Stats */}
          <div style={{ marginLeft: "auto", fontSize: 13, color: theme.colors.textMuted }}>
            {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 64,
              color: theme.colors.textMuted,
            }}
          >
            Loading appointments...
          </div>
        ) : Object.keys(groupedAppointments).length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 64,
              background: theme.colors.bgSecondary,
              borderRadius: 16,
              border: "1px solid " + theme.colors.borderLight,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <h3 style={{ margin: 0, marginBottom: 8, color: theme.colors.textPrimary }}>
              No {viewMode} appointments
            </h3>
            <p style={{ margin: 0, color: theme.colors.textMuted }}>
              {viewMode === "upcoming"
                ? "Your upcoming bookings will appear here"
                : "Your past appointments will appear here"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(groupedAppointments).map(([dateKey, dayAppointments]) => (
              <div key={dateKey}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.colors.textSecondary,
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {new Date(dateKey).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dayAppointments.map((appt) => {
                    const { date, time } = formatDateTime(appt.startTime);
                    const statusStyle = STATUS_COLORS[appt.status] || STATUS_COLORS.SCHEDULED;

                    return (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppointment(appt)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: 16,
                          background: theme.colors.bgSecondary,
                          borderRadius: 12,
                          border: "1px solid " + theme.colors.borderLight,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Color Bar */}
                        <div
                          style={{
                            width: 4,
                            height: 48,
                            borderRadius: 4,
                            background: appt.bookingType?.color || theme.colors.primary,
                          }}
                        />

                        {/* Time */}
                        <div style={{ minWidth: 80 }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: theme.colors.textPrimary,
                            }}
                          >
                            {time}
                          </div>
                          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                            {appt.bookingType?.duration} min
                          </div>
                        </div>

                        {/* Guest Info */}
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              color: theme.colors.textPrimary,
                              marginBottom: 2,
                            }}
                          >
                            {appt.guestName}
                          </div>
                          <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                            {appt.bookingType?.name}
                            {appt.guestCompany && ` • ${appt.guestCompany}`}
                          </div>
                        </div>

                        {/* Host */}
                        {appt.host && (
                          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                            with {appt.host.name}
                          </div>
                        )}

                        {/* Status */}
                        <div
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            textTransform: "uppercase",
                          }}
                        >
                          {appt.status.replace("_", " ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Panel */}
        {selectedAppointment && (
          <>
            <div
              onClick={() => setSelectedAppointment(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                zIndex: 999,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(480px, 90vw)",
                background: theme.colors.bgSecondary,
                boxShadow: theme.shadows.lg,
                zIndex: 1000,
                overflowY: "auto",
                padding: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 22,
                    fontWeight: 400,
                    margin: 0,
                  }}
                >
                  Appointment Details
                </h2>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  style={{
                    background: theme.colors.bgTertiary,
                    border: "none",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 18,
                    color: theme.colors.textMuted,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Meeting Type */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  background: theme.colors.bgTertiary,
                  borderRadius: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 40,
                    borderRadius: 4,
                    background: selectedAppointment.bookingType?.color || theme.colors.primary,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: theme.colors.textPrimary }}>
                    {selectedAppointment.bookingType?.name}
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                    {selectedAppointment.bookingType?.duration} minutes
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" }}>
                  When
                </h4>
                <div style={{ fontSize: 15, color: theme.colors.textPrimary }}>
                  {new Date(selectedAppointment.startTime).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                  {formatDateTime(selectedAppointment.startTime).time} -{" "}
                  {formatDateTime(selectedAppointment.endTime).time}
                </div>
              </div>

              {/* Guest Info */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" }}>
                  Guest
                </h4>
                <div style={{ fontSize: 15, fontWeight: 500, color: theme.colors.textPrimary }}>
                  {selectedAppointment.guestName}
                </div>
                <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                  {selectedAppointment.guestEmail}
                </div>
                {selectedAppointment.guestPhone && (
                  <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {selectedAppointment.guestPhone}
                  </div>
                )}
                {selectedAppointment.guestCompany && (
                  <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {selectedAppointment.guestCompany}
                  </div>
                )}
              </div>

              {/* Host */}
              {selectedAppointment.host && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" }}>
                    Host
                  </h4>
                  <div style={{ fontSize: 15, color: theme.colors.textPrimary }}>
                    {selectedAppointment.host.name}
                  </div>
                  <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {selectedAppointment.host.email}
                  </div>
                </div>
              )}

              {/* Meeting Link */}
              {selectedAppointment.meetingLink && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" }}>
                    Meeting Link
                  </h4>
                  <a
                    href={selectedAppointment.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 16px",
                      background: theme.colors.primary,
                      color: "white",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    🔗 Join Meeting
                  </a>
                </div>
              )}

              {/* Notes */}
              {selectedAppointment.notes && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" }}>
                    Notes
                  </h4>
                  <div style={{ fontSize: 14, color: theme.colors.textSecondary, whiteSpace: "pre-wrap" }}>
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}

              {/* Status */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" }}>
                  Status
                </h4>
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: STATUS_COLORS[selectedAppointment.status]?.bg || "#e5e7eb",
                    color: STATUS_COLORS[selectedAppointment.status]?.color || "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedAppointment.status.replace("_", " ")}
                </div>
              </div>

              {/* Actions */}
              {["SCHEDULED", "CONFIRMED"].includes(selectedAppointment.status) && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => markAsCompleted(selectedAppointment.id)}
                    style={{
                      padding: "10px 18px",
                      background: theme.colors.success,
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    ✓ Mark Complete
                  </button>
                  <button
                    onClick={() => markAsNoShow(selectedAppointment.id)}
                    style={{
                      padding: "10px 18px",
                      background: theme.colors.warningBg,
                      color: "#92400e",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    No Show
                  </button>
                  <button
                    onClick={() => cancelAppointment(selectedAppointment.id)}
                    style={{
                      padding: "10px 18px",
                      background: theme.colors.errorBg,
                      color: theme.colors.error,
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
