"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { theme } from "@/lib/theme";

interface TimerData {
  id: string;
  startedAt: string;
  pausedAt: string | null;
  accumulatedMs: number;
  description: string | null;
  client: { id: string; name: string; nickname: string | null } | null;
  project: { id: string; name: string } | null;
  task: { id: string; name: string } | null;
}

// Check-in interval: 30 minutes in milliseconds
const CHECKIN_INTERVAL = 30 * 60 * 1000;

export default function FloatingTimerBubble() {
  const [timer, setTimer] = useState<TimerData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const originalTitle = useRef<string>("");
  const originalFavicon = useRef<string>("");
  const checkinInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationPermission = useRef<NotificationPermission>("default");
  const faviconAnimFrame = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate a timer favicon using canvas (red = running, amber = paused)
  const generateTimerFavicon = useCallback((pulse: boolean, paused: boolean = false) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Dark background circle
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1a2e";
      ctx.fill();

      if (paused) {
        // Amber pause bars
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(10, 9, 4, 14);
        ctx.fillRect(18, 9, 4, 14);
      } else {
        // Red recording dot (pulsing size)
        const dotRadius = pulse ? 7 : 9;
        ctx.beginPath();
        ctx.arc(16, 16, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();

        // Subtle glow
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }, []);

  // Set favicon
  const setFavicon = useCallback((href: string) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, []);

  // Store original page title and favicon on mount
  useEffect(() => {
    originalTitle.current = document.title;
    // Store original favicon
    const existingFavicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    originalFavicon.current = existingFavicon?.href || "/favicon.ico";
    // Check existing notification permission
    if ("Notification" in window) {
      notificationPermission.current = Notification.permission;
    }
    return () => {
      // Restore title and favicon on unmount
      document.title = originalTitle.current;
      setFavicon(originalFavicon.current);
      if (faviconAnimFrame.current) {
        clearInterval(faviconAnimFrame.current);
      }
    };
  }, [setFavicon]);

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

  // Request browser notification permission when timer starts
  useEffect(() => {
    if (timer && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        notificationPermission.current = permission;
      });
    }
  }, [timer]);

  // Format time helper
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Send browser notification
  const sendBrowserNotification = useCallback((taskName: string, timeStr: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notification = new Notification(`⏱ Timer: ${timeStr}`, {
          body: `Still working on "${taskName}"? Click to check in.`,
          icon: "/favicon.ico",
          tag: "timer-checkin", // Replaces previous notification
          requireInteraction: true, // Stays until dismissed
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-close after 60 seconds
        setTimeout(() => notification.close(), 60000);
      } catch (e) {
        console.log("Browser notification not supported:", e);
      }
    }
  }, []);

  // Send platform notification (bell icon)
  const sendPlatformCheckin = useCallback(async () => {
    try {
      await fetch("/api/timer/checkin", { method: "POST" });
    } catch (error) {
      console.error("Error sending timer check-in:", error);
    }
  }, []);

  // 30-minute check-in: browser notification + platform notification
  useEffect(() => {
    if (!timer) {
      // Clear interval when timer stops
      if (checkinInterval.current) {
        clearInterval(checkinInterval.current);
        checkinInterval.current = null;
      }
      return;
    }

    const taskName = timer.task?.name || "Task";

    // Calculate time until next 30-min mark from timer start
    const startTime = new Date(timer.startedAt).getTime();
    const elapsedMs = Date.now() - startTime;
    const nextCheckinMs = CHECKIN_INTERVAL - (elapsedMs % CHECKIN_INTERVAL);

    // Set first check-in at next 30-min boundary
    const firstTimeout = setTimeout(() => {
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
      const timeStr = formatTime(currentElapsed);
      sendBrowserNotification(taskName, timeStr);
      sendPlatformCheckin();

      // Then repeat every 30 minutes
      checkinInterval.current = setInterval(() => {
        const nowElapsed = Math.floor((Date.now() - startTime) / 1000);
        const nowTimeStr = formatTime(nowElapsed);
        sendBrowserNotification(taskName, nowTimeStr);
        sendPlatformCheckin();
      }, CHECKIN_INTERVAL);
    }, nextCheckinMs);

    return () => {
      clearTimeout(firstTimeout);
      if (checkinInterval.current) {
        clearInterval(checkinInterval.current);
        checkinInterval.current = null;
      }
    };
  }, [timer, sendBrowserNotification, sendPlatformCheckin]);

  // Animated favicon when timer is running (amber when paused)
  useEffect(() => {
    if (!timer) {
      // Restore original favicon
      setFavicon(originalFavicon.current);
      if (faviconAnimFrame.current) {
        clearInterval(faviconAnimFrame.current);
        faviconAnimFrame.current = null;
      }
      return;
    }

    const isPaused = !!timer.pausedAt;

    if (isPaused) {
      // Static amber pause icon
      if (faviconAnimFrame.current) {
        clearInterval(faviconAnimFrame.current);
        faviconAnimFrame.current = null;
      }
      const icon = generateTimerFavicon(false, true);
      if (icon) setFavicon(icon);
    } else {
      // Alternate between pulse states for favicon animation
      let pulseState = false;
      const updateFavicon = () => {
        const icon = generateTimerFavicon(pulseState, false);
        if (icon) setFavicon(icon);
        pulseState = !pulseState;
      };
      updateFavicon();
      faviconAnimFrame.current = setInterval(updateFavicon, 1500);
    }

    return () => {
      if (faviconAnimFrame.current) {
        clearInterval(faviconAnimFrame.current);
        faviconAnimFrame.current = null;
      }
    };
  }, [timer, generateTimerFavicon, setFavicon]);

  // Update elapsed every second + update browser tab title
  useEffect(() => {
    if (!timer) {
      setElapsed(0);
      // Restore original title when timer stops
      document.title = originalTitle.current;
      return;
    }

    const isPaused = !!timer.pausedAt;
    const accMs = timer.accumulatedMs || 0;
    const startTime = new Date(timer.startedAt).getTime();
    const taskName = timer.task?.name || "Task";

    if (isPaused) {
      // When paused, just show accumulated time (frozen)
      const secs = Math.floor(accMs / 1000);
      setElapsed(secs);
      document.title = `⏸ ${formatTime(secs)} — ${taskName} (Paused)`;
      return; // No interval needed
    }

    const updateElapsed = () => {
      const currentSegmentMs = Date.now() - startTime;
      const totalMs = accMs + currentSegmentMs;
      const secs = Math.floor(totalMs / 1000);
      setElapsed(secs);
      // Update browser tab title with timer
      document.title = `⏱ ${formatTime(secs)} — ${taskName}`;
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
      // Restore original title and favicon
      document.title = originalTitle.current;
      setFavicon(originalFavicon.current);
    };
    const handleTimerPaused = (e: CustomEvent) => {
      setTimer(e.detail);
    };
    window.addEventListener("timer-started", handleTimerStart as EventListener);
    window.addEventListener("timer-stopped", handleTimerStop as EventListener);
    window.addEventListener("timer-paused", handleTimerPaused as EventListener);
    return () => {
      window.removeEventListener("timer-started", handleTimerStart as EventListener);
      window.removeEventListener("timer-stopped", handleTimerStop as EventListener);
      window.removeEventListener("timer-paused", handleTimerPaused as EventListener);
    };
  }, []);

  const togglePause = async () => {
    if (!timer) return;
    setIsPausing(true);
    try {
      const res = await fetch("/api/timer", { method: "PATCH" });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to pause/resume timer");
        return;
      }
      const data = await res.json();
      setTimer(data.timer);
      // Notify other components
      window.dispatchEvent(new CustomEvent("timer-paused", { detail: data.timer }));
    } catch (error) {
      console.error("Error pausing/resuming timer:", error);
      alert("Failed to pause/resume timer");
    } finally {
      setIsPausing(false);
    }
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
      // Restore original title and favicon
      document.title = originalTitle.current;
      setFavicon(originalFavicon.current);
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
                {timer.pausedAt ? (
                  <>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1, color: "#f59e0b" }}>
                      Paused
                    </span>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
              color: timer.pausedAt ? "#f59e0b" : "#4ade80",
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

            {/* Pause + Stop buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={togglePause}
                disabled={isPausing}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: timer.pausedAt ? "rgba(74, 222, 128, 0.15)" : "rgba(245, 158, 11, 0.15)",
                  color: timer.pausedAt ? "#4ade80" : "#f59e0b",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPausing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background 0.2s",
                  opacity: isPausing ? 0.5 : 1,
                }}
              >
                {timer.pausedAt ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                    {isPausing ? "..." : "Resume"}
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="3" width="5" height="18" rx="1" />
                      <rect x="15" y="3" width="5" height="18" rx="1" />
                    </svg>
                    {isPausing ? "..." : "Pause"}
                  </>
                )}
              </button>
              <button
                onClick={() => setShowStopConfirm(true)}
                style={{
                  flex: 1,
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
                Stop
              </button>
            </div>
          </div>
        ) : (
          /* Collapsed pill view */
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Pulsing dot or pause indicator */}
            <div style={{
              width: 8,
              height: 8,
              borderRadius: timer?.pausedAt ? 2 : "50%",
              background: timer?.pausedAt ? "#f59e0b" : "#4ade80",
              animation: timer?.pausedAt ? "none" : "timerPulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }} />
            {/* Time */}
            <span style={{
              fontFamily: "'DM Mono', 'SF Mono', monospace",
              fontSize: 15,
              fontWeight: 700,
              color: timer?.pausedAt ? "#f59e0b" : "#4ade80",
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
