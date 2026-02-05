"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface Task {
  id: string;
  name: string;
  description: string | null;
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
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isWatching, setIsWatching] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const [showActivity, setShowActivity] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarFileInputRef = useRef<HTMLInputElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;

  // Default options
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

  // Fetch functions
  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setEditedTitle(data.name);
        setEditedDescription(data.description || "");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    }
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) setComments(await res.json());
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
      if (res.ok) setAttachments(await res.json());
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setTeamMembers(await res.json() || []);
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
      ]).finally(() => setLoading(false));
    }
  }, [sessionStatus, taskId, router, fetchTask]);

  // Update task
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

  const toggleWatch = async () => {
    try {
      const method = isWatching ? "DELETE" : "POST";
      await fetch(`/api/tasks/${taskId}/watchers`, { method });
      setIsWatching(!isWatching);
      fetchWatchers();
    } catch (error) {
      console.error("Error toggling watch:", error);
    }
  };

  // Comments
  const submitComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[2]);
      }

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, mentions }),
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

  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
      fetchComments();
      fetchActivity();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // File upload with progress
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingFile(true);

    const fileArray = Array.from(files);
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadFileName(file.name);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      try {
        // Use XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(percent);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Upload failed")));

          xhr.open("POST", `/api/tasks/${taskId}/attachments`);
          xhr.send(formData);
        });

        fetchAttachments();
        fetchActivity();
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    setUploadingFile(false);
    setUploadProgress(0);
    setUploadFileName("");
    setIsDragging(false);
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm("Remove this file?")) return;
    try {
      await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, { method: "DELETE" });
      fetchAttachments();
      fetchActivity();
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  // Mention handling
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setNewComment(value);
    setMentionCursorPos(cursorPos);

    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const afterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!afterAt.includes(" ") && afterAt.length < 20) {
        setMentionSearch(afterAt.toLowerCase());
        setShowMentions(true);
        setSelectedMentionIndex(0);
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
      `@[${member.name}](${member.id}) ` + textAfterCursor;

    setNewComment(newText);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleToolbarAction("bold");
          return;
        case "i":
          e.preventDefault();
          handleToolbarAction("italic");
          return;
        case "k":
          e.preventDefault();
          handleToolbarAction("link");
          return;
      }
    }

    // Handle mentions navigation
    if (!showMentions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedMentionIndex(prev => Math.min(prev + 1, filteredMembers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredMembers[selectedMentionIndex]) {
      e.preventDefault();
      insertMention(filteredMembers[selectedMentionIndex]);
    } else if (e.key === "Escape") {
      setShowMentions(false);
    }
  };

  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(mentionSearch) ||
    m.email.toLowerCase().includes(mentionSearch)
  ).slice(0, 6);

  // Helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
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

  // Text formatting helpers
  const insertFormatting = (before: string, after: string = before) => {
    const textarea = commentInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newComment.substring(start, end);
    const newText = newComment.substring(0, start) + before + selectedText + after + newComment.substring(end);

    setNewComment(newText);

    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText ? start + before.length + selectedText.length + after.length : start + before.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      const textarea = commentInputRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = newComment.substring(start, end) || "link text";
      const linkMarkdown = `[${selectedText}](${url})`;
      const newText = newComment.substring(0, start) + linkMarkdown + newComment.substring(end);
      setNewComment(newText);
    }
  };

  const insertList = (ordered: boolean) => {
    const prefix = ordered ? "1. " : "- ";
    insertFormatting("\n" + prefix, "");
  };

  const insertQuote = () => {
    insertFormatting("\n> ", "");
  };

  const insertCode = () => {
    const textarea = commentInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newComment.substring(start, end);

    // If multiline, use code block
    if (selectedText.includes("\n")) {
      insertFormatting("\n```\n", "\n```\n");
    } else {
      insertFormatting("`", "`");
    }
  };

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case "bold":
        insertFormatting("**", "**");
        break;
      case "italic":
        insertFormatting("*", "*");
        break;
      case "strikethrough":
        insertFormatting("~~", "~~");
        break;
      case "link":
        insertLink();
        break;
      case "highlight":
        insertFormatting("==", "==");
        break;
      case "heading":
        insertFormatting("\n## ", "");
        break;
      case "quote":
        insertQuote();
        break;
      case "divider":
        insertFormatting("\n---\n", "");
        break;
      case "code":
        insertCode();
        break;
      case "orderedList":
        insertList(true);
        break;
      case "unorderedList":
        insertList(false);
        break;
      case "attach":
        toolbarFileInputRef.current?.click();
        break;
    }
  };

  const getStatusColor = (status: string) => statusOptions.find(s => s.value === status)?.color || "#6b7280";
  const getPriorityColor = (priority: string) => priorityOptions.find(p => p.value === priority)?.color || "#6b7280";
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
    return "📎";
  };

  const renderCommentContent = (content: string) => {
    // First, convert @mentions to styled spans
    // Then render markdown
    const processedContent = content.replace(
      /@\[([^\]]+)\]\(([^)]+)\)/g,
      '**@$1**'
    );

    return (
      <ReactMarkdown
        components={{
          // Style bold text (including @mentions)
          strong: ({ children }) => {
            const text = String(children);
            if (text.startsWith('@')) {
              return (
                <span style={{
                  color: theme.colors.primary,
                  fontWeight: 500,
                  background: theme.colors.primaryBg,
                  padding: "2px 6px",
                  borderRadius: 4,
                }}>
                  {text}
                </span>
              );
            }
            return <strong style={{ fontWeight: 600 }}>{children}</strong>;
          },
          em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
          del: ({ children }) => <del style={{ textDecoration: 'line-through', color: '#9ca3af' }}>{children}</del>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary, textDecoration: 'underline' }}>
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code style={{
              background: '#f3f4f6',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: '0.9em',
              fontFamily: 'monospace',
            }}>
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre style={{
              background: '#f3f4f6',
              padding: 12,
              borderRadius: 6,
              overflow: 'auto',
              fontSize: '0.9em',
            }}>
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '3px solid #d1d5db',
              paddingLeft: 12,
              margin: '8px 0',
              color: '#6b7280',
              fontStyle: 'italic',
            }}>
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '8px 0' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '8px 0' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
          h1: ({ children }) => <h1 style={{ fontSize: '1.5em', fontWeight: 600, margin: '8px 0' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: '1.3em', fontWeight: 600, margin: '8px 0' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: '1.1em', fontWeight: 600, margin: '8px 0' }}>{children}</h3>,
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />,
          p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
          // Handle highlight syntax ==text==
          mark: ({ children }) => (
            <mark style={{ background: '#fef08a', padding: '1px 4px', borderRadius: 2 }}>{children}</mark>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  // Pre-process content to render highlights as styled spans
  const preprocessHighlights = (text: string) => {
    // Split by highlight markers and render
    const parts = text.split(/(==.*?==)/g);
    return parts.map((part, i) => {
      if (part.startsWith('==') && part.endsWith('==')) {
        const highlighted = part.slice(2, -2);
        return <mark key={i} style={{ background: '#fef08a', padding: '1px 4px', borderRadius: 2 }}>{highlighted}</mark>;
      }
      return part;
    });
  };

  // Loading
  if (sessionStatus === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
          <div style={{ textAlign: "center", color: theme.colors.textMuted }}>Loading...</div>
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
          <div style={{ textAlign: "center", padding: 60 }}>
            <h2 style={{ color: theme.colors.textPrimary }}>Task not found</h2>
            <Link href="/tasks" style={{ color: theme.colors.primary }}>← Back to Tasks</Link>
          </div>
        </main>
      </div>
    );
  }

  const isCompleted = task.status === "COMPLETED" || task.status === "DONE";

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <Header />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "30px 20px 80px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 14 }}>
          <Link href="/tasks" style={{ color: theme.colors.primary, textDecoration: "none" }}>
            Tasks
          </Link>
          {task.client && (
            <>
              <span style={{ color: "#999" }}>›</span>
              <Link href={`/clients/${task.client.id}`} style={{ color: "#666", textDecoration: "none" }}>
                {task.client.nickname || task.client.name}
              </Link>
            </>
          )}
          {task.project && (
            <>
              <span style={{ color: "#999" }}>›</span>
              <Link href={`/projects/${task.project.id}`} style={{ color: theme.colors.primary, textDecoration: "none" }}>
                {task.project.name}
              </Link>
            </>
          )}
        </div>

        {/* Main Card */}
        <div style={{
          background: "white",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "40px 50px",
          marginBottom: 24,
        }}>
          {/* Header with checkbox and title */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 30 }}>
            <button
              onClick={() => updateTask("status", isCompleted ? "TODO" : "COMPLETED")}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: `2px solid ${isCompleted ? "#22c55e" : "#d1d5db"}`,
                background: isCompleted ? "#22c55e" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 6,
              }}
            >
              {isCompleted && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            <div style={{ flex: 1 }}>
              {editingTitle ? (
                <input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={() => {
                    if (editedTitle.trim() && editedTitle !== task.name) updateTask("name", editedTitle.trim());
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  style={{
                    width: "100%",
                    fontSize: 28,
                    fontWeight: 600,
                    border: "2px solid #3b82f6",
                    borderRadius: 6,
                    padding: "8px 12px",
                    outline: "none",
                  }}
                  autoFocus
                />
              ) : (
                <h1
                  onClick={() => setEditingTitle(true)}
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    color: isCompleted ? "#9ca3af" : "#111",
                    textDecoration: isCompleted ? "line-through" : "none",
                    margin: 0,
                    cursor: "pointer",
                    lineHeight: 1.3,
                  }}
                >
                  {task.name}
                </h1>
              )}
            </div>

            {/* More options */}
            <button
              style={{
                background: "none",
                border: "none",
                padding: 8,
                cursor: "pointer",
                color: "#9ca3af",
                borderRadius: 6,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>

          {/* Task Details - Basecamp style */}
          <div style={{ marginBottom: 30 }}>
            {/* Assigned to */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <span style={{ width: 120, fontSize: 14, fontWeight: 600, color: "#666", textAlign: "right", paddingRight: 16 }}>
                Assigned to
              </span>
              <select
                value={task.assignee?.id || ""}
                onChange={(e) => updateTask("assigneeId", e.target.value || null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: task.assignee ? "#111" : "#9ca3af",
                  cursor: "pointer",
                  padding: "4px 0",
                }}
              >
                <option value="">Type names to assign...</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            {/* Due on */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <span style={{ width: 120, fontSize: 14, fontWeight: 600, color: "#666", textAlign: "right", paddingRight: 16 }}>
                Due on
              </span>
              <input
                type="date"
                value={task.dueDate?.split("T")[0] || ""}
                onChange={(e) => updateTask("dueDate", e.target.value || null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: task.dueDate ? "#111" : "#9ca3af",
                  cursor: "pointer",
                }}
                placeholder="Select a date..."
              />
            </div>

            {/* Priority */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <span style={{ width: 120, fontSize: 14, fontWeight: 600, color: "#666", textAlign: "right", paddingRight: 16 }}>
                Priority
              </span>
              <select
                value={task.priority}
                onChange={(e) => updateTask("priority", e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: getPriorityColor(task.priority),
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {priorityOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <span style={{ width: 120, fontSize: 14, fontWeight: 600, color: "#666", textAlign: "right", paddingRight: 16 }}>
                Status
              </span>
              <select
                value={task.status}
                onChange={(e) => updateTask("status", e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: getStatusColor(task.status),
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Watch / Pin */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, marginLeft: 136 }}>
              <button
                onClick={toggleWatch}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: isWatching ? "#dbeafe" : "#f3f4f6",
                  color: isWatching ? "#2563eb" : "#6b7280",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                👁️ {isWatching ? "Watching" : "Watch"}
              </button>
              <button
                onClick={() => updateTask("pinned", !task.pinned)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: task.pinned ? "#fef3c7" : "#f3f4f6",
                  color: task.pinned ? "#d97706" : "#6b7280",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                ⭐ {task.pinned ? "Pinned" : "Pin"}
              </button>
            </div>
          </div>

          {/* Description / Notes */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <span style={{ width: 120, fontSize: 14, fontWeight: 600, color: "#666", textAlign: "right", paddingRight: 16, paddingTop: 4 }}>
                Notes
              </span>
              <div style={{ flex: 1 }}>
                {editingDescription ? (
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    onBlur={() => {
                      updateTask("description", editedDescription || null);
                      setEditingDescription(false);
                    }}
                    placeholder="Add a description or notes..."
                    rows={4}
                    style={{
                      width: "100%",
                      border: "2px solid #3b82f6",
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 14,
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      lineHeight: 1.6,
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => setEditingDescription(true)}
                    style={{
                      fontSize: 14,
                      color: task.description ? "#374151" : "#9ca3af",
                      cursor: "pointer",
                      lineHeight: 1.6,
                      padding: "4px 0",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {task.description || "Add a description or notes..."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Added by */}
          <div style={{ fontSize: 13, color: "#9ca3af", marginLeft: 136 }}>
            Added on {formatDate(task.createdAt)}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div style={{ marginTop: 24, marginLeft: 136 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {attachments.map(att => (
                  <div key={att.id} style={{
                    padding: "10px 14px",
                    background: "#f9fafb",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                  }}>
                    <span>{getFileIcon(att.mimeType)}</span>
                    <span style={{ color: "#374151" }}>{att.originalName}</span>
                    <button
                      onClick={() => deleteAttachment(att.id)}
                      style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 2 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File upload button */}
          <div style={{ marginTop: 20, marginLeft: 136 }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📎 {uploadingFile ? "Uploading..." : "Attach files"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #e5e7eb", margin: "30px 0" }} />

        {/* Comment Section */}
        <div style={{
          background: "white",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "30px 50px",
        }}>
          {/* Comment input with toolbar */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
            }}>
              {user?.name ? getInitials(user.name) : "U"}
            </div>

            <div style={{ flex: 1, position: "relative" }}>
              {/* Toolbar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "8px 12px",
                background: "#f9fafb",
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                borderBottom: "1px solid #e5e7eb",
              }}>
                {/* Bold */}
                <button
                  onClick={() => handleToolbarAction("bold")}
                  title="Bold (Ctrl+B)"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4, fontWeight: 700 }}
                >
                  B
                </button>
                {/* Italic */}
                <button
                  onClick={() => handleToolbarAction("italic")}
                  title="Italic (Ctrl+I)"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4, fontStyle: "italic" }}
                >
                  I
                </button>
                {/* Strikethrough */}
                <button
                  onClick={() => handleToolbarAction("strikethrough")}
                  title="Strikethrough"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4, textDecoration: "line-through" }}
                >
                  S
                </button>
                {/* Link */}
                <button
                  onClick={() => handleToolbarAction("link")}
                  title="Insert Link (Ctrl+K)"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>
                {/* Highlight */}
                <button
                  onClick={() => handleToolbarAction("highlight")}
                  title="Highlight"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <circle cx="11" cy="11" r="2" />
                  </svg>
                </button>
                {/* Heading */}
                <button
                  onClick={() => handleToolbarAction("heading")}
                  title="Heading"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4, fontWeight: 600 }}
                >
                  T
                </button>
                {/* Quote */}
                <button
                  onClick={() => handleToolbarAction("quote")}
                  title="Quote"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 16, color: "#6b7280", borderRadius: 4 }}
                >
                  "
                </button>
                {/* Divider */}
                <button
                  onClick={() => handleToolbarAction("divider")}
                  title="Divider"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4 }}
                >
                  ―
                </button>
                {/* Code */}
                <button
                  onClick={() => handleToolbarAction("code")}
                  title="Code"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 12, color: "#6b7280", borderRadius: 4, fontFamily: "monospace" }}
                >
                  {"</>"}
                </button>
                {/* Ordered List */}
                <button
                  onClick={() => handleToolbarAction("orderedList")}
                  title="Numbered List"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="10" y1="6" x2="21" y2="6" />
                    <line x1="10" y1="12" x2="21" y2="12" />
                    <line x1="10" y1="18" x2="21" y2="18" />
                    <path d="M4 6h1v4" />
                    <path d="M4 10h2" />
                    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
                  </svg>
                </button>
                {/* Unordered List */}
                <button
                  onClick={() => handleToolbarAction("unorderedList")}
                  title="Bullet List"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="9" y1="6" x2="20" y2="6" />
                    <line x1="9" y1="12" x2="20" y2="12" />
                    <line x1="9" y1="18" x2="20" y2="18" />
                    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </button>
                {/* Attach */}
                <button
                  onClick={() => handleToolbarAction("attach")}
                  title="Attach File"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#6b7280", borderRadius: 4 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  ref={toolbarFileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  style={{ display: "none" }}
                />
                <div style={{ flex: 1 }} />
                {/* Undo */}
                <button
                  onClick={() => document.execCommand("undo")}
                  title="Undo"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", color: "#9ca3af", borderRadius: 4 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                  </svg>
                </button>
                {/* Redo */}
                <button
                  onClick={() => document.execCommand("redo")}
                  title="Redo"
                  style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", color: "#9ca3af", borderRadius: 4 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                  </svg>
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your comment here..."
                rows={5}
                style={{
                  width: "100%",
                  border: "1px solid #e5e7eb",
                  borderTop: "none",
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  padding: 16,
                  fontSize: 15,
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />

              {/* Upload Progress Bar */}
              {uploadingFile && (
                <div style={{
                  padding: "12px 16px",
                  background: "#f0f9ff",
                  borderRadius: 8,
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}>
                    📄
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                        {uploadFileName}
                      </span>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        {uploadProgress}%
                      </span>
                    </div>
                    <div style={{
                      height: 6,
                      background: "#e5e7eb",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                        borderRadius: 3,
                        transition: "width 0.2s ease",
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Mentions Dropdown - FIXED POSITION */}
              {showMentions && filteredMembers.length > 0 && (
                <div
                  ref={mentionDropdownRef}
                  style={{
                    position: "absolute",
                    top: 50,
                    left: 16,
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    maxHeight: 300,
                    overflowY: "auto",
                    zIndex: 1000,
                    minWidth: 300,
                  }}
                >
                  <div style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #f3f4f6",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                  }}>
                    Team Members
                  </div>
                  {filteredMembers.map((member, index) => (
                    <button
                      key={member.id}
                      onClick={() => insertMention(member)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        padding: "12px 16px",
                        background: index === selectedMentionIndex ? "#f3f4f6" : "white",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                      }}>
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: "#111" }}>{member.name}</div>
                        <div style={{ fontSize: 13, color: "#9ca3af" }}>{member.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Submit button */}
              <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
                <button
                  onClick={submitComment}
                  disabled={!newComment.trim() || submittingComment}
                  style={{
                    padding: "12px 24px",
                    background: newComment.trim() ? "#22c55e" : "#e5e7eb",
                    color: newComment.trim() ? "white" : "#9ca3af",
                    border: "none",
                    borderRadius: 20,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: newComment.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  {submittingComment ? "Posting..." : "Add this comment"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments List */}
        {comments.length > 0 && (
          <div style={{ marginTop: 24 }}>
            {comments.map(comment => (
              <div key={comment.id} style={{
                background: "white",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                padding: "24px 50px",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {getInitials(comment.author.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: "#111" }}>{comment.author.name}</span>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>{formatTimeAgo(comment.createdAt)}</span>
                      {comment.author.id === user?.id && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
                      {renderCommentContent(comment.content)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activity toggle */}
        <div style={{ marginTop: 30, textAlign: "center" }}>
          <button
            onClick={() => setShowActivity(!showActivity)}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {showActivity ? "Hide activity" : `Show activity (${activities.length})`}
          </button>
        </div>

        {/* Activity List */}
        {showActivity && activities.length > 0 && (
          <div style={{ marginTop: 20 }}>
            {activities.map(activity => (
              <div key={activity.id} style={{
                padding: "12px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 14,
                color: "#6b7280",
              }}>
                <strong style={{ color: "#374151" }}>{activity.user.name}</strong>
                {" "}
                {activity.fieldChanged === "status" ? `changed status to ${activity.newValue}` :
                 activity.fieldChanged === "priority" ? `changed priority to ${activity.newValue}` :
                 activity.fieldChanged === "assigneeId" ? (activity.newValue ? "assigned this task" : "unassigned this task") :
                 "made changes"}
                {" "}
                <span style={{ color: "#9ca3af" }}>{formatTimeAgo(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
