"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { theme } from "@/lib/theme";

type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: string | null;
  category: { name: string } | null;
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#FEF3C7", color: "#92400E" },
  TODO: { bg: "#DBEAFE", color: "#1E40AF" },
  IN_PROGRESS: { bg: "#E0E7FF", color: "#3730A3" },
  ONGOING: { bg: "#E0E7FF", color: "#3730A3" },
  IN_REVIEW: { bg: "#F3E8FF", color: "#6B21A8" },
  COMPLETED: { bg: "#D1FAE5", color: "#065F46" },
  ON_HOLD: { bg: "#F3F4F6", color: "#374151" },
  BLOCKED: { bg: "#FEE2E2", color: "#991B1B" },
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: "#FEE2E2", color: "#991B1B" },
  MEDIUM: { bg: "#FEF3C7", color: "#92400E" },
  LOW: { bg: "#D1FAE5", color: "#065F46" },
};

export default function ProjectTasks({
  projectId,
  clientId,
  initialTasks,
}: {
  projectId: string;
  clientId: string;
  initialTasks: Task[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskName, setNewTaskName] = useState("");
  const [adding, setAdding] = useState(false);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    setAdding(true);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTaskName,
        clientId,
        projectId,
      }),
    });

    if (res.ok) {
      const task = await res.json();
      setTasks([...tasks, task]);
      setNewTaskName("");
      router.refresh();
    }
    setAdding(false);
  }

  async function toggleComplete(task: Task) {
    const newStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    const res = await fetch("/api/tasks/" + task.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      router.refresh();
    }
  }

  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");

  return (
    <div style={{ 
      background: theme.colors.bgSecondary, 
      borderRadius: theme.borderRadius.lg, 
      border: "1px solid " + theme.colors.borderLight,
      overflow: "hidden",
      marginBottom: 24
    }}>
      {/* Header */}
      <div style={{ 
        padding: "16px 20px", 
        borderBottom: "1px solid " + theme.colors.borderLight,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary }}>
          Project Tasks
        </h3>
        <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>
          {pendingTasks.length} pending
        </span>
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} style={{ padding: "12px 20px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", gap: 8 }}>
        <input
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          placeholder="Add a task..."
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid " + theme.colors.borderMedium,
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={adding || !newTaskName.trim()}
          style={{
            padding: "10px 20px",
            background: adding || !newTaskName.trim() ? theme.colors.bgTertiary : theme.colors.primary,
            color: adding || !newTaskName.trim() ? theme.colors.textMuted : "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            cursor: adding || !newTaskName.trim() ? "not-allowed" : "pointer",
          }}
        >
          {adding ? "..." : "Add"}
        </button>
      </form>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: theme.colors.textMuted, fontSize: 14 }}>
          No tasks yet. Add one above!
        </div>
      ) : (
        <div>
          {/* Pending Tasks */}
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid " + theme.colors.bgTertiary,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                onClick={() => toggleComplete(task)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: "2px solid " + theme.colors.borderMedium,
                  background: "white",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <Link
                  href={"/clients/" + clientId + "/tasks"}
                  style={{
                    fontWeight: 500,
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                    textDecoration: "none",
                  }}
                >
                  {task.name}
                </Link>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    background: STATUS_COLORS[task.status]?.bg || "#F3F4F6",
                    color: STATUS_COLORS[task.status]?.color || "#374151",
                  }}>
                    {task.status.replace("_", " ")}
                  </span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    background: PRIORITY_COLORS[task.priority]?.bg || "#F3F4F6",
                    color: PRIORITY_COLORS[task.priority]?.color || "#374151",
                  }}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Completed Tasks (collapsed) */}
          {completedTasks.length > 0 && (
            <div style={{ padding: "12px 20px", background: theme.colors.bgTertiary }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: theme.colors.textMuted, marginBottom: 8 }}>
                Completed ({completedTasks.length})
              </div>
              {completedTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                  }}
                >
                  <button
                    onClick={() => toggleComplete(task)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: "none",
                      background: theme.colors.success,
                      color: "white",
                      fontSize: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✓
                  </button>
                  <span style={{
                    fontSize: 13,
                    color: theme.colors.textMuted,
                    textDecoration: "line-through",
                  }}>
                    {task.name}
                  </span>
                </div>
              ))}
              {completedTasks.length > 3 && (
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                  +{completedTasks.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* View All Link */}
      {tasks.length > 0 && (
        <div style={{ padding: "12px 20px", borderTop: "1px solid " + theme.colors.borderLight }}>
          <Link
            href={"/clients/" + clientId + "/tasks"}
            style={{
              fontSize: 13,
              color: theme.colors.primary,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            View all tasks →
          </Link>
        </div>
      )}
    </div>
  );
}
