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

interface Client {
  id: string;
  name: string;
  nickname: string | null;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

interface Task {
  id: string;
  name: string;
  projectId: string;
  clientId: string;
}

export default function TimerWidget() {
  const [timer, setTimer] = useState<TimerData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  // Form state for starting timer
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [description, setDescription] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Fetch current timer on mount
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
  }, [fetchTimer]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!timer) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(timer.startedAt).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Fetch clients when modal opens
  useEffect(() => {
    if (showModal && clients.length === 0) {
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => {
          // API returns { clients: [...], stats: {...} }
          const clientsArray = data.clients || [];
          setClients(Array.isArray(clientsArray) ? clientsArray : []);
        })
        .catch((err) => {
          console.error("Error fetching clients:", err);
          setClients([]);
        });
    }
  }, [showModal, clients.length]);

  // Fetch projects when client changes
  useEffect(() => {
    if (selectedClient) {
      setSelectedProject("");
      setSelectedTask("");
      setProjects([]);
      setTasks([]);
      
      fetch(`/api/projects?clientId=${selectedClient}`)
        .then((res) => res.json())
        .then((data) => setProjects(Array.isArray(data) ? data : []))
        .catch((err) => {
          console.error("Error fetching projects:", err);
          setProjects([]);
        });
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
        .catch((err) => {
          console.error("Error fetching tasks:", err);
          setTasks([]);
        });
    }
  }, [selectedProject, selectedClient]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startTimer = async () => {
    if (!selectedClient || !selectedProject || !selectedTask) {
      alert("Please select a client, project, and task");
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient,
          projectId: selectedProject,
          taskId: selectedTask,
          description: description || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to start timer");
        return;
      }

      const data = await res.json();
      setTimer(data.timer);
      setShowModal(false);
      setSelectedClient("");
      setSelectedProject("");
      setSelectedTask("");
      setDescription("");
    } catch (error) {
      console.error("Error starting timer:", error);
      alert("Failed to start timer");
    } finally {
      setIsStarting(false);
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
      setShowStopConfirm(false);
    } catch (error) {
      console.error("Error stopping timer:", error);
      alert("Failed to stop timer");
    } finally {
      setIsStopping(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
        <span style={{ fontSize: 13 }}>Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {timer ? (
          <>
            {/* Running timer display */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12,
              background: theme.colors.successBg,
              padding: "8px 16px",
              borderRadius: theme.borderRadius.md,
            }}>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                <span style={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                  {timer.project?.name || "Project"}
                </span>
                <span style={{ margin: "0 4px" }}>→</span>
                <span>{timer.task?.name || "Task"}</span>
              </div>
              <div style={{ 
                fontFamily: "monospace", 
                fontSize: 18, 
                fontWeight: 700, 
                color: theme.colors.success,
                minWidth: 80,
              }}>
                {formatTime(elapsed)}
              </div>
              <button
                onClick={() => setShowStopConfirm(true)}
                style={{
                  background: theme.colors.error,
                  color: "white",
                  border: "none",
                  padding: "6px 16px",
                  borderRadius: theme.borderRadius.sm,
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ■ Stop
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: theme.colors.success,
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: theme.borderRadius.md,
              fontWeight: 500,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ▶ Start Timer
          </button>
        )}
      </div>

      {/* Start Timer Modal */}
      {showModal && (
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
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
            width: 450,
            maxWidth: "90%",
            boxShadow: theme.shadows.lg,
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 600 }}>
              Start Timer
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Client Select */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                  Client *
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: theme.borderRadius.md,
                    border: "1px solid " + theme.colors.borderLight,
                    fontSize: 14,
                    background: theme.colors.bgPrimary,
                  }}
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nickname || client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Select */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                  Project *
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={!selectedClient}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: theme.borderRadius.md,
                    border: "1px solid " + theme.colors.borderLight,
                    fontSize: 14,
                    background: theme.colors.bgPrimary,
                    opacity: selectedClient ? 1 : 0.5,
                  }}
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Select */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                  Task *
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  disabled={!selectedProject}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: theme.borderRadius.md,
                    border: "1px solid " + theme.colors.borderLight,
                    fontSize: 14,
                    background: theme.colors.bgPrimary,
                    opacity: selectedProject ? 1 : 0.5,
                  }}
                >
                  <option value="">Select a task...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
                {selectedProject && tasks.length === 0 && (
                  <p style={{ fontSize: 12, color: theme.colors.warning, marginTop: 6 }}>
                    No tasks found for this project. Create a task first.
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you working on?"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: theme.borderRadius.md,
                    border: "1px solid " + theme.colors.borderLight,
                    fontSize: 14,
                    background: theme.colors.bgPrimary,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  border: "1px solid " + theme.colors.borderLight,
                  background: theme.colors.bgPrimary,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={startTimer}
                disabled={isStarting || !selectedClient || !selectedProject || !selectedTask}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  border: "none",
                  background: theme.colors.success,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: isStarting || !selectedClient || !selectedProject || !selectedTask ? 0.5 : 1,
                }}
              >
                {isStarting ? "Starting..." : "▶ Start Timer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Confirmation Modal */}
      {showStopConfirm && timer && (
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
        }} onClick={() => setShowStopConfirm(false)}>
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
            width: 400,
            maxWidth: "90%",
            boxShadow: theme.shadows.lg,
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 600 }}>
              Stop Timer
            </h2>
            
            <div style={{ 
              background: theme.colors.bgTertiary, 
              padding: 16, 
              borderRadius: theme.borderRadius.md,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 }}>
                <strong>{timer.client?.nickname || timer.client?.name}</strong> → {timer.project?.name} → {timer.task?.name}
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
              This will save a time entry of <strong>{formatTime(elapsed)}</strong> to your timesheet.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowStopConfirm(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  border: "1px solid " + theme.colors.borderLight,
                  background: theme.colors.bgPrimary,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Continue Working
              </button>
              <button
                onClick={stopTimer}
                disabled={isStopping}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  border: "none",
                  background: theme.colors.error,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: isStopping ? 0.5 : 1,
                }}
              >
                {isStopping ? "Stopping..." : "■ Stop & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
