"use client";

import { useState, useMemo } from "react";
import { theme, PRIORITY_STYLES, STATUS_STYLES } from "@/lib/theme";

type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
};

type TasksCalendarViewProps = {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
  loading?: boolean;
};

// Helper functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Task pill component for calendar
function TaskPill({
  task,
  onClick,
}: {
  task: Task;
  onClick?: () => void;
}) {
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
  const statusStyle = STATUS_STYLES[task.status] || { color: "#6B7280", bg: "#f3f4f6" };
  const isCompleted = task.status === "COMPLETED" || task.status === "DONE";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        background: statusStyle.bg,
        color: statusStyle.color,
        marginBottom: 4,
        cursor: "pointer",
        borderLeft: `3px solid ${priorityStyle.color}`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textDecoration: isCompleted ? "line-through" : "none",
        opacity: isCompleted ? 0.6 : 1,
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
      title={`${task.name} (${task.priority})`}
    >
      {task.name}
    </div>
  );
}

// Calendar day cell component
function CalendarDay({
  date,
  tasks,
  isCurrentMonth,
  onTaskClick,
  onDayClick,
}: {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  onTaskClick?: (taskId: string) => void;
  onDayClick?: (date: Date) => void;
}) {
  const dayIsToday = isToday(date);
  const dayIsPast = isPast(date) && !dayIsToday;
  const hasOverdueTasks = tasks.some(
    (t) => dayIsPast && t.status !== "COMPLETED" && t.status !== "DONE"
  );

  return (
    <div
      onClick={() => onDayClick?.(date)}
      style={{
        minHeight: 100,
        padding: 8,
        background: dayIsToday
          ? `${theme.colors.primary}08`
          : isCurrentMonth
          ? theme.colors.bgSecondary
          : theme.colors.bgTertiary,
        borderRadius: 8,
        border: dayIsToday
          ? `2px solid ${theme.colors.primary}`
          : `1px solid ${theme.colors.borderLight}`,
        opacity: isCurrentMonth ? 1 : 0.5,
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!dayIsToday) {
          e.currentTarget.style.background = theme.colors.bgTertiary;
        }
      }}
      onMouseLeave={(e) => {
        if (!dayIsToday) {
          e.currentTarget.style.background = isCurrentMonth
            ? theme.colors.bgSecondary
            : theme.colors.bgTertiary;
        }
      }}
    >
      {/* Day number */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: dayIsToday ? 700 : 500,
            color: dayIsToday
              ? theme.colors.primary
              : dayIsPast
              ? theme.colors.textMuted
              : theme.colors.textPrimary,
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: dayIsToday ? theme.colors.primary : "transparent",
            color: dayIsToday ? "white" : undefined,
          }}
        >
          {date.getDate()}
        </span>
        {tasks.length > 0 && (
          <span
            style={{
              fontSize: 10,
              color: hasOverdueTasks ? theme.colors.error : theme.colors.textMuted,
              fontWeight: 500,
            }}
          >
            {tasks.length} task{tasks.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tasks */}
      <div style={{ maxHeight: 80, overflowY: "auto" }}>
        {tasks.slice(0, 3).map((task) => (
          <TaskPill
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task.id)}
          />
        ))}
        {tasks.length > 3 && (
          <div
            style={{
              fontSize: 10,
              color: theme.colors.textMuted,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            +{tasks.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

// Main Calendar Component
export default function TasksCalendarView({
  tasks,
  onTaskClick,
  loading = false,
}: TasksCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = task.dueDate.split("T")[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days (fill remaining cells)
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(nextYear, nextMonth, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = formatDate(selectedDate);
    return tasksByDate[dateKey] || [];
  }, [selectedDate, tasksByDate]);

  // Stats
  const tasksThisMonth = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.getMonth() === month && dueDate.getFullYear() === year;
    });
  }, [tasks, month, year]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < today && t.status !== "COMPLETED" && t.status !== "DONE";
    });
  }, [tasks]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid ${theme.colors.borderLight}`,
            borderTopColor: theme.colors.primary,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading calendar...
      </div>
    );
  }

  return (
    <div>
      {/* Header with navigation and stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={goToPrevMonth}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${theme.colors.borderLight}`,
              background: theme.colors.bgSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.colors.textSecondary,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: theme.colors.textPrimary,
              margin: 0,
              minWidth: 180,
              textAlign: "center",
            }}
          >
            {MONTHS[month]} {year}
          </h2>

          <button
            onClick={goToNextMonth}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${theme.colors.borderLight}`,
              background: theme.colors.bgSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.colors.textSecondary,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            onClick={goToToday}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.borderLight}`,
              background: theme.colors.bgSecondary,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: theme.colors.textSecondary,
              marginLeft: 8,
            }}
          >
            Today
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: theme.colors.infoBg,
              color: theme.colors.info,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {tasksThisMonth.length} tasks this month
          </div>
          {overdueTasks.length > 0 && (
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: theme.colors.errorBg,
                color: theme.colors.error,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {overdueTasks.length} overdue
            </div>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div
        style={{
          background: theme.colors.bgSecondary,
          borderRadius: 12,
          border: `1px solid ${theme.colors.borderLight}`,
          overflow: "hidden",
        }}
      >
        {/* Weekday headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            background: theme.colors.bgTertiary,
            borderBottom: `1px solid ${theme.colors.borderLight}`,
          }}
        >
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              style={{
                padding: "12px 8px",
                textAlign: "center",
                fontSize: 12,
                fontWeight: 600,
                color: theme.colors.textMuted,
                textTransform: "uppercase",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            padding: 8,
          }}
        >
          {calendarDays.map(({ date, isCurrentMonth }, idx) => {
            const dateKey = formatDate(date);
            const dayTasks = tasksByDate[dateKey] || [];
            return (
              <CalendarDay
                key={idx}
                date={date}
                tasks={dayTasks}
                isCurrentMonth={isCurrentMonth}
                onTaskClick={onTaskClick}
                onDayClick={setSelectedDate}
              />
            );
          })}
        </div>
      </div>

      {/* Selected date tasks panel */}
      {selectedDate && (
        <div
          style={{
            marginTop: 20,
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.colors.textPrimary,
                margin: 0,
              }}
            >
              Tasks for {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: theme.colors.textMuted,
                padding: 4,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {selectedDateTasks.length === 0 ? (
            <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
              No tasks due on this date
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedDateTasks.map((task) => {
                const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
                const statusStyle = STATUS_STYLES[task.status] || { color: "#6B7280", bg: "#f3f4f6" };
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task.id)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: theme.colors.bgPrimary,
                      border: `1px solid ${theme.colors.borderLight}`,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.borderLight;
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 4,
                          height: 32,
                          borderRadius: 2,
                          background: priorityStyle.color,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: theme.colors.textPrimary,
                            marginBottom: 4,
                          }}
                        >
                          {task.name}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 10,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 500,
                            }}
                          >
                            {task.status.replace(/_/g, " ")}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 10,
                              background: priorityStyle.bg,
                              color: priorityStyle.color,
                              fontWeight: 500,
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    {task.assignee && (
                      <div
                        title={task.assignee.name}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: theme.gradients.primary,
                          color: "white",
                          fontSize: 11,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {task.assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
