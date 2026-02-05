"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface Task {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: string | null;
  internalNotes: string | null;
  nextSteps: string | null;
  externalLink: string | null;
  externalLinkLabel: string | null;
  internalLink: string | null;
  internalLinkLabel: string | null;
  ownerType: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string } | null;
  client: { id: string; name: string; nickname: string | null } | null;
  project: { id: string; name: string } | null;
  assignee: { id: string; name: string; email: string } | null;
}

interface Comment {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  author: { id: string; name: string; email: string };
  attachments: any[];
  replies: Comment[];
}

interface Activity {
  id: string;
  type: string;
  fieldChanged?: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  user: { id: string; name: string; email: string };
}

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  r2Key?: string;
  createdAt: string;
  uploader: { id: string; name: string };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface Watcher {
  id: string;
  user: { id: string; name: string; email: string };
}

export default function TaskDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"discussion" | "files" | "activity">("discussion");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isWatching, setIsWatching] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [statusOptions, setStatusOptions] = useState<{value: string; label: string; color: string}[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<{value: string; label: string; color: string}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;

  // Fetch task data
  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setEditedTitle(data.name);
      } else {
        console.error("Task not found");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    }
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data || []);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
  };

  const fetchWatchers = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/watchers`);
      if (res.ok) {
        const data = await res.json();
        setWatchers(data || []);
        setIsWatching(data.some((w: Watcher) => w.user.id === user?.id));
      }
    } catch (error) {
      console.error("Error fetching watchers:", error);
    }
  };

  const fetchOptions = async () => {
    try {
      const [statusRes, priorityRes] = await Promise.all([
        fetch("/api/task-statuses"),
        fetch("/api/task-priorities")
      ]);

      if (statusRes.ok) {
        const statuses = await statusRes.json();
        setStatusOptions(statuses.map((s: any) => ({
          value: s.name,
          label: s.name.replace(/_/g, " "),
          color: s.color || "#6b7280"
        })));
      }

      if (priorityRes.ok) {
        const priorities = await priorityRes.json();
        setPriorityOptions(priorities.map((p: any) => ({
          value: p.name,
          label: p.name,
          color: p.color || "#6b7280"
        })));
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (sessionStatus === "authenticated" && taskId) {
      Promise.all([
        fetchTask(),
        fetchComments(),
        fetchActivity(),
        fetchAttachments(),
        fetchTeamMembers(),
        fetchWatchers(),
        fetchOptions(),
      ]).finally(() => setLoading(false));
    }
  }, [sessionStatus, taskId, router, fetchTask]);

  // Update task field
  const updateTask = async (field: string, value: any) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updatedTask = await res.json();
        setTask(updatedTask);
        fetchActivity();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Toggle watch
  const toggleWatch = async () => {
    try {
      const method = isWatching ? "DELETE" : "POST";
      const res = await fetch(`/api/tasks/${taskId}/watchers`, { method });
      if (res.ok) {
        setIsWatching(!isWatching);
        fetchWatchers();
      }
    } catch (error) {
      console.error("Error toggling watch:", error);
    }
  };

  // Submit comment
  const submitComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);

    try {
      // Extract mentions from the comment
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[2]);
      }

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          mentions
        }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
        fetchActivity();
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
    setSubmittingComment(false);
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchComments();
        fetchActivity();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingFile(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/tasks/${taskId}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          fetchAttachments();
          fetchActivity();
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
    setUploadingFile(false);
    setIsDragging(false);
  };

  // Delete attachment
  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm("Remove this file?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAttachments();
        fetchActivity();
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  // Handle mention
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setNewComment(value);
    setMentionCursorPos(cursorPos);

    // Check for @ trigger
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const afterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Show dropdown if no space after @ and it's at the end or followed by the search
      if (!afterAt.includes(" ") && afterAt.length < 20) {
        setMentionSearch(afterAt.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (member: TeamMember) => {
    const textBeforeCursor = newComment.slice(0, mentionCursorPos);
    const textAfterCursor = newComment.slice(mentionCursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    const newText = textBeforeCursor.slice(0, lastAtIndex) +
                    `@[${member.name}](${member.id}) ` +
                    textAfterCursor;

    setNewComment(newText);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(mentionSearch) ||
    m.email.toLowerCase().includes(mentionSearch)
  );

  // Format helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusColor = (status: string) => {
    const opt = statusOptions.find(s => s.value === status);
    return opt?.color || theme.colors.textMuted;
  };

  const getPriorityColor = (priority: string) => {
    const opt = priorityOptions.find(p => p.value === priority);
    return opt?.color || theme.colors.textMuted;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
    if (mimeType.includes("video")) return "🎬";
    if (mimeType.includes("audio")) return "🎵";
    if (mimeType.includes("zip") || mimeType.includes("archive")) return "📦";
    return "📎";
  };

  // Render comment content with mentions highlighted
  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (mentionMatch) {
        return (
          <span
            key={i}
            style={{
              color: theme.colors.primary,
              fontWeight: 500,
              background: theme.colors.primaryBg,
              padding: "1px 4px",
              borderRadius: 4,
            }}
          >
            @{mentionMatch[1]}
          </span>
        );
      }
      return part;
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  // Loading state
  if (sessionStatus === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
          <div style={{
            textAlign: "center",
            padding: 60,
            color: theme.colors.textSecondary
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: `3px solid ${theme.colors.borderLight}`,
              borderTopColor: theme.colors.primary,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }} />
            Loading task...
          </div>
        </main>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
          <div style={{
            textAlign: "center",
            padding: 80,
            background: theme.colors.bgSecondary,
            borderRadius: 16,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ color: theme.colors.textPrimary, margin: "0 0 8px" }}>Task not found</h2>
            <p style={{ color: theme.colors.textSecondary, margin: "0 0 24px" }}>
              This task may have been deleted or you don't have access to it.
            </p>
            <Link
              href="/tasks"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: theme.colors.primary,
                color: "white",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              ← Back to Tasks
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isCompleted = task.status === "COMPLETED" || task.status === "DONE";

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 24px 80px" }}>
        {/* Breadcrumb */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          fontSize: 14,
        }}>
          <Link
            href="/tasks"
            style={{
              color: theme.colors.primary,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Tasks
          </Link>
          {task.client && (
            <>
              <span style={{ color: theme.colors.textMuted }}>/</span>
              <Link
                href={`/clients/${task.client.id}`}
                style={{ color: theme.colors.textSecondary, textDecoration: "none" }}
              >
                {task.client.nickname || task.client.name}
              </Link>
            </>
          )}
          {task.project && (
            <>
              <span style={{ color: theme.colors.textMuted }}>/</span>
              <Link
                href={`/projects/${task.project.id}`}
                style={{ color: theme.colors.textSecondary, textDecoration: "none" }}
              >
                {task.project.name}
              </Link>
            </>
          )}
        </div>

        {/* Task Header Card */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 16,
          border: `1px solid ${theme.colors.borderLight}`,
          marginBottom: 24,
          overflow: "hidden",
        }}>
          {/* Completion Banner */}
          {isCompleted && (
            <div style={{
              background: `linear-gradient(135deg, ${theme.colors.success}15, ${theme.colors.success}08)`,
              padding: "12px 24px",
              borderBottom: `1px solid ${theme.colors.success}30`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: theme.colors.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span style={{ color: theme.colors.success, fontWeight: 600 }}>
                Task Completed
              </span>
            </div>
          )}

          <div style={{ padding: 24 }}>
            {/* Title Row */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              {/* Completion checkbox */}
              <button
                onClick={() => updateTask("status", isCompleted ? "TODO" : "COMPLETED")}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: `2px solid ${isCompleted ? theme.colors.success : theme.colors.borderLight}`,
                  background: isCompleted ? theme.colors.success : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 4,
                  transition: "all 0.15s ease",
                }}
              >
                {isCompleted && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              {/* Title */}
              <div style={{ flex: 1 }}>
                {editingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={() => {
                      if (editedTitle.trim() && editedTitle !== task.name) {
                        updateTask("name", editedTitle.trim());
                      }
                      setEditingTitle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      } else if (e.key === "Escape") {
                        setEditedTitle(task.name);
                        setEditingTitle(false);
                      }
                    }}
                    style={{
                      width: "100%",
                      fontSize: 24,
                      fontWeight: 600,
                      border: `2px solid ${theme.colors.primary}`,
                      borderRadius: 8,
                      padding: "8px 12px",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    autoFocus
                  />
                ) : (
                  <h1
                    onClick={() => {
                      setEditingTitle(true);
                      setEditedTitle(task.name);
                    }}
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color: isCompleted ? theme.colors.textMuted : theme.colors.textPrimary,
                      textDecoration: isCompleted ? "line-through" : "none",
                      margin: 0,
                      cursor: "pointer",
                      padding: "8px 0",
                    }}
                  >
                    {task.name}
                  </h1>
                )}

                {/* Meta row */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}>
                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: getStatusColor(task.status),
                    }} />
                    <select
                      value={task.status}
                      onChange={(e) => updateTask("status", e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: theme.colors.textSecondary,
                        fontSize: 14,
                        cursor: "pointer",
                        outline: "none",
                        fontWeight: 500,
                      }}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    background: `${getPriorityColor(task.priority)}20`,
                    color: getPriorityColor(task.priority),
                  }}>
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask("priority", e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "inherit",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {priorityOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  {task.category && (
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      background: theme.colors.bgTertiary,
                      color: theme.colors.textSecondary,
                    }}>
                      {task.category.name}
                    </span>
                  )}

                  {/* Due Date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <input
                      type="date"
                      value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                      onChange={(e) => updateTask("dueDate", e.target.value || null)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: task.dueDate ? theme.colors.textSecondary : theme.colors.textMuted,
                        fontSize: 14,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={toggleWatch}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: isWatching ? theme.colors.primaryBg : theme.colors.bgTertiary,
                    color: isWatching ? theme.colors.primary : theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isWatching ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {isWatching ? "Watching" : "Watch"}
                </button>

                <button
                  onClick={() => updateTask("pinned", !task.pinned)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: task.pinned ? theme.colors.warningBg : theme.colors.bgTertiary,
                    color: task.pinned ? theme.colors.warning : theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={task.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {task.pinned ? "Pinned" : "Pin"}
                </button>
              </div>
            </div>

            {/* Assignee & Responsibility Row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "16px 0",
              borderTop: `1px solid ${theme.colors.borderLight}`,
            }}>
              {/* Assignee */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>Assigned to</span>
                <div style={{ position: "relative" }}>
                  <select
                    value={task.assignee?.id || ""}
                    onChange={(e) => updateTask("assigneeId", e.target.value || null)}
                    style={{
                      padding: "6px 28px 6px 10px",
                      background: theme.colors.bgTertiary,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      color: task.assignee ? theme.colors.textPrimary : theme.colors.textMuted,
                      cursor: "pointer",
                      outline: "none",
                      appearance: "none",
                    }}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.colors.textMuted}
                    strokeWidth="2"
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Responsibility */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>Responsibility</span>
                <select
                  value={task.ownerType}
                  onChange={(e) => updateTask("ownerType", e.target.value)}
                  style={{
                    padding: "6px 12px",
                    background: task.ownerType === "CLIENT" ? theme.colors.warningBg : theme.colors.infoBg,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: task.ownerType === "CLIENT" ? "#92400E" : theme.colors.info,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="AGENCY">Agency</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>

              {/* Watchers */}
              {watchers.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                  <span style={{ fontSize: 13, color: theme.colors.textMuted }}>Watchers:</span>
                  <div style={{ display: "flex", marginLeft: 4 }}>
                    {watchers.slice(0, 5).map((w, i) => (
                      <div
                        key={w.id}
                        title={w.user.name}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 600,
                          marginLeft: i > 0 ? -8 : 0,
                          border: `2px solid ${theme.colors.bgSecondary}`,
                        }}
                      >
                        {getInitials(w.user.name)}
                      </div>
                    ))}
                    {watchers.length > 5 && (
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: theme.colors.bgTertiary,
                        color: theme.colors.textSecondary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 600,
                        marginLeft: -8,
                        border: `2px solid ${theme.colors.bgSecondary}`,
                      }}>
                        +{watchers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: theme.colors.bgSecondary,
          padding: 4,
          borderRadius: 12,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          {[
            { key: "discussion", label: "Discussion", count: comments.length },
            { key: "files", label: "Files", count: attachments.length },
            { key: "activity", label: "Activity", count: activities.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                padding: "12px 20px",
                background: activeTab === tab.key ? theme.colors.bgPrimary : "transparent",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: activeTab === tab.key ? theme.colors.textPrimary : theme.colors.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: activeTab === tab.key ? theme.shadows.sm : "none",
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 10,
                background: activeTab === tab.key ? theme.colors.primaryBg : theme.colors.bgTertiary,
                color: activeTab === tab.key ? theme.colors.primary : theme.colors.textMuted,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 16,
          border: `1px solid ${theme.colors.borderLight}`,
          overflow: "hidden",
        }}>
          {/* Discussion Tab */}
          {activeTab === "discussion" && (
            <div style={{ padding: 24 }}>
              {/* Comment Input */}
              <div style={{ marginBottom: 24, position: "relative" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    flexShrink: 0,
                  }}>
                    {user?.name ? getInitials(user.name) : "U"}
                  </div>
                  <div style={{ flex: 1, position: "relative" }}>
                    <textarea
                      ref={commentInputRef}
                      value={newComment}
                      onChange={handleCommentChange}
                      placeholder="Add a comment... Type @ to mention someone"
                      rows={3}
                      style={{
                        width: "100%",
                        border: `1px solid ${theme.colors.borderLight}`,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 14,
                        resize: "none",
                        outline: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme.colors.primary;
                        e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme.colors.borderLight;
                        e.target.style.boxShadow = "none";
                      }}
                    />

                    {/* Mentions Dropdown */}
                    {showMentions && filteredMembers.length > 0 && (
                      <div style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        marginBottom: 4,
                        background: theme.colors.bgSecondary,
                        border: `1px solid ${theme.colors.borderLight}`,
                        borderRadius: 12,
                        boxShadow: theme.shadows.lg,
                        maxHeight: 240,
                        overflowY: "auto",
                        zIndex: 100,
                        minWidth: 280,
                      }}>
                        <div style={{
                          padding: "8px 12px",
                          borderBottom: `1px solid ${theme.colors.borderLight}`,
                          fontSize: 12,
                          fontWeight: 600,
                          color: theme.colors.textMuted,
                          textTransform: "uppercase",
                        }}>
                          Team Members
                        </div>
                        {filteredMembers.slice(0, 6).map((member) => (
                          <button
                            key={member.id}
                            onClick={() => insertMention(member)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              width: "100%",
                              padding: "10px 14px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              transition: "background 0.1s ease",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.bgTertiary}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 600,
                            }}>
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                                {member.email}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <span style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        Pro tip: Use @ to notify teammates
                      </span>
                      <button
                        onClick={submitComment}
                        disabled={!newComment.trim() || submittingComment}
                        style={{
                          padding: "10px 20px",
                          background: newComment.trim() ? theme.colors.primary : theme.colors.bgTertiary,
                          color: newComment.trim() ? "white" : theme.colors.textMuted,
                          border: "none",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: newComment.trim() ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {submittingComment ? "Posting..." : "Post Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {comments.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: "center",
                  color: theme.colors.textMuted,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                  <p style={{ margin: 0, fontSize: 15 }}>No comments yet. Start the conversation!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {comments.map((comment) => (
                    <div key={comment.id} style={{ display: "flex", gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 14,
                        flexShrink: 0,
                      }}>
                        {getInitials(comment.author.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>
                            {comment.author.name}
                          </span>
                          <span style={{ fontSize: 12, color: theme.colors.textMuted }}>
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                          {comment.isEdited && (
                            <span style={{ fontSize: 11, color: theme.colors.textMuted }}>(edited)</span>
                          )}
                          {comment.author.id === user?.id && (
                            <button
                              onClick={() => deleteComment(comment.id)}
                              style={{
                                marginLeft: "auto",
                                background: "none",
                                border: "none",
                                color: theme.colors.textMuted,
                                cursor: "pointer",
                                padding: 4,
                                borderRadius: 4,
                              }}
                              title="Delete comment"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: theme.colors.textPrimary,
                          lineHeight: 1.6,
                          background: theme.colors.bgTertiary,
                          padding: 14,
                          borderRadius: 12,
                          borderTopLeftRadius: 4,
                        }}>
                          {renderCommentContent(comment.content)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <div style={{ padding: 24 }}>
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? theme.colors.primary : theme.colors.borderLight}`,
                  borderRadius: 12,
                  padding: 40,
                  textAlign: "center",
                  marginBottom: 24,
                  background: isDragging ? theme.colors.primaryBg : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  style={{ display: "none" }}
                />
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  {uploadingFile ? "⏳" : "📎"}
                </div>
                <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: 15 }}>
                  {uploadingFile ? "Uploading..." : "Drop files here or click to upload"}
                </p>
              </div>

              {/* Files List */}
              {attachments.length === 0 ? (
                <div style={{
                  padding: 20,
                  textAlign: "center",
                  color: theme.colors.textMuted,
                }}>
                  No files attached yet
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        padding: 16,
                        background: theme.colors.bgTertiary,
                        borderRadius: 12,
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={() => deleteAttachment(att.id)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: 4,
                          cursor: "pointer",
                          boxShadow: theme.shadows.sm,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>
                        {getFileIcon(att.mimeType)}
                      </div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: theme.colors.textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: 4,
                      }}>
                        {att.originalName}
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        {formatFileSize(att.size)} • {att.uploader.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div style={{ padding: 24 }}>
              {activities.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: "center",
                  color: theme.colors.textMuted,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <p style={{ margin: 0 }}>No activity recorded yet</p>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  {/* Timeline line */}
                  <div style={{
                    position: "absolute",
                    left: 19,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: theme.colors.borderLight,
                  }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {activities.map((activity) => (
                      <div key={activity.id} style={{ display: "flex", gap: 16, position: "relative" }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: theme.colors.bgSecondary,
                          border: `2px solid ${theme.colors.borderLight}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          zIndex: 1,
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, paddingTop: 8 }}>
                          <div style={{ fontSize: 14, color: theme.colors.textPrimary }}>
                            <strong>{activity.user.name}</strong>
                            {" "}
                            {activity.fieldChanged === "status" ? (
                              <>changed status to <span style={{ fontWeight: 500, color: getStatusColor(activity.newValue || "") }}>{activity.newValue}</span></>
                            ) : activity.fieldChanged === "priority" ? (
                              <>changed priority to <span style={{ fontWeight: 500, color: getPriorityColor(activity.newValue || "") }}>{activity.newValue}</span></>
                            ) : activity.fieldChanged === "assigneeId" ? (
                              <>{activity.newValue ? "assigned this task" : "unassigned this task"}</>
                            ) : activity.fieldChanged === "name" ? (
                              <>renamed task to "{activity.newValue}"</>
                            ) : activity.fieldChanged === "dueDate" ? (
                              <>{activity.newValue ? `set due date to ${formatDate(activity.newValue)}` : "removed due date"}</>
                            ) : activity.type === "comment_added" ? (
                              <>added a comment</>
                            ) : activity.type === "attachment_added" ? (
                              <>attached a file</>
                            ) : (
                              <>made changes</>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Internal Notes Section */}
        <div style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}>
          {/* Internal Notes */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 16,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: 20,
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.colors.textPrimary,
              margin: "0 0 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Internal Notes
            </h3>
            <textarea
              value={task.internalNotes || ""}
              onChange={(e) => updateTask("internalNotes", e.target.value)}
              placeholder="Add internal notes..."
              rows={4}
              style={{
                width: "100%",
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Next Steps */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 16,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: 20,
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.colors.textPrimary,
              margin: "0 0 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              Next Steps
            </h3>
            <textarea
              value={task.nextSteps || ""}
              onChange={(e) => updateTask("nextSteps", e.target.value)}
              placeholder="What needs to happen next..."
              rows={4}
              style={{
                width: "100%",
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
