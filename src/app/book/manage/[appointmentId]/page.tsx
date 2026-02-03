"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

// Comprehensive timezone list grouped by region
const TIMEZONE_GROUPS = [
  {
    region: "Americas",
    timezones: [
      { value: "Pacific/Honolulu", label: "Hawaii (HST)", offset: -10 },
      { value: "America/Anchorage", label: "Alaska (AKST)", offset: -9 },
      { value: "America/Los_Angeles", label: "Pacific Time (PST)", offset: -8 },
      { value: "America/Phoenix", label: "Arizona (MST)", offset: -7 },
      { value: "America/Denver", label: "Mountain Time (MST)", offset: -7 },
      { value: "America/Chicago", label: "Central Time (CST)", offset: -6 },
      { value: "America/Mexico_City", label: "Mexico City (CST)", offset: -6 },
      { value: "America/New_York", label: "Eastern Time (EST)", offset: -5 },
      { value: "America/Toronto", label: "Toronto (EST)", offset: -5 },
      { value: "America/Bogota", label: "Bogotá (COT)", offset: -5 },
      { value: "America/Lima", label: "Lima (PET)", offset: -5 },
      { value: "America/Halifax", label: "Atlantic Time (AST)", offset: -4 },
      { value: "America/Sao_Paulo", label: "São Paulo (BRT)", offset: -3 },
      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART)", offset: -3 },
      { value: "America/Santiago", label: "Santiago (CLT)", offset: -3 },
    ],
  },
  {
    region: "Europe",
    timezones: [
      { value: "Atlantic/Reykjavik", label: "Reykjavik (GMT)", offset: 0 },
      { value: "Europe/London", label: "London (GMT)", offset: 0 },
      { value: "Europe/Dublin", label: "Dublin (GMT)", offset: 0 },
      { value: "Europe/Lisbon", label: "Lisbon (WET)", offset: 0 },
      { value: "Europe/Paris", label: "Paris (CET)", offset: 1 },
      { value: "Europe/Berlin", label: "Berlin (CET)", offset: 1 },
      { value: "Europe/Amsterdam", label: "Amsterdam (CET)", offset: 1 },
      { value: "Europe/Brussels", label: "Brussels (CET)", offset: 1 },
      { value: "Europe/Madrid", label: "Madrid (CET)", offset: 1 },
      { value: "Europe/Rome", label: "Rome (CET)", offset: 1 },
      { value: "Europe/Zurich", label: "Zurich (CET)", offset: 1 },
      { value: "Europe/Vienna", label: "Vienna (CET)", offset: 1 },
      { value: "Europe/Warsaw", label: "Warsaw (CET)", offset: 1 },
      { value: "Europe/Stockholm", label: "Stockholm (CET)", offset: 1 },
      { value: "Europe/Oslo", label: "Oslo (CET)", offset: 1 },
      { value: "Europe/Copenhagen", label: "Copenhagen (CET)", offset: 1 },
      { value: "Europe/Prague", label: "Prague (CET)", offset: 1 },
      { value: "Europe/Budapest", label: "Budapest (CET)", offset: 1 },
      { value: "Europe/Athens", label: "Athens (EET)", offset: 2 },
      { value: "Europe/Helsinki", label: "Helsinki (EET)", offset: 2 },
      { value: "Europe/Bucharest", label: "Bucharest (EET)", offset: 2 },
      { value: "Europe/Kiev", label: "Kyiv (EET)", offset: 2 },
      { value: "Europe/Istanbul", label: "Istanbul (TRT)", offset: 3 },
      { value: "Europe/Moscow", label: "Moscow (MSK)", offset: 3 },
    ],
  },
  {
    region: "Middle East",
    timezones: [
      { value: "Asia/Beirut", label: "Beirut (EET)", offset: 2 },
      { value: "Asia/Jerusalem", label: "Jerusalem (IST)", offset: 2 },
      { value: "Asia/Amman", label: "Amman (EET)", offset: 2 },
      { value: "Asia/Baghdad", label: "Baghdad (AST)", offset: 3 },
      { value: "Asia/Kuwait", label: "Kuwait (AST)", offset: 3 },
      { value: "Asia/Riyadh", label: "Riyadh (AST)", offset: 3 },
      { value: "Asia/Qatar", label: "Qatar (AST)", offset: 3 },
      { value: "Asia/Bahrain", label: "Bahrain (AST)", offset: 3 },
      { value: "Asia/Tehran", label: "Tehran (IRST)", offset: 3.5 },
      { value: "Asia/Dubai", label: "Dubai (GST)", offset: 4 },
      { value: "Asia/Muscat", label: "Muscat (GST)", offset: 4 },
    ],
  },
  {
    region: "Africa",
    timezones: [
      { value: "Africa/Casablanca", label: "Casablanca (WET)", offset: 0 },
      { value: "Africa/Lagos", label: "Lagos (WAT)", offset: 1 },
      { value: "Africa/Cairo", label: "Cairo (EET)", offset: 2 },
      { value: "Africa/Johannesburg", label: "Johannesburg (SAST)", offset: 2 },
      { value: "Africa/Nairobi", label: "Nairobi (EAT)", offset: 3 },
    ],
  },
  {
    region: "Asia",
    timezones: [
      { value: "Asia/Karachi", label: "Karachi (PKT)", offset: 5 },
      { value: "Asia/Kolkata", label: "Mumbai / Delhi (IST)", offset: 5.5 },
      { value: "Asia/Colombo", label: "Colombo (IST)", offset: 5.5 },
      { value: "Asia/Dhaka", label: "Dhaka (BST)", offset: 6 },
      { value: "Asia/Bangkok", label: "Bangkok (ICT)", offset: 7 },
      { value: "Asia/Jakarta", label: "Jakarta (WIB)", offset: 7 },
      { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh (ICT)", offset: 7 },
      { value: "Asia/Singapore", label: "Singapore (SGT)", offset: 8 },
      { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (MYT)", offset: 8 },
      { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", offset: 8 },
      { value: "Asia/Taipei", label: "Taipei (CST)", offset: 8 },
      { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: 8 },
      { value: "Asia/Manila", label: "Manila (PHT)", offset: 8 },
      { value: "Asia/Seoul", label: "Seoul (KST)", offset: 9 },
      { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: 9 },
    ],
  },
  {
    region: "Australia & Pacific",
    timezones: [
      { value: "Australia/Perth", label: "Perth (AWST)", offset: 8 },
      { value: "Australia/Darwin", label: "Darwin (ACST)", offset: 9.5 },
      { value: "Australia/Adelaide", label: "Adelaide (ACST)", offset: 9.5 },
      { value: "Australia/Brisbane", label: "Brisbane (AEST)", offset: 10 },
      { value: "Australia/Sydney", label: "Sydney (AEST)", offset: 10 },
      { value: "Australia/Melbourne", label: "Melbourne (AEST)", offset: 10 },
      { value: "Pacific/Auckland", label: "Auckland (NZST)", offset: 12 },
      { value: "Pacific/Fiji", label: "Fiji (FJT)", offset: 12 },
    ],
  },
];

// Flat list for lookups
const TIMEZONES = TIMEZONE_GROUPS.flatMap(g => g.timezones);

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
  const [rescheduled, setRescheduled] = useState(false);

  // Reschedule state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Timezone state
  const [guestTimezone, setGuestTimezone] = useState<string>("");
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const timezoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Detect guest timezone
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setGuestTimezone(detectedTz);
    fetchAppointment();
  }, [appointmentId]);

  // Close timezone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timezoneRef.current && !timezoneRef.current.contains(e.target as Node)) {
        setShowTimezoneDropdown(false);
      }
    };
    if (showTimezoneDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTimezoneDropdown]);

  // Fetch available days when in reschedule mode
  useEffect(() => {
    if (action === "reschedule" && appointment?.bookingType?.id) {
      fetchAvailableDays();
    }
  }, [action, currentMonth, appointment]);

  // Fetch available slots when date selected
  useEffect(() => {
    if (selectedDate && appointment?.bookingType?.id) {
      fetchAvailableSlots();
    }
  }, [selectedDate, appointment]);

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

  const fetchAvailableDays = async () => {
    if (!appointment?.bookingType?.id) return;

    // We need to get the booking type slug from the appointment
    // For simplicity, we'll use the bookingTypeId to look up available days
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/bookings/types/${appointment.bookingType.id}/slots?month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableDays(data.availableDays || []);
      }
    } catch (err) {
      console.error("Error fetching available days:", err);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !appointment?.bookingType?.id) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings/types/${appointment.bookingType.id}/slots?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    }
    setLoadingSlots(false);
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

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    if (!confirm("Are you sure you want to reschedule to this time?")) return;

    setRescheduling(true);
    try {
      const res = await fetch(`/api/bookings/manage/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStartTime: selectedSlot,
          guestTimezone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRescheduled(true);
        // Update local appointment data
        setAppointment({
          ...appointment,
          startTime: data.appointment.startTime,
          endTime: data.appointment.endTime,
        });
        setAction("view");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reschedule");
      }
    } catch (err) {
      alert("Failed to reschedule appointment");
    }
    setRescheduling(false);
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
      timeZone: guestTimezone || undefined,
    });
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const formatDateStr = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isDateAvailable = (dateStr: string) => {
    return availableDays.includes(dateStr);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimezoneLabel = (tz: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "short",
      });
      const parts = formatter.formatToParts(new Date());
      const tzPart = parts.find(p => p.type === "timeZoneName");
      return tzPart?.value || tz;
    } catch {
      return tz;
    }
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

  if (rescheduled) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ ...styles.statusIcon, background: "#d1fae5", color: "#059669" }}>✓</div>
          <h2 style={{ margin: 0, marginBottom: 8, color: "#059669" }}>Appointment Rescheduled!</h2>
          <p style={{ margin: 0, color: "#666", marginBottom: 16 }}>
            Your new appointment time:
          </p>
          <div style={{ background: "#f8f9fa", padding: 16, borderRadius: 10, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatDate(appointment.startTime)}</div>
            <div style={{ color: "#666" }}>{formatTime(appointment.startTime)}</div>
          </div>
          <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
            A confirmation email has been sent with the updated details.
          </p>
        </div>
      </div>
    );
  }

  const isPast = new Date(appointment.startTime) < new Date();
  const isCancelled = appointment.status === "CANCELLED";
  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  return (
    <div
      style={{
        ...styles.container,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <div style={{ ...styles.card, maxWidth: action === "reschedule" ? 600 : 500 }}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={{ ...styles.title, color: brandColor }}>
            {action === "cancel" ? "Cancel Appointment" : action === "reschedule" ? "Reschedule Appointment" : "Manage Appointment"}
          </h1>
        </div>

        {/* Appointment Details (show in view and cancel modes) */}
        {(action === "view" || action === "cancel") && (
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
        )}

        {/* Actions */}
        {!isCancelled && !isPast && action === "view" && (
          <div style={styles.actionsSection}>
            <button
              onClick={() => setAction("reschedule")}
              style={{ ...styles.rescheduleButton, borderColor: brandColor, color: brandColor }}
            >
              🔄 Reschedule
            </button>
            <button
              onClick={() => setAction("cancel")}
              style={{ ...styles.cancelButton, borderColor: "#dc2626", color: "#dc2626" }}
            >
              Cancel
            </button>
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

        {/* Reschedule Form */}
        {action === "reschedule" && (
          <div style={styles.rescheduleForm}>
            <button onClick={() => { setAction("view"); setSelectedDate(null); setSelectedSlot(null); }} style={styles.backLink}>
              ← Back to appointment details
            </button>

            {/* Current Time Display */}
            <div style={styles.currentTimeBox}>
              <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>Current Time</div>
              <div style={{ fontWeight: 500 }}>
                {formatDate(appointment.startTime)} at {formatTime(appointment.startTime)}
              </div>
            </div>

            {/* Timezone Selector */}
            <div style={styles.timezoneBar}>
              <div ref={timezoneRef} style={styles.timezoneSelector}>
                <button
                  onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                  style={styles.timezoneButton}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>{TIMEZONES.find(tz => tz.value === guestTimezone)?.label || getTimezoneLabel(guestTimezone)}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "auto" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showTimezoneDropdown && (
                  <div style={styles.timezoneDropdown}>
                    <div style={styles.timezoneSearch}>
                      <input
                        type="text"
                        placeholder="Search timezone..."
                        style={styles.timezoneSearchInput}
                        onChange={(e) => {
                          const search = e.target.value.toLowerCase();
                          const dropdown = e.target.parentElement?.parentElement;
                          const items = dropdown?.querySelectorAll('[data-tz-item]');
                          items?.forEach((item) => {
                            const el = item as HTMLElement;
                            const label = el.textContent?.toLowerCase() || '';
                            el.style.display = label.includes(search) ? 'block' : 'none';
                          });
                        }}
                        autoFocus
                      />
                    </div>
                    <div style={styles.timezoneList}>
                      {TIMEZONE_GROUPS.map((group) => (
                        <div key={group.region} data-tz-group>
                          <div style={styles.timezoneGroupHeader} data-tz-item>
                            {group.region}
                          </div>
                          {group.timezones.map((tz) => (
                            <button
                              key={tz.value}
                              data-tz-item
                              onClick={() => {
                                setGuestTimezone(tz.value);
                                setShowTimezoneDropdown(false);
                              }}
                              style={{
                                ...styles.timezoneOption,
                                background: guestTimezone === tz.value ? "#f0f7ff" : "transparent",
                                fontWeight: guestTimezone === tz.value ? 600 : 400,
                              }}
                            >
                              <span>{tz.label}</span>
                              <span style={{ color: "#999", fontSize: 11 }}>
                                UTC{tz.offset >= 0 ? "+" : ""}{tz.offset}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div style={styles.calendarSection}>
              <div style={styles.calendarNav}>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  style={styles.navButton}
                >
                  ←
                </button>
                <span style={styles.monthLabel}>
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  style={styles.navButton}
                >
                  →
                </button>
              </div>

              <div style={styles.calendarGrid}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} style={styles.dayHeader}>
                    {day}
                  </div>
                ))}
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} style={styles.dayEmpty} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isAvailable = isDateAvailable(dateStr);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={day}
                      onClick={() => isAvailable && setSelectedDate(dateStr)}
                      disabled={!isAvailable}
                      style={{
                        ...styles.dayCell,
                        ...(isAvailable ? styles.dayCellAvailable : styles.dayCellDisabled),
                        ...(isSelected ? { ...styles.dayCellSelected, background: brandColor } : {}),
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div style={styles.slotsSection}>
                <h3 style={styles.slotsTitle}>{formatDisplayDate(selectedDate)}</h3>
                {loadingSlots ? (
                  <p style={{ color: "#999", textAlign: "center" }}>Loading times...</p>
                ) : availableSlots.length === 0 ? (
                  <p style={{ color: "#999", textAlign: "center" }}>No available times</p>
                ) : (
                  <>
                    <div style={styles.slotsGrid}>
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedSlot(slot.time)}
                          style={{
                            ...styles.slotButton,
                            borderColor: selectedSlot === slot.time ? brandColor : "#ddd",
                            background: selectedSlot === slot.time ? brandColor : "transparent",
                            color: selectedSlot === slot.time ? "white" : brandColor,
                          }}
                        >
                          {formatTime(slot.time)}
                        </button>
                      ))}
                    </div>

                    {/* Confirm Reschedule Button */}
                    {selectedSlot && (
                      <button
                        onClick={handleReschedule}
                        disabled={rescheduling}
                        style={{
                          ...styles.confirmRescheduleButton,
                          background: rescheduling ? "#ccc" : brandColor,
                        }}
                      >
                        {rescheduling ? "Rescheduling..." : "Confirm New Time"}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
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
        {(isCancelled || isPast) && action === "view" && (
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
  // Reschedule styles
  rescheduleForm: {
    padding: "20px 28px 28px",
  },
  backLink: {
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 16,
    padding: 0,
  },
  currentTimeBox: {
    background: "#f8f9fa",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderLeft: "4px solid #f59e0b",
  },
  timezoneBar: {
    marginBottom: 16,
    display: "flex",
    justifyContent: "center",
  },
  timezoneSelector: {
    position: "relative" as const,
  },
  timezoneButton: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 12,
    color: "#555",
    cursor: "pointer",
    minWidth: 180,
  },
  timezoneDropdown: {
    position: "absolute" as const,
    top: "calc(100% + 4px)",
    left: "50%",
    transform: "translateX(-50%)",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    width: 300,
    maxHeight: 360,
    zIndex: 1000,
    overflow: "hidden",
  },
  timezoneSearch: {
    padding: 8,
    borderBottom: "1px solid #eee",
  },
  timezoneSearchInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  timezoneList: {
    maxHeight: 300,
    overflowY: "auto" as const,
  },
  timezoneOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 14px",
    border: "none",
    background: "transparent",
    fontSize: 13,
    color: "#333",
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background 0.1s ease",
  },
  timezoneGroupHeader: {
    padding: "8px 14px",
    fontSize: 11,
    fontWeight: 600,
    color: "#999",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    background: "#fafafa",
    borderTop: "1px solid #eee",
    position: "sticky" as const,
    top: 0,
  },
  calendarSection: {
    marginBottom: 16,
  },
  calendarNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navButton: {
    background: "transparent",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 14,
  },
  monthLabel: {
    fontWeight: 600,
    fontSize: 16,
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  },
  dayHeader: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "#999",
    padding: 8,
    textTransform: "uppercase",
  },
  dayEmpty: {
    padding: 8,
  },
  dayCell: {
    padding: 10,
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  dayCellAvailable: {
    background: "#f0f7ff",
    color: "#333",
    fontWeight: 500,
  },
  dayCellDisabled: {
    background: "transparent",
    color: "#ccc",
    cursor: "default",
  },
  dayCellSelected: {
    color: "white",
    fontWeight: 600,
  },
  slotsSection: {
    borderTop: "1px solid #eee",
    paddingTop: 20,
  },
  slotsTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: "#333",
    margin: 0,
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginTop: 12,
  },
  slotButton: {
    padding: "10px 12px",
    border: "2px solid",
    borderRadius: 8,
    background: "transparent",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  confirmRescheduleButton: {
    width: "100%",
    marginTop: 20,
    padding: "14px 24px",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
};
