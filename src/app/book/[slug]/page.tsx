"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// Minimalist public booking page - no auth required
export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form state
  const [step, setStep] = useState<"calendar" | "form" | "confirmation">("calendar");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCompany, setGuestCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchBookingInfo();
  }, [slug]);

  useEffect(() => {
    if (bookingData) {
      fetchAvailableDays();
    }
  }, [currentMonth, bookingData]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchBookingInfo = async () => {
    try {
      const res = await fetch(`/api/bookings/public/${slug}`);
      if (!res.ok) {
        setError("Booking type not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setBookingData(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load booking info");
      setLoading(false);
    }
  };

  const fetchAvailableDays = async () => {
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/bookings/public/${slug}?month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableDays(data.availableDays || []);
      }
    } catch (err) {
      console.error("Error fetching available days:", err);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings/public/${slug}?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    }
    setLoadingSlots(false);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !guestName || !guestEmail) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/public/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: selectedSlot,
          guestName,
          guestEmail,
          guestPhone,
          guestCompany,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmationData(data.appointment);
        setStep("confirmation");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to book");
      }
    } catch (err) {
      alert("Failed to book. Please try again.");
    }
    setSubmitting(false);
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

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Branding colors
  const brandColor = bookingData?.agency?.primaryColor || "#76527c";

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
        <div style={styles.errorBox}>
          <h2 style={{ margin: 0, marginBottom: 8 }}>Not Found</h2>
          <p style={{ margin: 0, color: "#666" }}>{error}</p>
        </div>
      </div>
    );
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

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
          {bookingData?.agency?.logo && (
            <img
              src={bookingData.agency.logo}
              alt={bookingData.agency.name}
              style={{ height: 40, marginBottom: 16 }}
            />
          )}
          <h1 style={{ ...styles.title, color: brandColor }}>
            {bookingData?.bookingType?.name}
          </h1>
          {bookingData?.bookingType?.description && (
            <p style={styles.subtitle}>{bookingData.bookingType.description}</p>
          )}
          <div style={styles.duration}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {bookingData?.bookingType?.duration} minutes
          </div>
        </div>

        {step === "calendar" && (
          <>
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
                  <div style={styles.slotsGrid}>
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => {
                          setSelectedSlot(slot.time);
                          setStep("form");
                        }}
                        style={{
                          ...styles.slotButton,
                          borderColor: brandColor,
                          color: brandColor,
                        }}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {step === "form" && (
          <div style={styles.formSection}>
            <button onClick={() => setStep("calendar")} style={styles.backButton}>
              ← Back to calendar
            </button>

            <div style={styles.selectedTime}>
              <strong>{formatDisplayDate(selectedDate!)}</strong>
              <br />
              {formatTime(selectedSlot!)}
            </div>

            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  style={styles.input}
                  placeholder="Your name"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  style={styles.input}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  style={styles.input}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Company</label>
                <input
                  type="text"
                  value={guestCompany}
                  onChange={(e) => setGuestCompany(e.target.value)}
                  style={styles.input}
                  placeholder="Company name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
                  placeholder="Anything you'd like us to know?"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !guestName || !guestEmail}
                style={{
                  ...styles.submitButton,
                  background: submitting ? "#ccc" : brandColor,
                }}
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}

        {step === "confirmation" && confirmationData && (
          <div style={styles.confirmationSection}>
            <div style={styles.checkmark}>✓</div>
            <h2 style={styles.confirmationTitle}>Booking Confirmed!</h2>
            <p style={styles.confirmationText}>
              You're scheduled for <strong>{confirmationData.bookingType?.name}</strong>
            </p>
            <div style={styles.confirmationDetails}>
              <div>
                <strong>When:</strong>
                <br />
                {new Date(confirmationData.startTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at {formatTime(confirmationData.startTime)}
              </div>
              {confirmationData.host?.name && (
                <div style={{ marginTop: 12 }}>
                  <strong>With:</strong>
                  <br />
                  {confirmationData.host.name}
                </div>
              )}
            </div>
            <p style={styles.confirmationNote}>
              A confirmation email has been sent to <strong>{guestEmail}</strong>
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          Powered by <strong>{bookingData?.agency?.name || "Wick"}</strong>
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
  errorBox: {
    background: "white",
    borderRadius: 16,
    padding: 40,
    textAlign: "center",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  card: {
    background: "white",
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
    maxWidth: 480,
    width: "100%",
    overflow: "hidden",
  },
  header: {
    padding: "32px 28px 24px",
    textAlign: "center",
    borderBottom: "1px solid #eee",
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    fontSize: 14,
    margin: 0,
    marginBottom: 12,
  },
  duration: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#888",
    background: "#f5f5f5",
    padding: "6px 12px",
    borderRadius: 20,
  },
  calendarSection: {
    padding: "20px 28px",
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
    padding: "0 28px 24px",
  },
  slotsTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: "#333",
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
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
  formSection: {
    padding: "20px 28px 28px",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 16,
    padding: 0,
  },
  selectedTime: {
    background: "#f8f9fa",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
  },
  input: {
    padding: "12px 14px",
    border: "1px solid #ddd",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.15s ease",
  },
  submitButton: {
    padding: "14px 24px",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
  confirmationSection: {
    padding: "48px 28px",
    textAlign: "center",
  },
  checkmark: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#22c55e",
    color: "white",
    fontSize: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
    marginBottom: 8,
  },
  confirmationText: {
    color: "#666",
    marginBottom: 20,
  },
  confirmationDetails: {
    background: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    textAlign: "left",
    fontSize: 14,
    lineHeight: 1.6,
  },
  confirmationNote: {
    marginTop: 20,
    fontSize: 13,
    color: "#888",
  },
  footer: {
    padding: "16px 28px",
    borderTop: "1px solid #eee",
    textAlign: "center",
    fontSize: 12,
    color: "#999",
  },
};
