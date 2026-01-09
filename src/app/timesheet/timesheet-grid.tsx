"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

interface TimeEntryData {
  id: string;
  duration: number;
  description: string | null;
  billable: boolean;
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
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCellClick = (rowKey: string, dateKey: string, currentDuration: number) => {
    if (!canEdit || isSaving) return;
    const cellKey = `${rowKey}-${dateKey}`;
    setEditingCell(cellKey);
    setEditValue(currentDuration > 0 ? formatDuration(currentDuration) : "");
  };

  const updateRowEntries = (rowKey: string, dateKey: string, newEntry: TimeEntryData | null) => {
    setRows(prevRows => prevRows.map(row => {
      if (row.key !== rowKey) return row;
      
      const newEntries = { ...row.entries };
      if (newEntry) {
        newEntries[dateKey] = [newEntry];
      } else {
        delete newEntries[dateKey];
      }
      
      // Recalculate total
      const total = Object.values(newEntries).reduce((sum, entries) => {
        return sum + entries.reduce((s, e) => s + e.duration, 0);
      }, 0);
      
      return { ...row, entries: newEntries, total };
    }));
  };

  const handleCellSave = async (row: RowData, dateKey: string) => {
    const duration = parseDuration(editValue);
    
    if (editValue && duration === null) {
      alert("Invalid time format. Use h:mm or decimal hours.");
      return;
    }

    const existingEntries = row.entries[dateKey] || [];
    const existingEntry = existingEntries[0];

    // If no change needed, just close
    if (!editValue && !existingEntry) {
      setEditingCell(null);
      setEditValue("");
      return;
    }

    // If same value, just close
    if (existingEntry && duration === existingEntry.duration) {
      setEditingCell(null);
      setEditValue("");
      return;
    }

    setIsSaving(true);

    try {
      if (duration && duration > 0) {
        if (existingEntry) {
          // Update existing entry
          const res = await fetch(`/api/time-entries/${existingEntry.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duration }),
          });
          
          if (res.ok) {
            const data = await res.json();
            updateRowEntries(row.key, dateKey, {
              id: data.timeEntry.id,
              duration: data.timeEntry.duration,
              description: data.timeEntry.description,
              billable: data.timeEntry.billable,
            });
          } else {
            const error = await res.json();
            console.error("Update error:", error);
            alert("Failed to update time entry: " + (error.error || "Unknown error"));
          }
        } else {
          // Create new entry
          const res = await fetch("/api/time-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: row.client.id,
              projectId: row.project.id,
              taskId: row.task.id,
              date: dateKey,
              duration,
              billable: true,
            }),
          });
          
          if (res.ok) {
            const data = await res.json();
            updateRowEntries(row.key, dateKey, {
              id: data.timeEntry.id,
              duration: data.timeEntry.duration,
              description: data.timeEntry.description,
              billable: data.timeEntry.billable,
            });
          } else {
            const error = await res.json();
            console.error("Create error:", error);
            alert("Failed to create time entry: " + (error.error || "Unknown error"));
          }
        }
      } else if (existingEntry && (!editValue || duration === 0)) {
        // Delete entry if cleared
        const res = await fetch(`/api/time-entries/${existingEntry.id}`, {
          method: "DELETE",
        });
        
        if (res.ok) {
          updateRowEntries(row.key, dateKey, null);
        } else {
          const error = await res.json();
          console.error("Delete error:", error);
          alert("Failed to delete time entry: " + (error.error || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Error saving time entry:", error);
      alert("Network error. Please try again.");
    }

    setEditingCell(null);
    setEditValue("");
    setIsSaving(false);
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
                const cellKey = `${row.key}-${dateKey}`;
                const isEditing = editingCell === cellKey;

                return (
                  <div
                    key={i}
                    onClick={() => handleCellClick(row.key, dateKey, dayDuration)}
                    style={{
                      padding: "12px",
                      borderLeft: "1px solid " + theme.colors.borderLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: canEdit && !isSaving ? "pointer" : "default",
                      background: isEditing ? theme.colors.infoBg : "transparent",
                      transition: "background 100ms",
                      opacity: isSaving ? 0.6 : 1,
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellSave(row, dateKey)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(row, dateKey);
                          if (e.key === "Escape") {
                            setEditingCell(null);
                            setEditValue("");
                          }
                        }}
                        placeholder="0:00"
                        disabled={isSaving}
                        style={{
                          width: "100%",
                          maxWidth: 70,
                          padding: "6px 8px",
                          borderRadius: theme.borderRadius.sm,
                          border: "2px solid " + theme.colors.info,
                          fontSize: 14,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    ) : (
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
    </div>
  );
}
