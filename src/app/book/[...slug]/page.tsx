"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

// Comprehensive timezone list grouped by region (similar to Calendly)
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

// Minimalist public booking page - no auth required
// Supports both /book/[typeSlug] and /book/[userSlug]/[typeSlug] patterns
export default function PublicBookingPage() {
  const params = useParams();
  const slugParts = params.slug as string[];

  // Determine if this is a user-prefixed URL or a direct type URL
  // /book/wick-discovery -> slugParts = ["wick-discovery"]
  // /book/john/discovery-call -> slugParts = ["john", "discovery-call"]
  const isUserPrefixed = slugParts.length === 2;
  const apiPath = isUserPrefixed
    ? `/api/bookings/public/${slugParts[0]}/${slugParts[1]}`
    : `/api/bookings/public/${slugParts[0]}`;

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

  // Timezone state
  const [guestTimezone, setGuestTimezone] = useState<string>("");
  const [agencyTimezone, setAgencyTimezone] = useState<string>("Asia/Dubai");
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const timezoneRef = useRef<HTMLDivElement>(null);

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
    // Detect guest timezone
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setGuestTimezone(detectedTz);
    fetchBookingInfo();
  }, [apiPath]);

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

  useEffect(() => {
    if (bookingData) {
      fetchAvailableDays();
      if (bookingData.timezone) {
        setAgencyTimezone(bookingData.timezone);
      }
    }
  }, [currentMonth, bookingData]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchBookingInfo = async () => {
    try {
      const res = await fetch(apiPath);
      if (!res.ok) {
        setError("Booking type not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setBookingData(data);
      if (data.timezone) {
        setAgencyTimezone(data.timezone);
      }
      setLoading(false);
    } catch (err) {
      setError("Failed to load booking info");
      setLoading(false);
    }
  };

  const fetchAvailableDays = async () => {
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`${apiPath}?month=${monthStr}`);
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
      const res = await fetch(`${apiPath}?date=${selectedDate}`);
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
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: selectedSlot,
          guestName,
          guestEmail,
          guestPhone,
          guestCompany,
          notes,
          guestTimezone,
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

  // Format time in guest's timezone
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: guestTimezone || undefined,
    });
  };

  // Format time in agency timezone for display
  const formatTimeInAgencyTz = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: agencyTimezone,
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00"); // Add time to prevent timezone shift
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get friendly timezone name
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
  const showTimezoneNote = guestTimezone && guestTimezone !== agencyTimezone;

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
          {bookingData?.hostUser && (
            <p style={{ ...styles.subtitle, marginBottom: 8 }}>
              with <strong>{bookingData.hostUser.name}</strong>
            </p>
          )}
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
                  <span>{TIMEZONES.find(tz => tz.value === guestTimezone)?.label || getTimezoneLabel(guestTimezone || agencyTimezone)}</span>
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
                              onMouseEnter={(e) => {
                                if (guestTimezone !== tz.value) {
                                  (e.target as HTMLElement).style.background = "#f5f5f5";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (guestTimezone !== tz.value) {
                                  (e.target as HTMLElement).style.background = "transparent";
                                }
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
              {showTimezoneNote && (
                <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>
                  (Host: {getTimezoneLabel(agencyTimezone)})
                </span>
              )}
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
              {showTimezoneNote && (
                <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                  ({formatTimeInAgencyTz(selectedSlot!)} {getTimezoneLabel(agencyTimezone)})
                </span>
              )}
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
                  timeZone: guestTimezone || undefined,
                })}{" "}
                at {formatTime(confirmationData.startTime)}
                <span style={{ fontSize: 12, color: "#666", display: "block", marginTop: 4 }}>
                  {getTimezoneLabel(guestTimezone || agencyTimezone)}
                </span>
              </div>
              {confirmationData.host?.name && (
                <div style={{ marginTop: 12 }}>
                  <strong>With:</strong>
                  <br />
                  {confirmationData.host.name}
                </div>
              )}
            </div>

            {/* Meeting Link */}
            {confirmationData.meetingLink && (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <a
                  href={confirmationData.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: brandColor,
                    color: "white",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  🔗 Join Meeting
                </a>
              </div>
            )}

            <p style={styles.confirmationNote}>
              A confirmation email has been sent to <strong>{guestEmail}</strong>
            </p>

            {/* Manage Booking Link */}
            {confirmationData.cancelUrl && (
              <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
                Need to make changes?{" "}
                <a
                  href={confirmationData.cancelUrl}
                  style={{ color: brandColor }}
                >
                  Manage your booking
                </a>
              </p>
            )}
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
  timezoneBar: {
    padding: "10px 28px",
    background: "#f8f9fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
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
  timezoneOptionHover: {
    background: "#f5f5f5",
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
