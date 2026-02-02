"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { theme } from "@/lib/theme";

// ── Types ──────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  type: "task" | "timeEntry" | "project";
  title: string;
  date: string;
  endDate?: string;
  color: string;
  metadata: Record<string, any>;
}

type ViewMode = "month" | "week";

// ── Constants ──────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  task: "Tasks",
  timeEntry: "Time Entries",
  project: "Projects",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  task: "#76527c",
  timeEntry: "#4285f4",
  project: "#34a853",
};

const STATUS_PILL_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef3c7", color: "#b45309" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1d4ed8" },
  COMPLETED: { bg: "#d1fae5", color: "#047857" },
  DONE: { bg: "#d1fae5", color: "#047857" },
  BLOCKED: { bg: "#fce8e6", color: "#b91c1c" },
  ON_HOLD: { bg: "#f3e8ff", color: "#7c3aed" },
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

// ── Component ──────────────────────────────────────────

export default function ClientCalendar({ clientId }: { clientId: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(["task", "timeEntry", "project"])
  );

  // Date range
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === "month") {
      const gridStart = startOfWeek(new Date(year, month, 1));
      const gridEnd = addDays(gridStart, 41);
      return { start: toDateStr(gridStart), end: toDateStr(gridEnd) };
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = addDays(weekStart, 6);
      return { start: toDateStr(weekStart), end: toDateStr(weekEnd) };
    }
  }, [currentDate, viewMode]);

  // Fetch
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });
      const res = await fetch(`/api/clients/${clientId}/calendar?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Client calendar fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, clientId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation
  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + 7 * dir);
    setCurrentDate(d);
    setExpandedDay(null);
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setExpandedDay(null);
  };

  // Filter
  const filteredEvents = useMemo(
    () => events.filter((e) => activeTypes.has(e.type)),
    [events, activeTypes]
  );

  const toggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const eventsForDay = useCallback(
    (dateStr: string) => filteredEvents.filter((e) => eventFallsOnDate(e, dateStr)),
    [filteredEvents]
  );

  const titleLabel = useMemo(() => {
    if (viewMode === "month") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      const sm = MONTHS[ws.getMonth()].substring(0, 3);
      const em = MONTHS[we.getMonth()].substring(0, 3);
      return ws.getMonth() === we.getMonth()
        ? `${sm} ${ws.getDate()} – ${we.getDate()}, ${ws.getFullYear()}`
        : `${sm} ${ws.getDate()} – ${em} ${we.getDate()}, ${we.getFullYear()}`;
    }
  }, [currentDate, viewMode]);

  const today = toDateStr(new Date());

  // ── Summary stats ──

  const taskStats = useMemo(() => {
    const tasks = filteredEvents.filter((e) => e.type === "task");
    const overdue = tasks.filter((t) => t.date < today && t.metadata.status !== "COMPLETED" && t.metadata.status !== "DONE");
    const upcoming = tasks.filter((t) => {
      const daysAway = Math.ceil((new Date(t.date).getTime() - new Date(today).getTime()) / 86400000);
      return daysAway >= 0 && daysAway <= 7;
    });
    return { total: tasks.length, overdue: overdue.length, upcoming: upcoming.length };
  }, [filteredEvents, today]);

  // ── Event Pill ──

  const EventPill = ({ event, compact }: { event: CalendarEvent; compact?: boolean }) => {
    const statusColor = event.type === "task" && event.metadata.status
      ? (STATUS_PILL_COLORS[event.metadata.status] || null)
      : null;

    return (
      <div
        title={`${event.title}${event.metadata.assignee ? ` — ${event.metadata.assignee}` : ""}${event.metadata.status ? ` [${event.metadata.status}]` : ""}`}
        style={{
          fontSize: compact ? 10 : 11,
          padding: compact ? "1px 4px" : "2px 6px",
          borderRadius: 4,
          background: `${event.color}18`,
          borderLeft: `3px solid ${event.color}`,
          color: theme.colors.textPrimary,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontWeight: 500,
          transition: "all 0.15s",
          cursor: "default",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateX(2px)";
          e.currentTarget.style.boxShadow = `0 1px 4px ${event.color}30`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
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
            width: 440,
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
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: `${event.color}10`,
                    borderLeft: `4px solid ${event.color}`,
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
                  <div style={{ marginTop: 6, fontSize: 11, color: theme.colors.textSecondary }}>
                    {event.type === "task" && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {event.metadata.status && (
                            <span
                              style={{
                                padding: "1px 6px",
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                background: STATUS_PILL_COLORS[event.metadata.status]?.bg || theme.colors.bgTertiary,
                                color: STATUS_PILL_COLORS[event.metadata.status]?.color || theme.colors.textSecondary,
                              }}
                            >
                              {event.metadata.status}
                            </span>
                          )}
                          {event.metadata.priority && (
                            <span style={{ fontSize: 10 }}>
                              {event.metadata.priority === "HIGH" || event.metadata.priority === "URGENT" ? "🔴" : event.metadata.priority === "MEDIUM" ? "🟡" : "🟢"} {event.metadata.priority}
                            </span>
                          )}
                        </div>
                        {event.metadata.assignee && (
                          <div style={{ marginTop: 3 }}>Assigned to {event.metadata.assignee}</div>
                        )}
                        {event.metadata.project && (
                          <div style={{ marginTop: 2 }}>Project: {event.metadata.project}</div>
                        )}
                        {event.metadata.category && (
                          <div style={{ marginTop: 2 }}>Category: {event.metadata.category}</div>
                        )}
                      </>
                    )}
                    {event.type === "timeEntry" && (
                      <>
                        <span>{event.metadata.hours}h</span>
                        {event.metadata.project && <span> · {event.metadata.project}</span>}
                        {event.metadata.userName && <span> · {event.metadata.userName}</span>}
                        {event.metadata.description && (
                          <div style={{ marginTop: 3, fontStyle: "italic" }}>
                            {event.metadata.description}
                          </div>
                        )}
                      </>
                    )}
                    {event.type === "project" && (
                      <>
                        <span>{event.metadata.serviceType?.replace("_", " ")}</span>
                        {event.metadata.status && <span> · {event.metadata.status.replace("_", " ")}</span>}
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
          {grid.flat().map((date, i) => {
            const dateStr = toDateStr(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = dateStr === today;
            const dayEvents = eventsForDay(dateStr);
            const maxShow = 3;

            // Color tasks by status for urgency
            const hasOverdue = dayEvents.some(
              (e) => e.type === "task" && dateStr < today && e.metadata.status !== "COMPLETED" && e.metadata.status !== "DONE"
            );

            return (
              <div
                key={i}
                onClick={() => {
                  if (dayEvents.length > 0) setExpandedDay(dateStr);
                }}
                style={{
                  minHeight: 90,
                  padding: 5,
                  background: hasOverdue
                    ? "#fef2f2"
                    : isToday
                      ? `${theme.colors.primary}08`
                      : "white",
                  border: `1px solid ${isToday ? theme.colors.primary : hasOverdue ? "#fca5a5" : theme.colors.borderLight}`,
                  borderRadius: 8,
                  cursor: dayEvents.length > 0 ? "pointer" : "default",
                  opacity: isCurrentMonth ? 1 : 0.35,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (isCurrentMonth && dayEvents.length > 0) {
                    e.currentTarget.style.background = `${theme.colors.primary}0c`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = hasOverdue
                    ? "#fef2f2"
                    : isToday
                      ? `${theme.colors.primary}08`
                      : "white";
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? theme.colors.primary : theme.colors.textPrimary,
                    marginBottom: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      ...(isToday
                        ? {
                            background: theme.colors.primary,
                            color: "white",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
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

          return (
            <div
              key={dateStr}
              style={{
                minHeight: 350,
                padding: 10,
                background: isToday ? `${theme.colors.primary}06` : "white",
                border: `1px solid ${isToday ? theme.colors.primary : theme.colors.borderLight}`,
                borderRadius: 10,
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 600, textTransform: "uppercase" }}>
                  {DAYS[date.getDay()]}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? "white" : theme.colors.textPrimary,
                    ...(isToday
                      ? {
                          background: theme.colors.primary,
                          borderRadius: "50%",
                          width: 28,
                          height: 28,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }
                      : {}),
                  }}
                >
                  {date.getDate()}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setExpandedDay(dateStr)}
                    style={{
                      padding: "5px 7px",
                      borderRadius: 6,
                      background: `${event.color}12`,
                      borderLeft: `3px solid ${event.color}`,
                      cursor: "pointer",
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: 9, color: theme.colors.textMuted, marginTop: 1 }}>
                      {event.type === "task" && event.metadata.assignee && event.metadata.assignee}
                      {event.type === "timeEntry" && `${event.metadata.hours}h`}
                      {event.type === "project" && event.metadata.serviceType?.replace("_", " ")}
                    </div>
                  </div>
                ))}
                {dayEvents.length === 0 && (
                  <div style={{ textAlign: "center", color: theme.colors.textMuted, fontSize: 11, padding: "16px 0" }}>
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${EVENT_TYPE_COLORS.task}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={EVENT_TYPE_COLORS.task} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary }}>{taskStats.total}</div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>Tasks with deadlines</div>
          </div>
        </div>

        <div
          style={{
            background: taskStats.overdue > 0 ? "#fef2f2" : theme.colors.bgSecondary,
            border: `1px solid ${taskStats.overdue > 0 ? "#fca5a5" : theme.colors.borderLight}`,
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: taskStats.overdue > 0 ? "#fee2e2" : `${theme.colors.error}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.error} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: taskStats.overdue > 0 ? theme.colors.error : theme.colors.textPrimary }}>
              {taskStats.overdue}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>Overdue</div>
          </div>
        </div>

        <div
          style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${theme.colors.warning}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary }}>{taskStats.upcoming}</div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>Due this week</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 14,
          padding: "10px 14px",
          background: "white",
          borderRadius: 10,
          border: `1px solid ${theme.colors.borderLight}`,
        }}
      >
        {/* Left: Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: `1px solid ${theme.colors.borderLight}`,
              background: "white",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.colors.textSecondary,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgTertiary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            onClick={goToday}
            style={{
              border: `1px solid ${theme.colors.borderLight}`,
              background: "white",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              color: theme.colors.textSecondary,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgTertiary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
          >
            Today
          </button>

          <button
            onClick={() => navigate(1)}
            style={{
              border: `1px solid ${theme.colors.borderLight}`,
              background: "white",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.colors.textSecondary,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgTertiary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginLeft: 6, fontFamily: "'DM Serif Display', serif" }}>
            {titleLabel}
          </div>
        </div>

        {/* Right: View toggle + type filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Type filters */}
          {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => {
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 16,
                  border: `1px solid ${active ? EVENT_TYPE_COLORS[type] : theme.colors.borderLight}`,
                  background: active ? `${EVENT_TYPE_COLORS[type]}12` : "white",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 500,
                  color: active ? EVENT_TYPE_COLORS[type] : theme.colors.textMuted,
                  transition: "all 0.15s",
                  opacity: active ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: active ? EVENT_TYPE_COLORS[type] : theme.colors.textMuted,
                  }}
                />
                {label}
              </button>
            );
          })}

          <div style={{ width: 1, height: 20, background: theme.colors.borderLight, margin: "0 2px" }} />

          {/* View toggle */}
          <div
            style={{
              display: "flex",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {(["month", "week"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  border: "none",
                  padding: "5px 12px",
                  fontSize: 11,
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

      {/* Loading / Calendar */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            color: theme.colors.textMuted,
            fontSize: 13,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              border: `2px solid ${theme.colors.borderLight}`,
              borderTop: `2px solid ${theme.colors.primary}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginRight: 8,
            }}
          />
          Loading...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {viewMode === "month" && <MonthView />}
          {viewMode === "week" && <WeekView />}
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
