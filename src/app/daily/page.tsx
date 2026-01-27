"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type DailySummary = {
  id: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  completionRate: number;
  mainFocus: string | null;
  status: string;
  sodCompletedAt: string | null;
  eodCompletedAt: string | null;
};

type TaskSuggestion = {
  task: {
    id: string;
    name: string;
    priority: string;
    dueDate: string | null;
    project: { id: string; name: string; isDefault: boolean };
    client: { id: string; name: string };
  };
  source: string;
  score: number;
  reason: string;
};

type DailyTask = {
  id: string;
  completed_at: string | null;
  source: string;
  task: {
    id: string;
    name: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: { id: string; name: string };
    client: { id: string; name: string };
  };
};

export default function DailyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"sod" | "eod">("sod");
  const [today] = useState(new Date().toISOString().split("T")[0]);
  
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [mainFocus, setMainFocus] = useState("");
  const [showStartModal, setShowStartModal] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [summaryRes, suggestionsRes, tasksRes] = await Promise.all([
        fetch(`/api/daily/summary?date=${today}`),
        fetch(`/api/daily/suggestions?date=${today}`),
        fetch(`/api/daily/tasks?date=${today}`),
      ]);

      const summaryData = await summaryRes.json();
      const suggestionsData = await suggestionsRes.json();
      const tasksData = await tasksRes.json();

      setSummary(summaryData);
      setSuggestions(suggestionsData);
      setDailyTasks(tasksData);

      // Auto-determine view based on time
      const hour = new Date().getHours();
      if (hour >= 17 && !summaryData?.eodCompletedAt) {
        setView("eod");
      } else if (!summaryData?.sodCompletedAt) {
        setShowStartModal(true);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load daily data:", error);
      setLoading(false);
    }
  }

  async function handleStartDay() {
    try {
      // Accept all suggestions
      const taskIds = suggestions.slice(0, 8).map(s => s.task.id);
      const sources = suggestions.slice(0, 8).map(s => s.source);

      await fetch("/api/daily/suggestions/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, taskIds, sources }),
      });

      // Update summary with SOD completed and main focus
      await fetch("/api/daily/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          mainFocus: mainFocus || "Daily tasks",
          status: "available",
          sodCompleted: true,
        }),
      });

      setShowStartModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to start day:", error);
    }
  }

  async function handleCompleteTask(dailyTaskId: string, taskId: string, currentStatus: string) {
    try {
      const isCompleting = currentStatus !== "COMPLETED";
      
      // Update the task status
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isCompleting ? "COMPLETED" : "TODO" }),
      });

      // Update the daily task completed_at timestamp
      await fetch(`/api/daily/tasks/${dailyTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: isCompleting }),
      });

      loadData();
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  }

  async function handleEndDay() {
    try {
      await fetch("/api/daily/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          eodCompleted: true,
        }),
      });

      loadData();
    } catch (error) {
      console.error("Failed to end day:", error);
    }
  }

  async function loadAllTasks() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      const tasks = Array.isArray(data) ? data : data.tasks || [];
      
      // Filter incomplete tasks not already in daily plan
      const existingIds = dailyTasks.map(dt => dt.task.id);
      const availableTasks = tasks.filter((t: any) => 
        t.status !== "COMPLETED" && !existingIds.includes(t.id)
      );
      
      setAllTasks(availableTasks);
      setShowAllTasks(true);
    } catch (error) {
      console.error("Failed to load all tasks:", error);
    }
  }

  async function addTaskToToday(taskId: string) {
    try {
      await fetch("/api/daily/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, date: today, source: "manual" }),
      });
      
      loadData();
      
      // Remove from available list
      setAllTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
            Loading your day...
          </div>
        </main>
      </div>
    );
  }

  const hasStarted = summary?.sodCompletedAt;
  const hasEnded = summary?.eodCompletedAt;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
                {view === "sod" ? "🌅 Start of Day" : "🌆 End of Day"}
              </h1>
              <p style={{ fontSize: 14, color: theme.colors.textMuted }}>
                {new Date(today).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setView("sod")}
                style={{
                  padding: "10px 20px",
                  background: view === "sod" ? theme.colors.primary : "transparent",
                  border: `1px solid ${theme.colors.primary}`,
                  borderRadius: theme.borderRadius.md,
                  color: view === "sod" ? "white" : theme.colors.primary,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Morning View
              </button>
              <button
                onClick={() => setView("eod")}
                style={{
                  padding: "10px 20px",
                  background: view === "eod" ? theme.colors.primary : "transparent",
                  border: `1px solid ${theme.colors.primary}`,
                  borderRadius: theme.borderRadius.md,
                  color: view === "eod" ? "white" : theme.colors.primary,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Evening View
              </button>
            </div>
          </div>
        </div>

        {/* SOD View */}
        {view === "sod" && (
          <div>
            {!hasStarted ? (
              <div style={{
                padding: 32,
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: `2px solid ${theme.colors.primary}`,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🌅</div>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
                  Ready to start your day?
                </h2>
                <p style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24 }}>
                  We've prepared {suggestions.length} tasks for you based on your priorities
                </p>
                <button
                  onClick={() => setShowStartModal(true)}
                  style={{
                    padding: "12px 32px",
                    background: theme.colors.primary,
                    border: "none",
                    borderRadius: theme.borderRadius.md,
                    color: "white",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Review & Start Day
                </button>
              </div>
            ) : (
              <div>
                {/* Quick Stats */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                  gap: 16, 
                  marginBottom: 24 
                }}>
                  <div style={{
                    padding: 20,
                    background: theme.colors.bgSecondary,
                    borderRadius: theme.borderRadius.lg,
                    border: "1px solid " + theme.colors.borderLight,
                  }}>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Total Tasks</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                      {summary?.totalTasks || 0}
                    </div>
                  </div>

                  <div style={{
                    padding: 20,
                    background: theme.colors.bgSecondary,
                    borderRadius: theme.borderRadius.lg,
                    border: "1px solid " + theme.colors.borderLight,
                  }}>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Completed</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.success }}>
                      {summary?.completedTasks || 0}
                    </div>
                  </div>

                  <div style={{
                    padding: 20,
                    background: theme.colors.bgSecondary,
                    borderRadius: theme.borderRadius.lg,
                    border: "1px solid " + theme.colors.borderLight,
                  }}>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>Completion Rate</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>
                      {summary?.completionRate || 0}%
                    </div>
                  </div>
                </div>

                {/* Today's Focus */}
                {summary?.mainFocus && (
                  <div style={{
                    padding: 20,
                    background: theme.colors.infoBg,
                    border: `1px solid ${theme.colors.info}`,
                    borderRadius: theme.borderRadius.lg,
                    marginBottom: 24,
                  }}>
                    <div style={{ fontSize: 13, color: theme.colors.info, marginBottom: 4, fontWeight: 500 }}>
                      🎯 Today's Focus
                    </div>
                    <div style={{ fontSize: 16, color: theme.colors.textPrimary, fontWeight: 500 }}>
                      {summary.mainFocus}
                    </div>
                  </div>
                )}

                {/* Task List */}
                <div style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.borderRadius.lg,
                  border: "1px solid " + theme.colors.borderLight,
                  padding: 24,
                  marginBottom: 24,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                      Your Tasks Today ({dailyTasks.length})
                    </h3>
                    {(() => {
                      const dueTaskIds = suggestions.filter(s => s.source === 'due_date').map(s => s.task.id);
                      const existingIds = dailyTasks.map(dt => dt.task.id);
                      const newTaskIds = dueTaskIds.filter(id => !existingIds.includes(id));
                      
                      if (newTaskIds.length > 0) {
                        return (
                          <button
                            onClick={() => {
                              Promise.all(newTaskIds.map(taskId => 
                                fetch("/api/daily/tasks", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ taskId, date: today, source: "due_date" }),
                                })
                              )).then(() => loadData());
                            }}
                            style={{
                              padding: "8px 16px",
                              background: theme.colors.warning,
                              border: "none",
                              borderRadius: theme.borderRadius.md,
                              color: "white",
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            ⚠️ Add {newTaskIds.length} Task{newTaskIds.length > 1 ? 's' : ''} Due Today
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {dailyTasks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
                      No tasks planned for today
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {dailyTasks.map(dt => (
                        <div
                          key={dt.id}
                          style={{
                            padding: 16,
                            background: theme.colors.bgPrimary,
                            borderRadius: theme.borderRadius.md,
                            border: "1px solid " + theme.colors.borderLight,
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={dt.task.status === "COMPLETED"}
                            onChange={() => handleCompleteTask(dt.id, dt.task.id, dt.task.status)}
                            style={{ width: 20, height: 20, cursor: "pointer" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: 14, 
                              fontWeight: 500, 
                              color: dt.task.status === "COMPLETED" ? theme.colors.textMuted : theme.colors.textPrimary,
                              textDecoration: dt.task.status === "COMPLETED" ? "line-through" : "none",
                            }}>
                              {dt.task.name}
                            </div>
                            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
                              {dt.task.client.name} • {dt.task.project.name}
                            </div>
                          </div>
                          {dt.task.priority === "HIGH" && (
                            <span style={{
                              padding: "4px 8px",
                              background: theme.colors.errorBg,
                              color: theme.colors.error,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: 11,
                              fontWeight: 600,
                            }}>
                              HIGH
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Suggestions */}
                {(() => {
                  const existingIds = dailyTasks.map(dt => dt.task.id);
                  const availableSuggestions = suggestions.filter(s => !existingIds.includes(s.task.id));
                  
                  if (availableSuggestions.length > 0) {
                    return (
                      <div style={{
                        background: theme.colors.bgSecondary,
                        borderRadius: theme.borderRadius.lg,
                        border: "1px solid " + theme.colors.borderLight,
                        padding: 24,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                            💡 Suggested Tasks ({availableSuggestions.length})
                          </h3>
                          <button
                            onClick={loadAllTasks}
                            style={{
                              padding: "8px 16px",
                              background: "transparent",
                              border: `1px solid ${theme.colors.primary}`,
                              borderRadius: theme.borderRadius.md,
                              color: theme.colors.primary,
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            📋 Browse All Tasks
                          </button>
                        </div>
                        <div style={{ display: "grid", gap: 12 }}>
                          {availableSuggestions.map(suggestion => (
                            <div
                              key={suggestion.task.id}
                              style={{
                                padding: 16,
                                background: theme.colors.bgPrimary,
                                borderRadius: theme.borderRadius.md,
                                border: "1px solid " + theme.colors.borderLight,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                cursor: "pointer",
                              }}
                              onClick={async () => {
                                await fetch("/api/daily/tasks", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ 
                                    taskId: suggestion.task.id, 
                                    date: today, 
                                    source: suggestion.source 
                                  }),
                                });
                                loadData();
                              }}
                            >
                              <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: `2px solid ${theme.colors.primary}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                color: theme.colors.primary,
                                flexShrink: 0,
                              }}>
                                +
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 4 }}>
                                  {suggestion.task.name}
                                </div>
                                <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                                  {suggestion.reason} • {suggestion.task.client.name} • {suggestion.task.project.name}
                                </div>
                              </div>
                              {suggestion.task.priority === "HIGH" && (
                                <span style={{
                                  padding: "4px 8px",
                                  background: theme.colors.errorBg,
                                  color: theme.colors.error,
                                  borderRadius: theme.borderRadius.sm,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}>
                                  HIGH
                                </span>
                              )}
                              {suggestion.task.dueDate && (
                                <span style={{
                                  padding: "4px 8px",
                                  background: theme.colors.warningBg,
                                  color: theme.colors.warning,
                                  borderRadius: theme.borderRadius.sm,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}>
                                  📅 {new Date(suggestion.task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        )}

        {/* EOD View */}
        {view === "eod" && (
          <div>
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              border: "1px solid " + theme.colors.borderLight,
              padding: 24,
              marginBottom: 24,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: theme.colors.textPrimary }}>
                📊 Today's Progress
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: theme.colors.textMuted }}>Completed</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.success }}>
                    {summary?.completedTasks || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: theme.colors.textMuted }}>In Progress</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.warning }}>
                    {summary?.inProgressTasks || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: theme.colors.textMuted }}>Not Started</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textSecondary }}>
                    {summary?.notStartedTasks || 0}
                  </div>
                </div>
              </div>
              <div style={{
                width: "100%",
                height: 8,
                background: theme.colors.bgTertiary,
                borderRadius: 4,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${summary?.completionRate || 0}%`,
                  height: "100%",
                  background: theme.colors.success,
                  transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 8, textAlign: "center" }}>
                {summary?.completionRate || 0}% Complete
              </div>
            </div>

            {!hasEnded && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={handleEndDay}
                  style={{
                    padding: "12px 32px",
                    background: theme.colors.primary,
                    border: "none",
                    borderRadius: theme.borderRadius.md,
                    color: "white",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Finish Day & Plan Tomorrow
                </button>
              </div>
            )}

            {hasEnded && (
              <div style={{
                padding: 24,
                background: theme.colors.successBg,
                border: `1px solid ${theme.colors.success}`,
                borderRadius: theme.borderRadius.lg,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.success }}>
                  Day Complete! See you tomorrow.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start Day Modal */}
        {showStartModal && (
          <div style={{
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
          }}>
            <div style={{
              background: theme.colors.bgPrimary,
              borderRadius: theme.borderRadius.lg,
              padding: 32,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: theme.colors.textPrimary }}>
                🌅 Start Your Day
              </h2>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8, color: theme.colors.textPrimary }}>
                  What's your main focus today?
                </label>
                <input
                  type="text"
                  value={mainFocus}
                  onChange={(e) => setMainFocus(e.target.value)}
                  placeholder="e.g., Complete Baladna project deliverables"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: theme.colors.textPrimary }}>
                  Suggested Tasks ({suggestions.length})
                </h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {suggestions.slice(0, 8).map((suggestion) => (
                    <div
                      key={suggestion.task.id}
                      style={{
                        padding: 12,
                        background: theme.colors.bgSecondary,
                        borderRadius: theme.borderRadius.md,
                        border: "1px solid " + theme.colors.borderLight,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 4 }}>
                        {suggestion.task.name}
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        {suggestion.reason} • {suggestion.task.client.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleStartDay}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: theme.colors.primary,
                    border: "none",
                    borderRadius: theme.borderRadius.md,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Start Day
                </button>
                <button
                  onClick={() => setShowStartModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "transparent",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.textSecondary,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Tasks Browser Modal */}
        {showAllTasks && (
          <div style={{
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
          }}>
            <div style={{
              background: theme.colors.bgPrimary,
              borderRadius: theme.borderRadius.lg,
              padding: 32,
              maxWidth: 800,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                  📋 All Your Tasks ({allTasks.length})
                </h2>
                <button
                  onClick={() => setShowAllTasks(false)}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.textSecondary,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>

              {allTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
                  All your tasks are already planned for today! 🎉
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {allTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: 16,
                        background: theme.colors.bgSecondary,
                        borderRadius: theme.borderRadius.md,
                        border: "1px solid " + theme.colors.borderLight,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 4 }}>
                          {task.name}
                        </div>
                        <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                          {task.client?.name || "No client"} • {task.project?.name || "No project"}
                          {task.dueDate && ` • Due ${new Date(task.dueDate).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {task.priority === "HIGH" && (
                          <span style={{
                            padding: "4px 8px",
                            background: theme.colors.errorBg,
                            color: theme.colors.error,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            HIGH
                          </span>
                        )}
                        <span style={{
                          padding: "4px 8px",
                          background: theme.colors.bgTertiary,
                          color: theme.colors.textMuted,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: 11,
                          fontWeight: 500,
                        }}>
                          {task.status}
                        </span>
                        <button
                          onClick={() => addTaskToToday(task.id)}
                          style={{
                            padding: "8px 16px",
                            background: theme.colors.primary,
                            border: "none",
                            borderRadius: theme.borderRadius.md,
                            color: "white",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          + Add to Today
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
