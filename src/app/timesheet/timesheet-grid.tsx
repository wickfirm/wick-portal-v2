"use client";

import { useState, useEffect, useCallback } from "react";
import { theme } from "@/lib/theme";

interface TimeEntryData {
  id: string;
  duration: number;
  description: string | null;
  billable: boolean;
  source?: string;
  createdAt?: string;
}

interface RowData {
  key: string;
  client: { id: string; name: string; nickname: string | null };
  project: { id: string; name: string };
  task: { id: string; name: string };
  entries: Record<string, TimeEntryData[]>;
  total: number;
}

interface Client {
  id: string;
  name: string;
  nickname: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
}

interface Props {
  weekDates: string[];
  entries: RowData[];
  clients: Client[];
  userId: string;
  canEdit: boolean;
  dailyOvertimeThreshold?: number;
  weeklyOvertimeThreshold?: number;
}

type ScreenSize = "mobile" | "tablet" | "desktop";

export default function TimesheetGrid({
  weekDates,
  entries: initialEntries,
  clients,
  userId,
  canEdit,
  dailyOvertimeThreshold = 28800,
  weeklyOvertimeThreshold = 144000,
}: Props) {
  const [rows, setRows] = useState<RowData[]>(initialEntries);
  const [showAddRow, setShowAddRow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [screenSize, setScreenSize] = useState<ScreenSize>("desktop");

  // Bulk select state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "edit" | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{
    row: RowData;
    dateKey: string;
    entries: TimeEntryData[];
  } | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBillable, setEditBillable] = useState(true);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newDuration, setNewDuration] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Add row form state
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Parse week dates
  const dates = weekDates.map((d) => new Date(d));
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Responsive breakpoint detection
  useEffect(() => {
    const checkSize = () => {
      const w = window.innerWidth;
      if (w < 768) setScreenSize("mobile");
      else if (w < 1024) setScreenSize("tablet");
      else setScreenSize("desktop");
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Sync initial entries on prop changes
  useEffect(() => {
    setRows(initialEntries);
    setSelectedRows(new Set());
  }, [initialEntries]);

  // Fetch projects when client changes
  useEffect(() => {
    if (selectedClient) {
      setSelectedProject("");
      setSelectedTask("");
      setProjects([]);
      setTasks([]);

      fetch(`/api/projects?clientId=${selectedClient}`)
        .then((res) => res.json())
        .then((data) => setProjects(data))
        .catch(console.error);
    }
  }, [selectedClient]);

  // Fetch tasks when project changes
  useEffect(() => {
    if (selectedProject && selectedClient) {
      setSelectedTask("");
      setTasks([]);

      fetch(`/api/clients/${selectedClient}/tasks?projectId=${selectedProject}`)
        .then((res) => res.json())
        .then((data) => setTasks(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [selectedProject, selectedClient]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  const formatDurationLong = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const parseDuration = (value: string): number | null => {
    const colonMatch = value.match(/^(\d+):(\d{1,2})$/);
    if (colonMatch) return parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60;

    const decimalMatch = value.match(/^(\d+(?:\.\d+)?)$/);
    if (decimalMatch) {
      const num = parseFloat(decimalMatch[1]);
      if (num < 24) return Math.round(num * 3600);
      else return Math.round(num * 60);
    }

    return null;
  };

  const handleCellClick = (row: RowData, dateKey: string) => {
    if (!canEdit) return;
    const dayEntries = row.entries[dateKey] || [];
    setDetailModal({ row, dateKey, entries: dayEntries });
    setEditingEntryId(null);
    setShowAddEntry(false);
  };

  const updateRowEntries = (rowKey: string, dateKey: string, newEntries: TimeEntryData[]) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.key !== rowKey) return row;

        const updatedEntries = { ...row.entries };
        if (newEntries.length > 0) {
          updatedEntries[dateKey] = newEntries;
        } else {
          delete updatedEntries[dateKey];
        }

        const total = Object.values(updatedEntries).reduce((sum, entries) => {
          return sum + entries.reduce((s, e) => s + e.duration, 0);
        }, 0);

        return { ...row, entries: updatedEntries, total };
      })
    );

    if (detailModal && detailModal.row.key === rowKey && detailModal.dateKey === dateKey) {
      setDetailModal({ ...detailModal, entries: newEntries });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!detailModal) return;
    if (!confirm("Delete this time entry?")) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/time-entries/${entryId}`, { method: "DELETE" });
      if (res.ok) {
        const newEntries = detailModal.entries.filter((e) => e.id !== entryId);
        updateRowEntries(detailModal.row.key, detailModal.dateKey, newEntries);
      } else {
        const error = await res.json();
        alert("Failed to delete: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEntry = (entry: TimeEntryData) => {
    setEditingEntryId(entry.id);
    setEditDuration(formatDuration(entry.duration));
    setEditDescription(entry.description || "");
    setEditBillable(entry.billable);
  };

  const handleSaveEdit = async () => {
    if (!detailModal || !editingEntryId) return;

    const duration = parseDuration(editDuration);
    if (!duration || duration <= 0) {
      alert("Invalid duration. Use h:mm format (e.g., 1:30)");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/time-entries/${editingEntryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration,
          description: editDescription || null,
          billable: editBillable,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newEntries = detailModal.entries.map((e) =>
          e.id === editingEntryId
            ? { ...e, duration: data.timeEntry.duration, description: data.timeEntry.description, billable: data.timeEntry.billable ?? editBillable }
            : e
        );
        updateRowEntries(detailModal.row.key, detailModal.dateKey, newEntries);
        setEditingEntryId(null);
      } else {
        const error = await res.json();
        alert("Failed to update: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEntry = async () => {
    if (!detailModal) return;

    const duration = parseDuration(newDuration);
    if (!duration || duration <= 0) {
      alert("Invalid duration. Use h:mm format (e.g., 1:30)");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: detailModal.row.client.id,
          projectId: detailModal.row.project.id,
          taskId: detailModal.row.task.id,
          date: detailModal.dateKey,
          duration,
          description: newDescription || null,
          billable: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newEntry: TimeEntryData = {
          id: data.timeEntry.id,
          duration: data.timeEntry.duration,
          description: data.timeEntry.description,
          billable: data.timeEntry.billable,
          source: data.timeEntry.source || "MANUAL",
        };
        const newEntries = [...detailModal.entries, newEntry];
        updateRowEntries(detailModal.row.key, detailModal.dateKey, newEntries);
        setShowAddEntry(false);
        setNewDuration("");
        setNewDescription("");
      } else {
        const error = await res.json();
        alert("Failed to add: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error adding entry:", error);
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRow = async () => {
    if (!selectedClient || !selectedProject || !selectedTask) {
      alert("Please select client, project, and task");
      return;
    }

    const rowKey = `${selectedProject}-${selectedTask}`;
    if (rows.some((r) => r.key === rowKey)) {
      alert("This project/task combination already exists in your timesheet");
      return;
    }

    setIsAddingRow(true);
    const client = clients.find((c) => c.id === selectedClient);
    const project = projects.find((p) => p.id === selectedProject);
    const task = tasks.find((t) => t.id === selectedTask);

    if (client && project && task) {
      setRows([...rows, { key: rowKey, client, project, task, entries: {}, total: 0 }]);
    }

    setShowAddRow(false);
    setSelectedClient("");
    setSelectedProject("");
    setSelectedTask("");
    setIsAddingRow(false);
  };

  // Bulk operations
  const toggleRowSelect = (key: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((r) => r.key)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`Delete all time entries for ${selectedRows.size} selected row(s) in the visible period?`)) return;

    setIsBulkProcessing(true);
    try {
      const entryIds: string[] = [];
      rows.forEach((row) => {
        if (selectedRows.has(row.key)) {
          Object.values(row.entries).forEach((dayEntries) => {
            dayEntries.forEach((e) => entryIds.push(e.id));
          });
        }
      });

      if (entryIds.length === 0) {
        alert("No entries to delete.");
        setIsBulkProcessing(false);
        return;
      }

      const res = await fetch("/api/time-entries/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryIds }),
      });

      if (res.ok) {
        setRows((prev) => prev.filter((r) => !selectedRows.has(r.key)));
        setSelectedRows(new Set());
      } else {
        const error = await res.json();
        alert("Bulk delete failed: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      alert("Network error during bulk delete");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Calculate daily totals
  const dailyTotals = dates.map((date) => {
    const dateKey = date.toISOString().split("T")[0];
    return rows.reduce((sum, row) => {
      const dayEntries = row.entries[dateKey] || [];
      return sum + dayEntries.reduce((s, e) => s + e.duration, 0);
    }, 0);
  });

  const weekTotal = dailyTotals.reduce((a, b) => a + b, 0);
  const isWeekOvertime = weekTotal > weeklyOvertimeThreshold;

  // ═══════════════════════════════════════
  //  MOBILE LAYOUT  (<768px)
  // ═══════════════════════════════════════
  if (screenSize === "mobile") {
    return (
      <div>
        {/* Mobile Summary Bar */}
        <div
          style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: "1px solid " + theme.colors.borderLight,
            padding: "14px 16px",
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>Week Total</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "'DM Serif Display', serif",
                color: isWeekOvertime ? theme.colors.error : theme.colors.textPrimary,
              }}
            >
              {formatDuration(weekTotal)}
            </div>
          </div>
          {isWeekOvertime && (
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                background: theme.colors.errorBg,
                color: theme.colors.error,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              OVERTIME
            </div>
          )}
        </div>

        {/* Rows as Cards */}
        {rows.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: theme.colors.textMuted,
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              border: "1px solid " + theme.colors.borderLight,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No time entries</div>
            <div style={{ fontSize: 13 }}>Tap &quot;Add row&quot; to start tracking</div>
          </div>
        ) : (
          rows.map((row) => {
            const rowTotal = dates.reduce((sum, date) => {
              const dateKey = date.toISOString().split("T")[0];
              return sum + (row.entries[dateKey] || []).reduce((s, e) => s + e.duration, 0);
            }, 0);

            return (
              <div
                key={row.key}
                style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.borderRadius.lg,
                  border: "1px solid " + theme.colors.borderLight,
                  marginBottom: 10,
                  overflow: "hidden",
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid " + theme.colors.borderLight,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary }}>
                      {row.client.nickname || row.client.name}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 1 }}>
                      {row.project.name} / {row.task.name}
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: rowTotal > 0 ? theme.colors.textPrimary : theme.colors.textMuted,
                    }}
                  >
                    {formatDuration(rowTotal)}
                  </div>
                </div>

                {/* Day pills - horizontal scroll */}
                <div
                  style={{
                    display: "flex",
                    overflowX: "auto",
                    gap: 6,
                    padding: "10px 14px",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {dates.map((date, i) => {
                    const dateKey = date.toISOString().split("T")[0];
                    const dayEntries = row.entries[dateKey] || [];
                    const dayDuration = dayEntries.reduce((s, e) => s + e.duration, 0);
                    const isDayOvertime = dailyTotals[i] > dailyOvertimeThreshold;

                    return (
                      <button
                        key={i}
                        onClick={() => handleCellClick(row, dateKey)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid " + (isDayOvertime && dayDuration > 0 ? theme.colors.error + "40" : theme.colors.borderLight),
                          background:
                            dayDuration > 0
                              ? isDayOvertime
                                ? theme.colors.errorBg
                                : theme.colors.bgTertiary
                              : "transparent",
                          cursor: canEdit ? "pointer" : "default",
                          minWidth: 56,
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 500 }}>
                          {dayNames[i]}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: dayDuration > 0 ? 600 : 400,
                            color:
                              dayDuration > 0
                                ? isDayOvertime
                                  ? theme.colors.error
                                  : theme.colors.textPrimary
                                : theme.colors.textMuted,
                            marginTop: 2,
                          }}
                        >
                          {dayDuration > 0 ? formatDuration(dayDuration) : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Add row button */}
        {canEdit && !showAddRow && (
          <button
            onClick={() => setShowAddRow(true)}
            style={{
              padding: "12px 16px",
              borderRadius: theme.borderRadius.lg,
              border: "1px dashed " + theme.colors.borderMedium,
              background: "transparent",
              color: theme.colors.primary,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
              marginTop: 4,
            }}
          >
            + Add timesheet row
          </button>
        )}

        {showAddRow && renderAddRowForm()}
        {detailModal && renderDetailModal()}
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  DESKTOP & TABLET LAYOUT (≥768px)
  // ═══════════════════════════════════════
  const firstColWidth = screenSize === "tablet" ? "220px" : "300px";
  const fontSize = screenSize === "tablet" ? 12 : 14;
  const showBulkCheckbox = canEdit && rows.length > 0;
  const gridCols = showBulkCheckbox
    ? `36px ${firstColWidth} repeat(${dates.length}, 1fr) 80px`
    : `${firstColWidth} repeat(${dates.length}, 1fr) 80px`;

  // ── Render helpers ──

  function renderAddRowForm() {
    return (
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          flexWrap: "wrap",
          background: theme.colors.bgTertiary,
          padding: 16,
          borderRadius: theme.borderRadius.md,
          marginTop: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary }}>
            Client
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: theme.borderRadius.sm,
              border: "1px solid " + theme.colors.borderLight,
              fontSize: 13,
            }}
          >
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname || c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary }}>
            Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={!selectedClient}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: theme.borderRadius.sm,
              border: "1px solid " + theme.colors.borderLight,
              fontSize: 13,
              opacity: selectedClient ? 1 : 0.5,
            }}
          >
            <option value="">Select project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary }}>
            Task
          </label>
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            disabled={!selectedProject}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: theme.borderRadius.sm,
              border: "1px solid " + theme.colors.borderLight,
              fontSize: 13,
              opacity: selectedProject ? 1 : 0.5,
            }}
          >
            <option value="">Select task...</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleAddRow}
            disabled={isAddingRow || !selectedClient || !selectedProject || !selectedTask}
            style={{
              padding: "8px 16px",
              borderRadius: theme.borderRadius.sm,
              border: "none",
              background: theme.colors.success,
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              opacity: isAddingRow || !selectedClient || !selectedProject || !selectedTask ? 0.5 : 1,
            }}
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowAddRow(false);
              setSelectedClient("");
              setSelectedProject("");
              setSelectedTask("");
            }}
            style={{
              padding: "8px 16px",
              borderRadius: theme.borderRadius.sm,
              border: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgSecondary,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  function renderDetailModal() {
    if (!detailModal) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={() => setDetailModal(null)}
      >
        <div
          style={{
            background: theme.colors.bgSecondary,
            borderRadius: 16,
            padding: 24,
            width: 520,
            maxWidth: "92%",
            maxHeight: "85vh",
            overflow: "auto",
            boxShadow: theme.shadows.lg,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Time Entries</h2>
              <button
                onClick={() => setDetailModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.colors.textMuted,
                  cursor: "pointer",
                  fontSize: 20,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>
              {detailModal.row.client.nickname || detailModal.row.client.name} → {detailModal.row.project.name} → {detailModal.row.task.name}
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
              {new Date(detailModal.dateKey).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Entries List */}
          <div style={{ marginBottom: 16 }}>
            {detailModal.entries.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: theme.colors.textMuted,
                  background: theme.colors.bgTertiary,
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                No time entries for this day
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detailModal.entries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      background: theme.colors.bgTertiary,
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    {editingEntryId === entry.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="text"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            placeholder="h:mm"
                            title="Enter time as hours:minutes (e.g. 1:30 for 1 hour 30 minutes)"
                            style={{
                              width: 80,
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1px solid " + theme.colors.borderLight,
                              fontSize: 14,
                            }}
                          />
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description (optional)"
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1px solid " + theme.colors.borderLight,
                              fontSize: 14,
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                            <input
                              type="checkbox"
                              checked={editBillable}
                              onChange={(e) => setEditBillable(e.target.checked)}
                              style={{ width: 16, height: 16, accentColor: theme.colors.success }}
                            />
                            <span style={{ color: theme.colors.textSecondary }}>Billable</span>
                          </label>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setEditingEntryId(null)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "1px solid " + theme.colors.borderLight,
                                background: "transparent",
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSaving}
                              style={{
                                padding: "6px 16px",
                                borderRadius: 8,
                                border: "none",
                                background: theme.colors.success,
                                color: "white",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                                opacity: isSaving ? 0.5 : 1,
                              }}
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, fontSize: 16, color: theme.colors.textPrimary }}>
                              {formatDurationLong(entry.duration)}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: entry.source === "TIMER" ? theme.colors.successBg : theme.colors.infoBg,
                                color: entry.source === "TIMER" ? theme.colors.success : theme.colors.info,
                                fontWeight: 500,
                              }}
                            >
                              {entry.source === "TIMER" ? "Timer" : "Manual"}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: entry.billable ? theme.colors.successBg : theme.colors.bgTertiary,
                                color: entry.billable ? theme.colors.success : theme.colors.textMuted,
                                fontWeight: 500,
                              }}
                            >
                              {entry.billable ? "$" : "Non-billable"}
                            </span>
                          </div>
                          {entry.description && (
                            <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>
                              {entry.description}
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => handleEditEntry(entry)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid " + theme.colors.borderLight,
                                background: "transparent",
                                fontSize: 12,
                                cursor: "pointer",
                                color: theme.colors.textSecondary,
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={isSaving}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid " + theme.colors.error + "30",
                                background: theme.colors.errorBg,
                                color: theme.colors.error,
                                fontSize: 12,
                                cursor: "pointer",
                                opacity: isSaving ? 0.5 : 1,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          {detailModal.entries.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: theme.colors.infoBg,
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <span style={{ fontWeight: 500, color: theme.colors.info }}>Total</span>
              <span style={{ fontWeight: 700, color: theme.colors.info }}>
                {formatDurationLong(detailModal.entries.reduce((sum, e) => sum + e.duration, 0))}
              </span>
            </div>
          )}

          {/* Add Entry Form */}
          {canEdit &&
            (showAddEntry ? (
              <div
                style={{
                  background: theme.colors.bgTertiary,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Add New Entry</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="h:mm"
                    title="Enter time as hours:minutes (e.g. 1:30)"
                    style={{
                      width: 80,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid " + theme.colors.borderLight,
                      fontSize: 14,
                    }}
                  />
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optional)"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid " + theme.colors.borderLight,
                      fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 8 }}>
                  Format: h:mm (e.g. 1:30 = 1 hour 30 minutes)
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      setShowAddEntry(false);
                      setNewDuration("");
                      setNewDescription("");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid " + theme.colors.borderLight,
                      background: "transparent",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEntry}
                    disabled={isSaving || !newDuration}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: theme.colors.success,
                      color: "white",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      opacity: isSaving || !newDuration ? 0.5 : 1,
                    }}
                  >
                    {isSaving ? "Adding..." : "Add Entry"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddEntry(true)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px dashed " + theme.colors.borderMedium,
                  background: "transparent",
                  color: theme.colors.primary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
              >
                + Add Time Entry
              </button>
            ))}

          {/* Close Button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setDetailModal(null)}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background: theme.colors.primary,
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.borderLight,
          overflow: "hidden",
        }}
      >
        {/* Grid Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            borderBottom: "2px solid " + theme.colors.borderLight,
            background: theme.colors.bgTertiary,
          }}
        >
          {/* Bulk Select All */}
          {showBulkCheckbox && (
            <div
              style={{
                padding: "14px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                type="checkbox"
                checked={selectedRows.size === rows.length && rows.length > 0}
                onChange={toggleSelectAll}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: theme.colors.primary }}
              />
            </div>
          )}

          {/* Project header */}
          <div style={{ padding: "14px 16px", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Project / Task
          </div>

          {/* Day headers with overtime indicators */}
          {dates.map((date, i) => {
            const isDayOvertime = dailyTotals[i] > dailyOvertimeThreshold;
            return (
              <div
                key={i}
                style={{
                  padding: "10px 8px",
                  textAlign: "center",
                  borderLeft: "1px solid " + theme.colors.borderLight,
                  background: isDayOvertime ? theme.colors.errorBg : "transparent",
                  transition: "background 200ms",
                }}
              >
                <div style={{ fontSize: 10, color: theme.colors.textMuted, marginBottom: 2, fontWeight: 500, textTransform: "uppercase" }}>
                  {dayNames[i]}{screenSize !== "tablet" ? ", " + date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                </div>
                <div
                  style={{
                    fontSize: fontSize,
                    fontWeight: 600,
                    color: isDayOvertime ? theme.colors.error : dailyTotals[i] > 0 ? theme.colors.textPrimary : theme.colors.textMuted,
                  }}
                  title={isDayOvertime ? `Overtime! ${formatDuration(dailyTotals[i])} (limit: ${formatDuration(dailyOvertimeThreshold)})` : "Hours:Minutes"}
                >
                  {formatDuration(dailyTotals[i])}
                  {isDayOvertime && (
                    <span style={{ display: "block", fontSize: 9, color: theme.colors.error, fontWeight: 400 }}>
                      +{formatDuration(dailyTotals[i] - dailyOvertimeThreshold)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Week total header */}
          <div
            style={{
              padding: "10px 8px",
              textAlign: "center",
              fontWeight: 600,
              fontSize: 12,
              borderLeft: "1px solid " + theme.colors.borderLight,
              background: isWeekOvertime ? theme.colors.errorBg : theme.colors.infoBg,
            }}
          >
            <div style={{ fontSize: 10, color: theme.colors.textMuted, marginBottom: 2, textTransform: "uppercase" }}>Total</div>
            <div
              style={{
                fontSize: fontSize,
                fontWeight: 700,
                color: isWeekOvertime ? theme.colors.error : theme.colors.info,
              }}
            >
              {formatDuration(weekTotal)}
            </div>
          </div>
        </div>

        {/* Grid Rows */}
        {rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No time entries this week</div>
            <div style={{ fontSize: 13 }}>Click &quot;Add timesheet row&quot; to start tracking</div>
          </div>
        ) : (
          rows.map((row) => {
            const rowTotal = dates.reduce((sum, date) => {
              const dateKey = date.toISOString().split("T")[0];
              return sum + (row.entries[dateKey] || []).reduce((s, e) => s + e.duration, 0);
            }, 0);
            const isSelected = selectedRows.has(row.key);

            return (
              <div
                key={row.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  borderBottom: "1px solid " + theme.colors.borderLight,
                  background: isSelected ? theme.colors.primary + "08" : "transparent",
                  transition: "background 100ms",
                }}
              >
                {/* Bulk checkbox */}
                {showBulkCheckbox && (
                  <div
                    style={{
                      padding: "12px 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRowSelect(row.key)}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: theme.colors.primary }}
                    />
                  </div>
                )}

                {/* Project/Task Cell */}
                <div style={{ padding: "12px 16px" }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: fontSize - 1,
                      color: theme.colors.textPrimary,
                      marginBottom: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={`${row.client.nickname || row.client.name} - ${row.project.name}`}
                  >
                    {row.client.nickname || row.client.name} - {row.project.name}
                  </div>
                  <div style={{ fontSize: fontSize - 3, color: theme.colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.task.name}
                  </div>
                </div>

                {/* Day Cells */}
                {dates.map((date, i) => {
                  const dateKey = date.toISOString().split("T")[0];
                  const dayEntries = row.entries[dateKey] || [];
                  const dayDuration = dayEntries.reduce((s, e) => s + e.duration, 0);
                  const entryCount = dayEntries.length;
                  const isDayOvertime = dailyTotals[i] > dailyOvertimeThreshold;

                  return (
                    <div
                      key={i}
                      onClick={() => handleCellClick(row, dateKey)}
                      style={{
                        padding: "12px 8px",
                        borderLeft: "1px solid " + theme.colors.borderLight,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: canEdit ? "pointer" : "default",
                        transition: "background 100ms",
                        background: isDayOvertime && dayDuration > 0 ? theme.colors.error + "08" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (canEdit) e.currentTarget.style.background = isDayOvertime && dayDuration > 0 ? theme.colors.error + "14" : theme.colors.bgTertiary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDayOvertime && dayDuration > 0 ? theme.colors.error + "08" : "transparent";
                      }}
                    >
                      <span
                        style={{
                          fontSize,
                          fontWeight: dayDuration > 0 ? 500 : 400,
                          color: dayDuration > 0 ? (isDayOvertime ? theme.colors.error : theme.colors.textPrimary) : theme.colors.textMuted,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: dayDuration > 0 ? (isDayOvertime ? theme.colors.errorBg : theme.colors.bgTertiary) : "transparent",
                        }}
                        title={dayDuration > 0 ? `${formatDurationLong(dayDuration)} — Click to view details` : "Click to add time"}
                      >
                        {dayDuration > 0 ? formatDuration(dayDuration) : "—"}
                      </span>
                      {entryCount > 1 && (
                        <span style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }}>
                          {entryCount} entries
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Row Total */}
                <div
                  style={{
                    padding: "12px 8px",
                    borderLeft: "1px solid " + theme.colors.borderLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize,
                    color: rowTotal > 0 ? theme.colors.textPrimary : theme.colors.textMuted,
                  }}
                  title="Hours:Minutes"
                >
                  {formatDuration(rowTotal)}
                </div>
              </div>
            );
          })
        )}

        {/* Add Row Section */}
        {canEdit && (
          <div style={{ padding: 16, borderTop: rows.length > 0 ? "none" : "1px solid " + theme.colors.borderLight }}>
            {showAddRow ? (
              renderAddRowForm()
            ) : (
              <button
                onClick={() => setShowAddRow(true)}
                style={{
                  padding: "10px 16px",
                  borderRadius: theme.borderRadius.sm,
                  border: "1px dashed " + theme.colors.borderMedium,
                  background: "transparent",
                  color: theme.colors.primary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                + Add timesheet row
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedRows.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: theme.colors.textPrimary,
            color: "white",
            borderRadius: 14,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            zIndex: 999,
            animation: "slideUp 200ms ease-out",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {selectedRows.size} row{selectedRows.size > 1 ? "s" : ""} selected
          </span>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />

          <button
            onClick={handleBulkDelete}
            disabled={isBulkProcessing}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: theme.colors.error,
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              opacity: isBulkProcessing ? 0.5 : 1,
            }}
          >
            {isBulkProcessing ? "Deleting..." : "Delete Entries"}
          </button>

          <button
            onClick={() => {
              setSelectedRows(new Set());
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
