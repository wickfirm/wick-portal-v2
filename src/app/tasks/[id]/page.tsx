"use client";

import { useState, useEffect, useRef } from "react";
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
  createdAt: string;
  uploader: { id: string; name: string };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

const statusOptions = [
  { value: "TODO", label: "To Do", color: "#6b7280" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#3b82f6" },
  { value: "IN_REVIEW", label: "In Review", color: "#8b5cf6" },
  { value: "BLOCKED", label: "Blocked", color: "#ef4444" },
  { value: "COMPLETED", label: "Completed", color: "#22c55e" },
];

const priorityOptions = [
  { value: "LOW", label: "Low", color: "#22c55e" },
  { value: "MEDIUM", label: "Medium", color: "#f59e0b" },
  { value: "HIGH", label: "High", color: "#ef4444" },
  { value: "URGENT", label: "Urgent", color: "#dc2626" },
];

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (taskId && session) {
      fetchTask();
      fetchComments();
      fetchActivity();
      fetchAttachments();
      fetchTeamMembers();
      checkWatchStatus();
    }
  }, [taskId, session]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    } finally {
      setLoading(false);
    }
  };

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
        setActivities(data.activities);
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
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
  };

  const checkWatchStatus = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/watchers`);
      if (res.ok) {
        const data = await res.json();
        setIsWatching(data.isWatching);
      }
    } catch (error) {
      console.error("Error checking watch status:", error);
    }
  };

  const updateTask = async (field: string, value: any) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
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
    setEditingField(null);
  };

  const toggleWatch = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/watchers`, {
        method: "POST",
      });
      if (res.ok) {
        setIsWatching(!isWatching);
      }
    } catch (error) {
      console.error("Error toggling watch:", error);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);

    // Extract mentions from comment
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[2]);
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          mentions,
        }),
      });
      if (res.ok) {
        setNewComment("");
        fetchComments();
        fetchActivity();
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm("Remove this attachment?")) return;
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

  const insertMention = (member: TeamMember) => {
    const mention = `@[${member.name}](${member.id}) `;
    setNewComment(prev => prev.replace(/@\w*$/, "") + mention);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ trigger
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      if (!afterAt.includes(" ") && afterAt.length < 20) {
        setMentionSearch(afterAt.toLowerCase());
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

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
    return statusOptions.find(s => s.value === status)?.color || "#6b7280";
  };

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || "#6b7280";
  };

  const formatActivityMessage = (activity: Activity) => {
    const { type, oldValue, newValue, user: actUser } = activity;
    switch (type) {
      case "status":
        return <><strong>{actUser.name}</strong> changed status from <span style={{ color: getStatusColor(oldValue || "") }}>{oldValue}</span> to <span style={{ color: getStatusColor(newValue || "") }}>{newValue}</span></>;
      case "priority":
        return <><strong>{actUser.name}</strong> changed priority to <span style={{ color: getPriorityColor(newValue || "") }}>{newValue}</span></>;
      case "assignee":
        return <><strong>{actUser.name}</strong> {newValue ? "assigned this task" : "unassigned this task"}</>;
      case "comment_added":
        return <><strong>{actUser.name}</strong> added a comment</>;
      case "attachment_added":
        return <><strong>{actUser.name}</strong> attached <em>{newValue}</em></>;
      case "attachment_removed":
        return <><strong>{actUser.name}</strong> removed <em>{oldValue}</em></>;
      default:
        return <><strong>{actUser.name}</strong> made changes</>;
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          <div style={{ textAlign: "center", padding: 60, color: theme.colors.textSecondary }}>
            Loading task...
          </div>
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          <div style={{ textAlign: "center", padding: 60, color: theme.colors.textSecondary }}>
            Task not found
          </div>
        </main>
      </div>
    );
  }

  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(mentionSearch) ||
    m.email.toLowerCase().includes(mentionSearch)
  );

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/tasks" style={{ color: theme.colors.primary, textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Tasks
          </Link>
          {task.client && (
            <>
              <span style={{ color: theme.colors.textMuted }}>/</span>
              <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{task.client.nickname || task.client.name}</span>
            </>
          )}
          {task.project && (
            <>
              <span style={{ color: theme.colors.textMuted }}>/</span>
              <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{task.project.name}</span>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          {/* Main Content */}
          <div>
            {/* Task Header */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 24,
              marginBottom: 20,
            }}>
              {/* Title */}
              {editingField === "name" ? (
                <input
                  autoFocus
                  defaultValue={task.name}
                  onBlur={(e) => updateTask("name", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateTask("name", (e.target as HTMLInputElement).value);
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    width: "100%",
                    border: `2px solid ${theme.colors.primary}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    outline: "none",
                  }}
                />
              ) : (
                <h1
                  onClick={() => setEditingField("name")}
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    margin: 0,
                    cursor: "pointer",
                    padding: "4px 0",
                  }}
                >
                  {task.name}
                </h1>
              )}

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  onClick={toggleWatch}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: isWatching ? theme.colors.primaryBg : "transparent",
                    color: isWatching ? theme.colors.primary : theme.colors.textSecondary,
                    border: `1px solid ${isWatching ? theme.colors.primary : theme.colors.borderLight}`,
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
                    background: task.pinned ? "#fef3c7" : "transparent",
                    color: task.pinned ? "#d97706" : theme.colors.textSecondary,
                    border: `1px solid ${task.pinned ? "#d97706" : theme.colors.borderLight}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={task.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                  </svg>
                  {task.pinned ? "Pinned" : "Pin"}
                </button>
              </div>
            </div>

            {/* Description / Notes */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 20,
              marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, margin: "0 0 12px" }}>Internal Notes</h3>
              {editingField === "notes" ? (
                <textarea
                  autoFocus
                  defaultValue={task.internalNotes || ""}
                  onBlur={(e) => updateTask("notes", e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    border: `2px solid ${theme.colors.primary}`,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <div
                  onClick={() => setEditingField("notes")}
                  style={{
                    padding: 12,
                    background: theme.colors.bgTertiary,
                    borderRadius: 8,
                    minHeight: 80,
                    cursor: "pointer",
                    fontSize: 14,
                    color: task.internalNotes ? theme.colors.textPrimary : theme.colors.textMuted,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {task.internalNotes || "Click to add notes..."}
                </div>
              )}

              <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, margin: "20px 0 12px" }}>Next Steps</h3>
              {editingField === "nextSteps" ? (
                <textarea
                  autoFocus
                  defaultValue={task.nextSteps || ""}
                  onBlur={(e) => updateTask("nextSteps", e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    border: `2px solid ${theme.colors.primary}`,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <div
                  onClick={() => setEditingField("nextSteps")}
                  style={{
                    padding: 12,
                    background: theme.colors.bgTertiary,
                    borderRadius: 8,
                    minHeight: 60,
                    cursor: "pointer",
                    fontSize: 14,
                    color: task.nextSteps ? theme.colors.textPrimary : theme.colors.textMuted,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {task.nextSteps || "Click to add next steps..."}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 20,
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                  Attachments ({attachments.length})
                </h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    background: theme.colors.primaryBg,
                    color: theme.colors.primary,
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  Attach File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </div>

              {attachments.length === 0 ? (
                <div style={{
                  padding: 30,
                  textAlign: "center",
                  color: theme.colors.textMuted,
                  fontSize: 14,
                  background: theme.colors.bgTertiary,
                  borderRadius: 8,
                }}>
                  No attachments yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: theme.colors.bgTertiary,
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textSecondary} strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>{att.originalName}</div>
                          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{formatFileSize(att.size)} • {att.uploader.name}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAttachment(att.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 4,
                          cursor: "pointer",
                          color: theme.colors.textMuted,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments & Activity Tabs */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              overflow: "hidden",
            }}>
              {/* Tabs */}
              <div style={{
                display: "flex",
                borderBottom: `1px solid ${theme.colors.borderLight}`,
              }}>
                <button
                  onClick={() => setActiveTab("comments")}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    background: activeTab === "comments" ? theme.colors.bgSecondary : theme.colors.bgTertiary,
                    border: "none",
                    borderBottom: activeTab === "comments" ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
                    fontSize: 14,
                    fontWeight: 500,
                    color: activeTab === "comments" ? theme.colors.primary : theme.colors.textSecondary,
                    cursor: "pointer",
                  }}
                >
                  Comments ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    background: activeTab === "activity" ? theme.colors.bgSecondary : theme.colors.bgTertiary,
                    border: "none",
                    borderBottom: activeTab === "activity" ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
                    fontSize: 14,
                    fontWeight: 500,
                    color: activeTab === "activity" ? theme.colors.primary : theme.colors.textSecondary,
                    cursor: "pointer",
                  }}
                >
                  Activity ({activities.length})
                </button>
              </div>

              <div style={{ padding: 20 }}>
                {activeTab === "comments" ? (
                  <>
                    {/* Comment Input */}
                    <div style={{ marginBottom: 20, position: "relative" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{
                          width: 36,
                          height: 36,
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
                          {user?.name?.charAt(0) || "U"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <textarea
                            ref={commentInputRef}
                            value={newComment}
                            onChange={handleCommentChange}
                            placeholder="Write a comment... Use @ to mention someone"
                            rows={3}
                            style={{
                              width: "100%",
                              border: `1px solid ${theme.colors.borderLight}`,
                              borderRadius: 10,
                              padding: 12,
                              fontSize: 14,
                              resize: "none",
                              outline: "none",
                              fontFamily: "inherit",
                            }}
                            onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                            onBlur={(e) => e.target.style.borderColor = theme.colors.borderLight}
                          />

                          {/* Mentions Dropdown */}
                          {showMentions && filteredMembers.length > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "100%",
                              left: 48,
                              background: theme.colors.bgSecondary,
                              border: `1px solid ${theme.colors.borderLight}`,
                              borderRadius: 8,
                              boxShadow: theme.shadows.lg,
                              maxHeight: 200,
                              overflowY: "auto",
                              zIndex: 50,
                              minWidth: 200,
                            }}>
                              {filteredMembers.slice(0, 5).map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() => insertMention(member)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    width: "100%",
                                    padding: "10px 14px",
                                    background: "none",
                                    border: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.bgTertiary}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                  <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    background: theme.colors.primary,
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}>
                                    {member.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>{member.name}</div>
                                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{member.email}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                            <button
                              onClick={submitComment}
                              disabled={!newComment.trim() || submittingComment}
                              style={{
                                padding: "8px 16px",
                                background: theme.colors.primary,
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: newComment.trim() ? "pointer" : "not-allowed",
                                opacity: newComment.trim() ? 1 : 0.5,
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
                        fontSize: 14,
                      }}>
                        No comments yet. Start the conversation!
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {comments.map((comment) => (
                          <div key={comment.id} style={{ display: "flex", gap: 12 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: theme.colors.primary,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                              fontSize: 14,
                              flexShrink: 0,
                            }}>
                              {comment.author.name.charAt(0)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary }}>{comment.author.name}</span>
                                <span style={{ fontSize: 12, color: theme.colors.textMuted }}>{formatTimeAgo(comment.createdAt)}</span>
                                {comment.isEdited && <span style={{ fontSize: 11, color: theme.colors.textMuted }}>(edited)</span>}
                              </div>
                              <div style={{
                                fontSize: 14,
                                color: theme.colors.textPrimary,
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                              }}>
                                {comment.content}
                              </div>
                              {comment.author.id === user?.id && (
                                <button
                                  onClick={() => deleteComment(comment.id)}
                                  style={{
                                    marginTop: 8,
                                    padding: "4px 8px",
                                    background: "none",
                                    border: "none",
                                    fontSize: 12,
                                    color: theme.colors.textMuted,
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Activity Tab */
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {activities.length === 0 ? (
                      <div style={{
                        padding: 40,
                        textAlign: "center",
                        color: theme.colors.textMuted,
                        fontSize: 14,
                      }}>
                        No activity yet
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity.id} style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "10px 0",
                          borderBottom: `1px solid ${theme.colors.borderLight}`,
                        }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: theme.colors.bgTertiary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: theme.colors.textPrimary, lineHeight: 1.5 }}>
                              {formatActivityMessage(activity)}
                            </div>
                            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                              {formatTimeAgo(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 16,
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
              <select
                value={task.status || "TODO"}
                onChange={(e) => updateTask("status", e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "10px 12px",
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  background: theme.colors.bgSecondary,
                  color: getStatusColor(task.status || "TODO"),
                  cursor: "pointer",
                }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 16,
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Priority</label>
              <select
                value={task.priority}
                onChange={(e) => updateTask("priority", e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "10px 12px",
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  background: theme.colors.bgSecondary,
                  color: getPriorityColor(task.priority),
                  cursor: "pointer",
                }}
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 16,
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Assignee</label>
              <select
                value={task.assignee?.id || ""}
                onChange={(e) => updateTask("assigneeId", e.target.value || null)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "10px 12px",
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: theme.colors.bgSecondary,
                  cursor: "pointer",
                }}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 16,
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Due Date</label>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => updateTask("dueDate", e.target.value || null)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "10px 12px",
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: theme.colors.bgSecondary,
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Owner Type */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 16,
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Responsibility</label>
              <select
                value={task.ownerType || "AGENCY"}
                onChange={(e) => updateTask("ownerType", e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "10px 12px",
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: theme.colors.bgSecondary,
                  cursor: "pointer",
                }}
              >
                <option value="AGENCY">Agency</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>

            {/* Category */}
            {task.category && (
              <div style={{
                background: theme.colors.bgSecondary,
                borderRadius: 12,
                border: `1px solid ${theme.colors.borderLight}`,
                padding: 16,
              }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Category</label>
                <div style={{ marginTop: 8, fontSize: 14, color: theme.colors.textPrimary }}>{task.category.name}</div>
              </div>
            )}

            {/* Timestamps */}
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 16,
            }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Created</label>
                <div style={{ marginTop: 4, fontSize: 14, color: theme.colors.textPrimary }}>{formatDate(task.createdAt)}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Last Updated</label>
                <div style={{ marginTop: 4, fontSize: 14, color: theme.colors.textPrimary }}>{formatTimeAgo(task.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
