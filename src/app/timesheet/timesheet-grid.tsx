"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

interface TimeEntryData {
  id: string;
  duration: number;
  description: string | null;
  billable: boolean;
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
}

export default function TimesheetGrid({ weekDates, entries: initialEntries, clients, userId, canEdit }: Props) {
  const [rows, setRows] = useState<RowData[]>(initialEntries);
  const [showAddRow, setShowAddRow] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{
    row: RowData;
    dateKey: string;
    entries: TimeEntryData[];
  } | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState("");
  const [editDescription, setEditDescription] = useState("");
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
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  const parseDuration = (value: string): number | null => {
    // Accept formats: "1:30", "1.5", "90" (minutes)
    const colonMatch = value.match(/^(\d+):(\d{1,2})$/);
    if (colonMatch) {
      return parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60;
    }
    
    const decimalMatch = value.match(/^(\d+(?:\.\d+)?)$/);
    if (decimalMatch) {
      const num = parseFloat(decimalMatch[1]);
      // If small number, treat as hours; if large, treat as minutes
      if (num < 24) {
        return Math.round(num * 3600);
      } else {
        return Math.round(num * 60);
      }
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
    setRows(prevRows => prevRows.map(row => {
      if (row.key !== rowKey) return row;
      
      const updatedEntries = { ...row.entries };
      if (newEntries.length > 0) {
        updatedEntries[dateKey] = newEntries;
      } else {
        delete updatedEntries[dateKey];
      }
      
      // Recalculate total
      const total = Object.values(updatedEntries).reduce((sum, entries) => {
        return sum + entries.reduce((s, e) => s + e.duration, 0);
      }, 0);
      
      return { ...row, entries: updatedEntries, total };
    }));

    // Update modal state too
    if (detailModal && detailModal.row.key === rowKey && detailModal.dateKey === dateKey) {
      setDetailModal({ ...detailModal, entries: newEntries });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!detailModal) return;
    if (!confirm("Delete this time entry?")) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/time-entries/${entryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const newEntries = detailModal.entries.filter(e => e.id !== entryId);
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newEntries = detailModal.entries.map(e => 
          e.id === editingEntryId 
            ? { ...e, duration: data.timeEntry.duration, description: data.timeEntry.description }
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

    // Check if row already exists
    const rowKey = `${selectedProject}-${selectedTask}`;
    if (rows.some((r) => r.key === rowKey)) {
      alert("This project/task combination already exists in your timesheet");
      return;
    }

    setIsAddingRow(true);

    // Find selected items
    const client = clients.find((c) => c.id === selectedClient);
    const project = projects.find((p) => p.id === selectedProject);
    const task = tasks.find((t) => t.id === selectedTask);

    if (client && project && task) {
      setRows([
        ...rows,
        {
          key: rowKey,
          client,
          project,
          task,
          entries: {},
          total: 0,
        },
      ]);
    }

    setShowAddRow(false);
    setSelectedClient("");
    setSelectedProject("");
    setSelectedTask("");
    setIsAddingRow(false);
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

  return (
    <div style={{
      background: theme.colors.bgSecondary,
      borderRadius: theme.borderRadius.lg,
      border: "1px solid " + theme.colors.borderLight,
      overflow: "hidden",
    }}>
      {/* Grid Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "300px repeat(7, 1fr) 80px",
        borderBottom: "2px solid " + theme.colors.borderLight,
        background: theme.colors.bgTertiary,
      }}>
        <div style={{ padding: "14px 20px", fontWeight: 600, fontSize: 13, color: theme.colors.textSecondary }}>
          Client & Project / Task
        </div>
        {dates.map((date, i) => (
          <div key={i} style={{ 
            padding: "14px 12px", 
            textAlign: "center",
            borderLeft: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>
              {dayNames[i]}, {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: dailyTotals[i] > 0 ? theme.colors.textPrimary : theme.colors.textMuted }}>
              {formatDuration(dailyTotals[i])}
            </div>
          </div>
        ))}
        <div style={{ 
          padding: "14px 12px", 
          textAlign: "center", 
          fontWeight: 600, 
          fontSize: 13,
          borderLeft: "1px solid " + theme.colors.borderLight,
          background: theme.colors.infoBg,
        }}>
          <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 2 }}>Total</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.colors.info }}>
            {formatDuration(weekTotal)}
          </div>
        </div>
      </div>

      {/* Grid Rows */}
      {rows.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
          No time entries this week. Click "Add timesheet row" to start tracking.
        </div>
      ) : (
        rows.map((row) => {
          const rowTotal = dates.reduce((sum, date) => {
            const dateKey = date.toISOString().split("T")[0];
            const dayEntries = row.entries[dateKey] || [];
            return sum + dayEntries.reduce((s, e) => s + e.duration, 0);
          }, 0);

          return (
            <div
              key={row.key}
              style={{
                display: "grid",
                gridTemplateColumns: "300px repeat(7, 1fr) 80px",
                borderBottom: "1px solid " + theme.colors.borderLight,
              }}
            >
              {/* Project/Task Cell */}
              <div style={{ padding: "12px 20px" }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary, marginBottom: 2 }}>
                  {row.client.nickname || row.client.name} - {row.project.name}
                </div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                  {row.task.name}
                </div>
              </div>

              {/* Day Cells */}
              {dates.map((date, i) => {
                const dateKey = date.toISOString().split("T")[0];
                const dayEntries = row.entries[dateKey] || [];
                const dayDuration = dayEntries.reduce((s, e) => s + e.duration, 0);
                const entryCount = dayEntries.length;

                return (
                  <div
                    key={i}
                    onClick={() => handleCellClick(row, dateKey)}
                    style={{
                      padding: "12px",
                      borderLeft: "1px solid " + theme.colors.borderLight,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: canEdit ? "pointer" : "default",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => {
                      if (canEdit) e.currentTarget.style.background = theme.colors.bgTertiary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{
                      fontSize: 14,
                      fontWeight: dayDuration > 0 ? 500 : 400,
                      color: dayDuration > 0 ? theme.colors.textPrimary : theme.colors.textMuted,
                      padding: "6px 12px",
                      borderRadius: theme.borderRadius.sm,
                      background: dayDuration > 0 ? theme.colors.bgTertiary : "transparent",
                    }}>
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
              <div style={{
                padding: "12px",
                borderLeft: "1px solid " + theme.colors.borderLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 14,
                color: rowTotal > 0 ? theme.colors.textPrimary : theme.colors.textMuted,
              }}>
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
            <div style={{ 
              display: "flex", 
              gap: 12, 
              alignItems: "flex-end",
              flexWrap: "wrap",
              background: theme.colors.bgTertiary,
              padding: 16,
              borderRadius: theme.borderRadius.md,
            }}>
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
                    <option key={c.id} value={c.id}>{c.nickname || c.name}</option>
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
                    <option key={p.id} value={p.id}>{p.name}</option>
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
                    <option key={t.id} value={t.id}>{t.name}</option>
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

      {/* Detail Modal */}
      {detailModal && (
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
              borderRadius: theme.borderRadius.lg,
              padding: 24,
              width: 500,
              maxWidth: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: theme.shadows.lg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Time Entries
              </h2>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>
                {detailModal.row.client.nickname || detailModal.row.client.name} → {detailModal.row.project.name} → {detailModal.row.task.name}
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
                {new Date(detailModal.dateKey).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>

            {/* Entries List */}
            <div style={{ marginBottom: 16 }}>
              {detailModal.entries.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: theme.colors.textMuted, background: theme.colors.bgTertiary, borderRadius: theme.borderRadius.md }}>
                  No time entries for this day
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {detailModal.entries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        background: theme.colors.bgTertiary,
                        borderRadius: theme.borderRadius.md,
                        padding: 12,
                      }}
                    >
                      {editingEntryId === entry.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              type="text"
                              value={editDuration}
                              onChange={(e) => setEditDuration(e.target.value)}
                              placeholder="0:00"
                              style={{
                                width: 80,
                                padding: "8px 12px",
                                borderRadius: theme.borderRadius.sm,
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
                                borderRadius: theme.borderRadius.sm,
                                border: "1px solid " + theme.colors.borderLight,
                                fontSize: 14,
                              }}
                            />
                          </div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => setEditingEntryId(null)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: theme.borderRadius.sm,
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
                                padding: "6px 12px",
                                borderRadius: theme.borderRadius.sm,
                                border: "none",
                                background: theme.colors.success,
                                color: "white",
                                fontSize: 12,
                                cursor: "pointer",
                                opacity: isSaving ? 0.5 : 1,
                              }}
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 16, color: theme.colors.textPrimary }}>
                              {formatDurationLong(entry.duration)}
                            </div>
                            {entry.description && (
                              <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
                                {entry.description}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleEditEntry(entry)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: theme.borderRadius.sm,
                                border: "1px solid " + theme.colors.borderLight,
                                background: "transparent",
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={isSaving}
                              style={{
                                padding: "6px 10px",
                                borderRadius: theme.borderRadius.sm,
                                border: "1px solid " + theme.colors.errorBg,
                                background: theme.colors.errorBg,
                                color: theme.colors.error,
                                fontSize: 12,
                                cursor: "pointer",
                                opacity: isSaving ? 0.5 : 1,
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            {detailModal.entries.length > 0 && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: theme.colors.infoBg,
                borderRadius: theme.borderRadius.md,
                marginBottom: 16,
              }}>
                <span style={{ fontWeight: 500, color: theme.colors.info }}>Total</span>
                <span style={{ fontWeight: 700, color: theme.colors.info }}>
                  {formatDurationLong(detailModal.entries.reduce((sum, e) => sum + e.duration, 0))}
                </span>
              </div>
            )}

            {/* Add Entry Form */}
            {showAddEntry ? (
              <div style={{
                background: theme.colors.bgTertiary,
                borderRadius: theme.borderRadius.md,
                padding: 12,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Add New Entry</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="1:30"
                    style={{
                      width: 80,
                      padding: "8px 12px",
                      borderRadius: theme.borderRadius.sm,
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
                      borderRadius: theme.borderRadius.sm,
                      border: "1px solid " + theme.colors.borderLight,
                      fontSize: 14,
                    }}
                  />
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
                      borderRadius: theme.borderRadius.sm,
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
                      padding: "6px 12px",
                      borderRadius: theme.borderRadius.sm,
                      border: "none",
                      background: theme.colors.success,
                      color: "white",
                      fontSize: 12,
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
                  borderRadius: theme.borderRadius.md,
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
            )}

            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDetailModal(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
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
      )}
    </div>
  );
}
