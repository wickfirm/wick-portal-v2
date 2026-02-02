"use client";

import { useState, useEffect, useCallback } from "react";
import { theme } from "@/lib/theme";

interface TimerData {
  id: string;
  startedAt: string;
  description: string | null;
  client: { id: string; name: string; nickname: string | null } | null;
  project: { id: string; name: string } | null;
  task: { id: string; name: string } | null;
}

export default function FloatingTimerBubble() {
  const [timer, setTimer] = useState<TimerData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  // Fetch current timer
  const fetchTimer = useCallback(async () => {
    try {
      const res = await fetch("/api/timer");
      const data = await res.json();
      setTimer(data.timer);
    } catch (error) {
      console.error("Error fetching timer:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimer();
    // Poll every 30s to catch timer changes from other tabs/header widget
    const poll = setInterval(fetchTimer, 30000);
    return () => clearInterval(poll);
  }, [fetchTimer]);

  // Update elapsed every second
  useEffect(() => {
    if (!timer) {
      setElapsed(0);
      return;
    }
    const startTime = new Date(timer.startedAt).getTime();
    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Listen for custom events from the header TimerWidget
  useEffect(() => {
    const handleTimerStart = (e: CustomEvent) => {
      setTimer(e.detail);
    };
    const handleTimerStop = () => {
      setTimer(null);
      setExpanded(false);
      setShowStopConfirm(false);
    };
    window.addEventListener("timer-started", handleTimerStart as EventListener);
    window.addEventListener("timer-stopped", handleTimerStop as EventListener);
    return () => {
      window.removeEventListener("timer-started", handleTimerStart as EventListener);
      window.removeEventListener("timer-stopped", handleTimerStop as EventListener);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const stopTimer = async () => {
    setIsStopping(true);
    try {
      const res = await fetch("/api/timer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: timer?.description }),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to stop timer");
        return;
      }
      setTimer(null);
      setExpanded(false);
      setShowStopConfirm(false);
      // Notify other components
      window.dispatchEvent(new CustomEvent("timer-stopped"));
    } catch (error) {
      console.error("Error stopping timer:", error);
      alert("Failed to stop timer");
    } finally {
      setIsStopping(false);
    }
  };

  // Don't render anything if loading or no timer
  if (isLoading || !timer) return null;

  const clientName = timer.client?.nickname || timer.client?.name || "Client";
  const projectName = timer.project?.name || "Project";
  const taskName = timer.task?.name || "Task";

  return (
    <>
      {/* Floating Bubble */}
      <div
        onClick={() => !showStopConfirm && setExpanded(!expanded)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          ...(expanded
            ? {
                width: 320,
                borderRadius: 16,
                padding: "16px 20px",
              }
            : {
                width: "auto",
                borderRadius: 50,
                padding: "10px 18px",
              }),
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          color: "white",
          userSelect: "none" as const,
        }}
      >
        {expanded ? (
          /* Expanded view */
          <div onClick={(e) => e.stopPropagation()}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Pulsing recording dot */}
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ef4444",
                  animation: "timerPulse 1.5s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1, color: "rgba(255,255,255,0.5)" }}>
                  Recording
                </span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: 6,
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                }}
              >
                ×
              </button>
            </div>

            {/* Timer display */}
            <div style={{
              fontFamily: "'DM Mono', 'SF Mono', monospace",
              fontSize: 36,
              fontWeight: 700,
              color: "#4ade80",
              letterSpacing: 1,
              marginBottom: 12,
              lineHeight: 1,
            }}>
              {formatTime(elapsed)}
            </div>

            {/* Task info */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                marginBottom: 2,
                whiteSpace: "nowrap" as const,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {taskName}
              </div>
              <div style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                whiteSpace: "nowrap" as const,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {clientName} · {projectName}
              </div>
            </div>

            {/* Stop button */}
            <button
              onClick={() => setShowStopConfirm(true)}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 10,
                border: "none",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              Stop Timer
            </button>
          </div>
        ) : (
          /* Collapsed pill view */
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Pulsing dot */}
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#4ade80",
              animation: "timerPulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }} />
            {/* Time */}
            <span style={{
              fontFamily: "'DM Mono', 'SF Mono', monospace",
              fontSize: 15,
              fontWeight: 700,
              color: "#4ade80",
              letterSpacing: 0.5,
            }}>
              {formatTime(elapsed)}
            </span>
            {/* Task name (truncated) */}
            <span style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 120,
              whiteSpace: "nowrap" as const,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {taskName}
            </span>
          </div>
        )}
      </div>

      {/* Stop Confirmation Overlay */}
      {showStopConfirm && timer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowStopConfirm(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              width: 400,
              maxWidth: "90%",
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600 }}>
              Stop Timer
            </h3>
            <div style={{
              background: theme.colors.bgTertiary,
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 }}>
                <strong>{clientName}</strong> · {projectName} · {taskName}
              </div>
              <div style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: theme.colors.success,
              }}>
                {formatTime(elapsed)}
              </div>
            </div>
            <p style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 20 }}>
              This will save <strong>{formatTime(elapsed)}</strong> to your timesheet.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowStopConfirm(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: `1px solid ${theme.colors.borderLight}`,
                  background: "white",
                  fontSize: 14,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Continue Working
              </button>
              <button
                onClick={stopTimer}
                disabled={isStopping}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: theme.colors.error,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isStopping ? "not-allowed" : "pointer",
                  opacity: isStopping ? 0.5 : 1,
                }}
              >
                {isStopping ? "Stopping..." : "■ Stop & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animation for pulsing dot */}
      <style jsx global>{`
        @keyframes timerPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </>
  );
}
