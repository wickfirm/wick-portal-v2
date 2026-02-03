"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type TimeSlot = { start: string; end: string };
type WeeklySchedule = { [day: string]: TimeSlot[] };

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: { [key: string]: string } = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

// Comprehensive timezone list grouped by region
const TIMEZONE_GROUPS = [
  {
    region: "Americas",
    timezones: [
      { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
      { value: "America/Anchorage", label: "Alaska (AKST)" },
      { value: "America/Los_Angeles", label: "Pacific Time (PST)" },
      { value: "America/Phoenix", label: "Arizona (MST)" },
      { value: "America/Denver", label: "Mountain Time (MST)" },
      { value: "America/Chicago", label: "Central Time (CST)" },
      { value: "America/Mexico_City", label: "Mexico City (CST)" },
      { value: "America/New_York", label: "Eastern Time (EST)" },
      { value: "America/Toronto", label: "Toronto (EST)" },
      { value: "America/Bogota", label: "Bogotá (COT)" },
      { value: "America/Lima", label: "Lima (PET)" },
      { value: "America/Halifax", label: "Atlantic Time (AST)" },
      { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART)" },
      { value: "America/Santiago", label: "Santiago (CLT)" },
    ],
  },
  {
    region: "Europe",
    timezones: [
      { value: "Atlantic/Reykjavik", label: "Reykjavik (GMT)" },
      { value: "Europe/London", label: "London (GMT)" },
      { value: "Europe/Dublin", label: "Dublin (GMT)" },
      { value: "Europe/Lisbon", label: "Lisbon (WET)" },
      { value: "Europe/Paris", label: "Paris (CET)" },
      { value: "Europe/Berlin", label: "Berlin (CET)" },
      { value: "Europe/Amsterdam", label: "Amsterdam (CET)" },
      { value: "Europe/Brussels", label: "Brussels (CET)" },
      { value: "Europe/Madrid", label: "Madrid (CET)" },
      { value: "Europe/Rome", label: "Rome (CET)" },
      { value: "Europe/Zurich", label: "Zurich (CET)" },
      { value: "Europe/Vienna", label: "Vienna (CET)" },
      { value: "Europe/Warsaw", label: "Warsaw (CET)" },
      { value: "Europe/Stockholm", label: "Stockholm (CET)" },
      { value: "Europe/Athens", label: "Athens (EET)" },
      { value: "Europe/Helsinki", label: "Helsinki (EET)" },
      { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
      { value: "Europe/Moscow", label: "Moscow (MSK)" },
    ],
  },
  {
    region: "Middle East",
    timezones: [
      { value: "Asia/Beirut", label: "Beirut (EET)" },
      { value: "Asia/Jerusalem", label: "Jerusalem (IST)" },
      { value: "Asia/Amman", label: "Amman (EET)" },
      { value: "Asia/Baghdad", label: "Baghdad (AST)" },
      { value: "Asia/Kuwait", label: "Kuwait (AST)" },
      { value: "Asia/Riyadh", label: "Riyadh (AST)" },
      { value: "Asia/Qatar", label: "Qatar (AST)" },
      { value: "Asia/Tehran", label: "Tehran (IRST)" },
      { value: "Asia/Dubai", label: "Dubai (GST)" },
      { value: "Asia/Muscat", label: "Muscat (GST)" },
    ],
  },
  {
    region: "Africa",
    timezones: [
      { value: "Africa/Casablanca", label: "Casablanca (WET)" },
      { value: "Africa/Lagos", label: "Lagos (WAT)" },
      { value: "Africa/Cairo", label: "Cairo (EET)" },
      { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
      { value: "Africa/Nairobi", label: "Nairobi (EAT)" },
    ],
  },
  {
    region: "Asia",
    timezones: [
      { value: "Asia/Karachi", label: "Karachi (PKT)" },
      { value: "Asia/Kolkata", label: "Mumbai / Delhi (IST)" },
      { value: "Asia/Dhaka", label: "Dhaka (BST)" },
      { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
      { value: "Asia/Jakarta", label: "Jakarta (WIB)" },
      { value: "Asia/Singapore", label: "Singapore (SGT)" },
      { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
      { value: "Asia/Shanghai", label: "Shanghai (CST)" },
      { value: "Asia/Seoul", label: "Seoul (KST)" },
      { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    ],
  },
  {
    region: "Australia & Pacific",
    timezones: [
      { value: "Australia/Perth", label: "Perth (AWST)" },
      { value: "Australia/Adelaide", label: "Adelaide (ACST)" },
      { value: "Australia/Sydney", label: "Sydney (AEST)" },
      { value: "Australia/Melbourne", label: "Melbourne (AEST)" },
      { value: "Pacific/Auckland", label: "Auckland (NZST)" },
      { value: "Pacific/Fiji", label: "Fiji (FJT)" },
    ],
  },
];

export default function BookingsSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Dubai");
  const [schedule, setSchedule] = useState<WeeklySchedule>({
    monday: [{ start: "09:00", end: "18:00" }],
    tuesday: [{ start: "09:00", end: "18:00" }],
    wednesday: [{ start: "09:00", end: "18:00" }],
    thursday: [{ start: "09:00", end: "18:00" }],
    friday: [{ start: "09:00", end: "18:00" }],
    saturday: [],
    sunday: [],
  });

  const [bookingTypes, setBookingTypes] = useState<any[]>([]);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDuration, setNewTypeDuration] = useState(30);
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [editingType, setEditingType] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [availRes, typesRes] = await Promise.all([
        fetch("/api/bookings/availability"),
        fetch("/api/bookings/types"),
      ]);

      if (availRes.ok) {
        const availData = await availRes.json();
        setTimezone(availData.timezone || "Asia/Dubai");
        if (availData.weeklySchedule) {
          setSchedule(availData.weeklySchedule);
        }
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setBookingTypes(typesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/bookings/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone, weeklySchedule: schedule }),
      });

      if (res.ok) {
        alert("Availability saved!");
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
    setSaving(false);
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].length > 0 ? [] : [{ start: "09:00", end: "18:00" }],
    }));
  };

  const updateSlot = (day: string, index: number, field: "start" | "end", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const addSlot = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "13:00", end: "17:00" }],
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const createBookingType = async () => {
    if (!newTypeName.trim()) return;

    try {
      const res = await fetch("/api/bookings/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTypeName,
          duration: newTypeDuration,
          description: newTypeDescription,
        }),
      });

      if (res.ok) {
        setNewTypeName("");
        setNewTypeDuration(30);
        setNewTypeDescription("");
        setShowAddType(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating booking type:", error);
    }
  };

  const deleteBookingType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking type?")) return;

    try {
      const res = await fetch(`/api/bookings/types/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const toggleBookingTypeActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/bookings/types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling:", error);
    }
  };

  const copyBookingLink = (slug: string) => {
    const link = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(link);
    alert("Booking link copied to clipboard!");
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    border: "1px solid " + theme.colors.borderLight,
    borderRadius: 10,
    fontSize: 14,
    background: theme.colors.bgPrimary,
    color: theme.colors.textPrimary,
    outline: "none",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
            Loading...
          </div>
        </main>
      </div>
    );
  }

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

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        {/* Back Link */}
        <Link
          href="/settings"
          style={{
            color: theme.colors.textSecondary,
            textDecoration: "none",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 24,
          }}
        >
          ← Back to Settings
        </Link>

        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 32,
              fontWeight: 400,
              color: theme.colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Booking Settings
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Manage your booking types and availability for client scheduling
          </p>
        </div>

        {/* Booking Types Section */}
        <div
          style={{
            background: theme.colors.bgSecondary,
            borderRadius: 16,
            border: "1px solid " + theme.colors.borderLight,
            padding: 28,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                Booking Types
              </h2>
              <p style={{ fontSize: 13, color: theme.colors.textMuted }}>
                Create different meeting types for clients to book
              </p>
            </div>
            <button
              onClick={() => setShowAddType(true)}
              style={{
                padding: "10px 20px",
                background: theme.gradients.primary,
                color: "white",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
                boxShadow: theme.shadows.button,
              }}
            >
              + Add Booking Type
            </button>
          </div>

          {/* Add Type Form */}
          {showAddType && (
            <div
              style={{
                background: theme.colors.bgTertiary,
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Meeting Name
                  </label>
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g., Discovery Call"
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Duration
                  </label>
                  <select
                    value={newTypeDuration}
                    onChange={(e) => setNewTypeDuration(Number(e.target.value))}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Description (optional)
                </label>
                <textarea
                  value={newTypeDescription}
                  onChange={(e) => setNewTypeDescription(e.target.value)}
                  placeholder="Brief description of this meeting type..."
                  rows={2}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={createBookingType}
                  style={{
                    padding: "8px 16px",
                    background: theme.colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddType(false)}
                  style={{
                    padding: "8px 16px",
                    background: theme.colors.bgPrimary,
                    color: theme.colors.textSecondary,
                    border: "1px solid " + theme.colors.borderLight,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Booking Types List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bookingTypes.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: theme.colors.textMuted,
                  background: theme.colors.bgTertiary,
                  borderRadius: 12,
                }}
              >
                No booking types yet. Create one to get started!
              </div>
            ) : (
              bookingTypes.map((type) => (
                <div
                  key={type.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    background: theme.colors.bgPrimary,
                    borderRadius: 12,
                    border: "1px solid " + theme.colors.borderLight,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 8,
                        height: 40,
                        borderRadius: 4,
                        background: type.color || theme.colors.primary,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: theme.colors.textPrimary,
                          marginBottom: 2,
                        }}
                      >
                        {type.name}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                        {type.duration} min • {type._count?.appointments || 0} upcoming
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => copyBookingLink(type.slug)}
                      title="Copy booking link"
                      style={{
                        padding: "6px 12px",
                        background: theme.colors.bgTertiary,
                        color: theme.colors.textSecondary,
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      🔗 Copy Link
                    </button>
                    <button
                      onClick={() => toggleBookingTypeActive(type.id, type.isActive)}
                      style={{
                        padding: "6px 12px",
                        background: type.isActive ? theme.colors.successBg : theme.colors.bgTertiary,
                        color: type.isActive ? theme.colors.success : theme.colors.textMuted,
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {type.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => deleteBookingType(type.id)}
                      style={{
                        padding: "6px 10px",
                        background: "transparent",
                        color: theme.colors.textMuted,
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agency Availability Section */}
        <div
          style={{
            background: theme.colors.bgSecondary,
            borderRadius: 16,
            border: "1px solid " + theme.colors.borderLight,
            padding: 28,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: 4,
              }}
            >
              Agency Availability
            </h2>
            <p style={{ fontSize: 13, color: theme.colors.textMuted }}>
              Set default working hours for your agency (team members can override)
            </p>
          </div>

          {/* Timezone */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ ...inputStyle, width: 300 }}
            >
              {TIMEZONE_GROUPS.map((group) => (
                <optgroup key={group.region} label={group.region}>
                  {group.timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Weekly Schedule */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              Weekly Schedule
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {DAYS.map((day) => (
                <div
                  key={day}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    padding: 14,
                    background: theme.colors.bgTertiary,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ width: 100, paddingTop: 8 }}>
                    <button
                      onClick={() => toggleDay(day)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 500,
                        color: schedule[day].length > 0 ? theme.colors.textPrimary : theme.colors.textMuted,
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: "2px solid " + (schedule[day].length > 0 ? theme.colors.primary : theme.colors.borderMedium),
                          background: schedule[day].length > 0 ? theme.colors.primary : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 11,
                        }}
                      >
                        {schedule[day].length > 0 && "✓"}
                      </span>
                      {DAY_LABELS[day]}
                    </button>
                  </div>
                  <div style={{ flex: 1 }}>
                    {schedule[day].length === 0 ? (
                      <span style={{ color: theme.colors.textMuted, fontSize: 13, paddingTop: 8, display: "block" }}>
                        Unavailable
                      </span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {schedule[day].map((slot, index) => (
                          <div key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateSlot(day, index, "start", e.target.value)}
                              style={{ ...inputStyle, width: 120 }}
                            />
                            <span style={{ color: theme.colors.textMuted }}>to</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateSlot(day, index, "end", e.target.value)}
                              style={{ ...inputStyle, width: 120 }}
                            />
                            {schedule[day].length > 1 && (
                              <button
                                onClick={() => removeSlot(day, index)}
                                style={{
                                  padding: "4px 8px",
                                  background: theme.colors.errorBg,
                                  color: theme.colors.error,
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontSize: 12,
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addSlot(day)}
                          style={{
                            padding: "4px 10px",
                            background: "transparent",
                            color: theme.colors.primary,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                            alignSelf: "flex-start",
                          }}
                        >
                          + Add time slot
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveAvailability}
            disabled={saving}
            style={{
              padding: "12px 28px",
              background: saving ? theme.colors.bgTertiary : theme.gradients.primary,
              color: saving ? theme.colors.textMuted : "white",
              border: "none",
              borderRadius: 10,
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: 14,
              boxShadow: saving ? "none" : theme.shadows.button,
            }}
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </main>
    </div>
  );
}
