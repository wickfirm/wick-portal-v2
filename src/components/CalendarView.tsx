"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";

// ── Types ──────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  type: "task" | "timeEntry" | "leave" | "project" | "holiday" | "booking";
  title: string;
  date: string;
  endDate?: string;
  color: string;
  link?: string;
  metadata: Record<string, any>;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CalendarViewProps {
  currentUserId: string;
  currentUserRole: string;
}

type ViewMode = "month" | "week" | "day";

// ── Constants ──────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  task: "Tasks",
  timeEntry: "Time Entries",
  leave: "Leave / PTO",
  project: "Projects",
  holiday: "Public Holidays",
  booking: "Bookings",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  task: "#76527c",
  timeEntry: "#4285f4",
  leave: "#ea4335",
  project: "#34a853",
  holiday: "#f9ab00",
  booking: "#f6dab9",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── Helpers ────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const gridStart = startOfWeek(first);
  const weeks: Date[][] = [];
  let current = new Date(gridStart);

  while (current <= last || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 6) break;
  }
  return weeks;
}

function eventFallsOnDate(event: CalendarEvent, dateStr: string): boolean {
  if (event.endDate) {
    return dateStr >= event.date && dateStr <= event.endDate;
  }
  return event.date === dateStr;
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Component ──────────────────────────────────────────

export default function CalendarView({ currentUserId, currentUserRole }: CalendarViewProps) {
  const router = useRouter();
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(currentUserRole);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(["task", "timeEntry", "leave", "project", "holiday", "booking"])
  );

  // Date range for API
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === "month") {
      const gridStart = startOfWeek(new Date(year, month, 1));
      const gridEnd = addDays(gridStart, 41); // 6 weeks
      return { start: toDateStr(gridStart), end: toDateStr(gridEnd) };
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = addDays(weekStart, 6);
      return { start: toDateStr(weekStart), end: toDateStr(weekEnd) };
    } else {
      return { start: toDateStr(currentDate), end: toDateStr(currentDate) };
    }
  }, [currentDate, viewMode]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });
      if (selectedUserId) params.set("userId", selectedUserId);

      const res = await fetch(`/api/calendar?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(data.events || []);
      if (data.teamMembers?.length > 0) {
        setTeamMembers(data.teamMembers);
      }
    } catch (error) {
      console.error("Calendar fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedUserId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation
  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
    setExpandedDay(null);
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setExpandedDay(null);
  };

  // Filter events by active types
  const filteredEvents = useMemo(
    () => events.filter((e) => activeTypes.has(e.type)),
    [events, activeTypes]
  );

  // Toggle event type
  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Events for a specific day
  const eventsForDay = useCallback(
    (dateStr: string) => filteredEvents.filter((e) => eventFallsOnDate(e, dateStr)),
    [filteredEvents]
  );

  // Title label
  const titleLabel = useMemo(() => {
    if (viewMode === "month") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === "week") {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      const sm = MONTHS[ws.getMonth()].substring(0, 3);
      const em = MONTHS[we.getMonth()].substring(0, 3);
      return ws.getMonth() === we.getMonth()
        ? `${sm} ${ws.getDate()} – ${we.getDate()}, ${ws.getFullYear()}`
        : `${sm} ${ws.getDate()} – ${em} ${we.getDate()}, ${we.getFullYear()}`;
    } else {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
  }, [currentDate, viewMode]);

  const today = toDateStr(new Date());

  // ── Event Pill ──

  const EventPill = ({ event, compact }: { event: CalendarEvent; compact?: boolean }) => {
    const isHovered = hoveredEvent === event.id;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (event.link) router.push(event.link);
        }}
        onMouseEnter={() => setHoveredEvent(event.id)}
        onMouseLeave={() => setHoveredEvent(null)}
        title={event.title}
        style={{
          fontSize: compact ? 10 : 11,
          padding: compact ? "1px 4px" : "2px 6px",
          borderRadius: 4,
          background: `${event.color}18`,
          borderLeft: `3px solid ${event.color}`,
          color: theme.colors.textPrimary,
          cursor: event.link ? "pointer" : "default",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontWeight: 500,
          transition: "all 0.15s",
          transform: isHovered ? "translateX(2px)" : "none",
          boxShadow: isHovered ? `0 1px 4px ${event.color}30` : "none",
        }}
      >
        {event.title}
      </div>
    );
  };

  // ── Expanded Day Modal ──

  const ExpandedDayModal = ({ dateStr }: { dateStr: string }) => {
    const dayEvents = eventsForDay(dateStr);
    const d = new Date(dateStr + "T12:00:00");
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 24,
            width: 420,
            maxHeight: "70vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary }}>
                {DAYS[d.getDay()]}, {MONTHS[d.getMonth()]} {d.getDate()}
              </div>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button
              onClick={() => setExpandedDay(null)}
              style={{
                border: "none",
                background: theme.colors.bgTertiary,
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.colors.textSecondary,
              }}
            >
              ×
            </button>
          </div>

          {/* Events */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dayEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: theme.colors.textMuted, fontSize: 13 }}>
                No events for this day
              </div>
            ) : (
              dayEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => event.link && router.push(event.link)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: `${event.color}10`,
                    borderLeft: `4px solid ${event.color}`,
                    cursor: event.link ? "pointer" : "default",
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: theme.colors.textPrimary }}>
                      {event.title}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: `${event.color}20`,
                        color: event.color,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {event.type === "timeEntry" ? "time" : event.type}
                    </span>
                  </div>
                  {/* Metadata */}
                  <div style={{ marginTop: 4, fontSize: 11, color: theme.colors.textSecondary }}>
                    {event.type === "task" && (
                      <>
                        {event.metadata.client && <span>{event.metadata.client} · </span>}
                        <span style={{ fontWeight: 500 }}>{event.metadata.status}</span>
                        {event.metadata.priority && <span> · {event.metadata.priority}</span>}
                        {event.metadata.assignee && <span> · {event.metadata.assignee}</span>}
                      </>
                    )}
                    {event.type === "timeEntry" && (
                      <>
                        <span>{event.metadata.hours}h</span>
                        {event.metadata.project && <span> · {event.metadata.project}</span>}
                        {event.metadata.description && (
                          <div style={{ marginTop: 2, fontStyle: "italic" }}>
                            {event.metadata.description}
                          </div>
                        )}
                      </>
                    )}
                    {event.type === "leave" && (
                      <>
                        <span>{event.metadata.leaveType} · {event.metadata.totalDays} day{event.metadata.totalDays !== 1 ? "s" : ""}</span>
                        {event.metadata.reason && (
                          <div style={{ marginTop: 2, fontStyle: "italic" }}>{event.metadata.reason}</div>
                        )}
                      </>
                    )}
                    {event.type === "project" && (
                      <>
                        {event.metadata.client && <span>{event.metadata.client} · </span>}
                        <span>{event.metadata.status}</span>
                      </>
                    )}
                    {event.type === "holiday" && (
                      <span>{event.metadata.country}{event.metadata.numberOfDays > 1 ? ` · ${event.metadata.numberOfDays} days` : ""}</span>
                    )}
                    {event.type === "booking" && (
                      <>
                        <span>{event.metadata.time}</span>
                        {event.metadata.company && <span> · {event.metadata.company}</span>}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Month View ──

  const MonthView = () => {
    const grid = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth());
    return (
      <div>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 1 }}>
          {DAYS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 600,
                color: theme.colors.textMuted,
                padding: "8px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
          {grid.flat().map((date, i) => {
            const dateStr = toDateStr(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = dateStr === today;
            const dayEvents = eventsForDay(dateStr);
            const hasHoliday = dayEvents.some((e) => e.type === "holiday");
            const maxShow = 3;

            return (
              <div
                key={i}
                onClick={() => {
                  if (dayEvents.length > 0) setExpandedDay(dateStr);
                  else {
                    // Switch to day view
                    setCurrentDate(new Date(dateStr + "T12:00:00"));
                    setViewMode("day");
                  }
                }}
                style={{
                  minHeight: 100,
                  padding: 6,
                  background: hasHoliday
                    ? "#fffbeb"
                    : isToday
                      ? `${theme.colors.primary}08`
                      : "white",
                  border: `1px solid ${isToday ? theme.colors.primary : theme.colors.borderLight}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  opacity: isCurrentMonth ? 1 : 0.4,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (isCurrentMonth) {
                    e.currentTarget.style.background = hasHoliday
                      ? "#fef3c7"
                      : `${theme.colors.primary}0c`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = hasHoliday
                    ? "#fffbeb"
                    : isToday
                      ? `${theme.colors.primary}08`
                      : "white";
                }}
              >
                {/* Date number */}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? theme.colors.primary : theme.colors.textPrimary,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      ...(isToday
                        ? {
                            background: theme.colors.primary,
                            color: "white",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                          }
                        : {}),
                    }}
                  >
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: 9, color: theme.colors.textMuted, fontWeight: 400 }}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event pills */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {dayEvents.slice(0, maxShow).map((event) => (
                    <EventPill key={event.id} event={event} compact />
                  ))}
                  {dayEvents.length > maxShow && (
                    <div style={{ fontSize: 9, color: theme.colors.textMuted, fontWeight: 500, paddingLeft: 4 }}>
                      +{dayEvents.length - maxShow} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week View ──

  const WeekView = () => {
    const ws = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {days.map((date) => {
          const dateStr = toDateStr(date);
          const isToday = dateStr === today;
          const dayEvents = eventsForDay(dateStr);
          const hasHoliday = dayEvents.some((e) => e.type === "holiday");

          return (
            <div
              key={dateStr}
              style={{
                minHeight: 400,
                padding: 10,
                background: hasHoliday
                  ? "#fffbeb"
                  : isToday
                    ? `${theme.colors.primary}06`
                    : "white",
                border: `1px solid ${isToday ? theme.colors.primary : theme.colors.borderLight}`,
                borderRadius: 10,
              }}
            >
              {/* Day header */}
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 600, textTransform: "uppercase" }}>
                  {DAYS[date.getDay()]}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? theme.colors.primary : theme.colors.textPrimary,
                    ...(isToday
                      ? {
                          background: theme.colors.primary,
                          color: "white",
                          borderRadius: "50%",
                          width: 32,
                          height: 32,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                        }
                      : {}),
                  }}
                >
                  {date.getDate()}
                </div>
              </div>

              {/* Events */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => event.link && router.push(event.link)}
                    style={{
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: `${event.color}12`,
                      borderLeft: `3px solid ${event.color}`,
                      cursor: event.link ? "pointer" : "default",
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textPrimary }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: 9, color: theme.colors.textMuted, marginTop: 2 }}>
                      {event.type === "timeEntry" ? "Time" : event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      {event.type === "task" && event.metadata.client && ` · ${event.metadata.client}`}
                      {event.type === "timeEntry" && ` · ${event.metadata.hours}h`}
                      {event.type === "booking" && event.metadata.time && ` · ${event.metadata.time}`}
                    </div>
                  </div>
                ))}
                {dayEvents.length === 0 && (
                  <div style={{ textAlign: "center", color: theme.colors.textMuted, fontSize: 11, padding: "20px 0" }}>
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Day View ──

  const DayView = () => {
    const dateStr = toDateStr(currentDate);
    const dayEvents = eventsForDay(dateStr);
    const isToday = dateStr === today;

    // Group by type
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const e of dayEvents) {
      if (!grouped[e.type]) grouped[e.type] = [];
      grouped[e.type].push(e);
    }

    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Day header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: theme.colors.textMuted, fontWeight: 500 }}>
            {DAYS[currentDate.getDay()]}
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: isToday ? theme.colors.primary : theme.colors.textPrimary,
              fontFamily: "'DM Serif Display', serif",
            }}
          >
            {currentDate.getDate()}
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>

        {/* Events grouped by type */}
        {Object.keys(grouped).length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              color: theme.colors.textMuted,
              fontSize: 14,
              background: theme.colors.bgTertiary,
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            No events for this day
          </div>
        ) : (
          Object.entries(grouped).map(([type, typeEvents]) => (
            <div key={type} style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: EVENT_TYPE_COLORS[type],
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: EVENT_TYPE_COLORS[type],
                  }}
                />
                {EVENT_TYPE_LABELS[type]} ({typeEvents.length})
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {typeEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => event.link && router.push(event.link)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: `${event.color}0a`,
                      borderLeft: `4px solid ${event.color}`,
                      cursor: event.link ? "pointer" : "default",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(3px)";
                      e.currentTarget.style.boxShadow = `0 2px 8px ${event.color}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
                      {event.type === "task" && (
                        <>
                          {event.metadata.client && <span>{event.metadata.client} · </span>}
                          <span>{event.metadata.status}</span>
                          {event.metadata.priority && <span> · {event.metadata.priority}</span>}
                          {event.metadata.assignee && <span> · Assigned to {event.metadata.assignee}</span>}
                        </>
                      )}
                      {event.type === "timeEntry" && (
                        <>
                          {event.metadata.hours}h
                          {event.metadata.project && <span> · {event.metadata.project}</span>}
                          {event.metadata.description && <span> — {event.metadata.description}</span>}
                        </>
                      )}
                      {event.type === "leave" && (
                        <>
                          {event.metadata.leaveType} leave · {event.metadata.totalDays} day{event.metadata.totalDays !== 1 ? "s" : ""}
                          {event.metadata.reason && <span> — {event.metadata.reason}</span>}
                        </>
                      )}
                      {event.type === "project" && (
                        <>
                          {event.metadata.client && <span>{event.metadata.client} · </span>}
                          {event.metadata.status}
                        </>
                      )}
                      {event.type === "holiday" && (
                        <>
                          {event.metadata.country}
                          {event.metadata.numberOfDays > 1 && ` · ${event.metadata.numberOfDays} days`}
                        </>
                      )}
                      {event.type === "booking" && (
                        <>
                          {event.metadata.time}
                          {event.metadata.company && ` · ${event.metadata.company}`}
                          <span> · {event.metadata.status}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          padding: "12px 16px",
          background: "white",
          borderRadius: 12,
          border: `1px solid ${theme.colors.borderLight}`,
        }}
      >
        {/* Left: Nav + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: `1px solid ${theme.colors.borderLight}`,
              background: "white",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.colors.textSecondary,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bgTertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            onClick={goToday}
            style={{
              border: `1px solid ${theme.colors.borderLight}`,
              background: "white",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              color: theme.colors.textSecondary,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bgTertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
          >
            Today
          </button>

          <button
            onClick={() => navigate(1)}
            style={{
              border: `1px solid ${theme.colors.borderLight}`,
              background: "white",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.colors.textSecondary,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bgTertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary, marginLeft: 8, fontFamily: "'DM Serif Display', serif" }}>
            {titleLabel}
          </div>
        </div>

        {/* Right: View toggle + Team filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Team member filter (admin only) */}
          {isAdmin && teamMembers.length > 0 && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                background: "white",
                color: theme.colors.textPrimary,
                cursor: "pointer",
                outline: "none",
                minWidth: 160,
              }}
            >
              <option value="">All team members</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          )}

          {/* View mode toggle */}
          <div
            style={{
              display: "flex",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {(["month", "week", "day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  border: "none",
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: viewMode === mode ? 600 : 400,
                  cursor: "pointer",
                  background: viewMode === mode ? theme.colors.primary : "white",
                  color: viewMode === mode ? "white" : theme.colors.textSecondary,
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => {
          const active = activeTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 20,
                border: `1px solid ${active ? EVENT_TYPE_COLORS[type] : theme.colors.borderLight}`,
                background: active ? `${EVENT_TYPE_COLORS[type]}12` : "white",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
                color: active ? EVENT_TYPE_COLORS[type] : theme.colors.textMuted,
                transition: "all 0.15s",
                opacity: active ? 1 : 0.6,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: active ? EVENT_TYPE_COLORS[type] : theme.colors.textMuted,
                }}
              />
              {label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 60,
            color: theme.colors.textMuted,
            fontSize: 14,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              border: `2px solid ${theme.colors.borderLight}`,
              borderTop: `2px solid ${theme.colors.primary}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginRight: 10,
            }}
          />
          Loading calendar...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {viewMode === "month" && <MonthView />}
          {viewMode === "week" && <WeekView />}
          {viewMode === "day" && <DayView />}
        </>
      )}

      {/* Expanded day modal */}
      {expandedDay && (
        <div onClick={() => setExpandedDay(null)}>
          <ExpandedDayModal dateStr={expandedDay} />
        </div>
      )}
    </div>
  );
}
