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

// Comprehensive timezone list grouped by region with UTC offsets
const TIMEZONE_GROUPS = [
  {
    region: "Americas",
    timezones: [
      { value: "Pacific/Honolulu", label: "Hawaii (UTC-10)" },
      { value: "America/Anchorage", label: "Alaska (UTC-9)" },
      { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
      { value: "America/Phoenix", label: "Arizona (UTC-7)" },
      { value: "America/Denver", label: "Mountain Time (UTC-7)" },
      { value: "America/Chicago", label: "Central Time (UTC-6)" },
      { value: "America/Mexico_City", label: "Mexico City (UTC-6)" },
      { value: "America/New_York", label: "Eastern Time (UTC-5)" },
      { value: "America/Toronto", label: "Toronto (UTC-5)" },
      { value: "America/Bogota", label: "Bogotá (UTC-5)" },
      { value: "America/Lima", label: "Lima (UTC-5)" },
      { value: "America/Halifax", label: "Atlantic Time (UTC-4)" },
      { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)" },
      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
      { value: "America/Santiago", label: "Santiago (UTC-3)" },
    ],
  },
  {
    region: "Europe",
    timezones: [
      { value: "Atlantic/Reykjavik", label: "Reykjavik (UTC+0)" },
      { value: "Europe/London", label: "London (UTC+0)" },
      { value: "Europe/Dublin", label: "Dublin (UTC+0)" },
      { value: "Europe/Lisbon", label: "Lisbon (UTC+0)" },
      { value: "Europe/Paris", label: "Paris (UTC+1)" },
      { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
      { value: "Europe/Amsterdam", label: "Amsterdam (UTC+1)" },
      { value: "Europe/Brussels", label: "Brussels (UTC+1)" },
      { value: "Europe/Madrid", label: "Madrid (UTC+1)" },
      { value: "Europe/Rome", label: "Rome (UTC+1)" },
      { value: "Europe/Zurich", label: "Zurich (UTC+1)" },
      { value: "Europe/Vienna", label: "Vienna (UTC+1)" },
      { value: "Europe/Warsaw", label: "Warsaw (UTC+1)" },
      { value: "Europe/Stockholm", label: "Stockholm (UTC+1)" },
      { value: "Europe/Athens", label: "Athens (UTC+2)" },
      { value: "Europe/Helsinki", label: "Helsinki (UTC+2)" },
      { value: "Europe/Istanbul", label: "Istanbul (UTC+3)" },
      { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
    ],
  },
  {
    region: "Middle East",
    timezones: [
      { value: "Asia/Beirut", label: "Beirut (UTC+2)" },
      { value: "Asia/Jerusalem", label: "Jerusalem (UTC+2)" },
      { value: "Asia/Amman", label: "Amman (UTC+2)" },
      { value: "Asia/Baghdad", label: "Baghdad (UTC+3)" },
      { value: "Asia/Kuwait", label: "Kuwait (UTC+3)" },
      { value: "Asia/Riyadh", label: "Riyadh (UTC+3)" },
      { value: "Asia/Qatar", label: "Qatar (UTC+3)" },
      { value: "Asia/Tehran", label: "Tehran (UTC+3:30)" },
      { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
      { value: "Asia/Muscat", label: "Muscat (UTC+4)" },
    ],
  },
  {
    region: "Africa",
    timezones: [
      { value: "Africa/Casablanca", label: "Casablanca (UTC+0)" },
      { value: "Africa/Lagos", label: "Lagos (UTC+1)" },
      { value: "Africa/Cairo", label: "Cairo (UTC+2)" },
      { value: "Africa/Johannesburg", label: "Johannesburg (UTC+2)" },
      { value: "Africa/Nairobi", label: "Nairobi (UTC+3)" },
    ],
  },
  {
    region: "Asia",
    timezones: [
      { value: "Asia/Karachi", label: "Karachi (UTC+5)" },
      { value: "Asia/Kolkata", label: "Mumbai / Delhi (UTC+5:30)" },
      { value: "Asia/Dhaka", label: "Dhaka (UTC+6)" },
      { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
      { value: "Asia/Jakarta", label: "Jakarta (UTC+7)" },
      { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
      { value: "Asia/Hong_Kong", label: "Hong Kong (UTC+8)" },
      { value: "Asia/Shanghai", label: "Shanghai (UTC+8)" },
      { value: "Asia/Seoul", label: "Seoul (UTC+9)" },
      { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
    ],
  },
  {
    region: "Australia & Pacific",
    timezones: [
      { value: "Australia/Perth", label: "Perth (UTC+8)" },
      { value: "Australia/Adelaide", label: "Adelaide (UTC+9:30)" },
      { value: "Australia/Sydney", label: "Sydney (UTC+10)" },
      { value: "Australia/Melbourne", label: "Melbourne (UTC+10)" },
      { value: "Pacific/Auckland", label: "Auckland (UTC+12)" },
      { value: "Pacific/Fiji", label: "Fiji (UTC+12)" },
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
