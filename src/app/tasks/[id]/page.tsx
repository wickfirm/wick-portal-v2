"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8 }}>Loading editor...</div>,
});

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

interface CommentAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  r2Key: string;
  downloadUrl?: string;       // Stream URL for viewing inline
  forceDownloadUrl?: string;  // Force download URL
}

interface Comment {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  author: { id: string; name: string; email: string };
  attachments: CommentAttachment[];
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
  const [commentAttachments, setCommentAttachments] = useState<any[]>([]);

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
      if (res.ok) {
        const commentsData = await res.json();

        // Fetch download URLs for all attachments
        const commentsWithUrls = await Promise.all(
          commentsData.map(async (comment: Comment) => {
            if (comment.attachments && comment.attachments.length > 0) {
              const attachmentsWithUrls = await Promise.all(
                comment.attachments.map(async (att: CommentAttachment) => {
                  try {
                    const urlRes = await fetch(
                      `/api/tasks/${taskId}/comments/attachments/${att.id}`
                    );
                    if (urlRes.ok) {
                      const urlData = await urlRes.json();
                      return {
                        ...att,
                        downloadUrl: urlData.downloadUrl,
                        forceDownloadUrl: urlData.forceDownloadUrl,
                      };
                    }
                  } catch (e) {
                    console.error("Error fetching attachment URL:", e);
                  }
                  return att;
                })
              );
              return { ...comment, attachments: attachmentsWithUrls };
            }
            return comment;
          })
        );

        setComments(commentsWithUrls);
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
    if (!newComment || newComment === "<p></p>") return;
    setSubmittingComment(true);
    try {
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[2]);
      }

      // First, create the comment
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          mentions,
        }),
      });

      if (res.ok) {
        const createdComment = await res.json();

        // Then upload attachments to the comment
        for (const att of commentAttachments) {
          const formData = new FormData();
          formData.append("file", att.file);
          formData.append("commentId", createdComment.id);

          await fetch(`/api/tasks/${taskId}/comments/attachments`, {
            method: "POST",
            body: formData,
          });
        }

        setNewComment("");
        setCommentAttachments([]);
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

            <div style={{ flex: 1 }}>
              {/* Rich Text Editor */}
              <RichTextEditor
                content={newComment}
                onChange={setNewComment}
                placeholder="Type your comment here... (Ctrl+Enter to submit)"
                onSubmit={submitComment}
                minHeight={120}
                attachments={commentAttachments}
                onAttachmentsChange={setCommentAttachments}
                showAttachButton={true}
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

              {/* Submit button */}
              <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
                <button
                  onClick={submitComment}
                  disabled={!newComment || newComment === "<p></p>" || submittingComment}
                  style={{
                    padding: "12px 24px",
                    background: newComment && newComment !== "<p></p>" ? "#22c55e" : "#e5e7eb",
                    color: newComment && newComment !== "<p></p>" ? "white" : "#9ca3af",
                    border: "none",
                    borderRadius: 20,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: newComment && newComment !== "<p></p>" ? "pointer" : "not-allowed",
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
                    <div
                      className="comment-content"
                      style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{ __html: comment.content }}
                    />

                    {/* Comment Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                        {comment.attachments.map((att: CommentAttachment) => {
                          const fileName = att.originalName?.toLowerCase() || "";
                          const mimeType = att.mimeType?.toLowerCase() || "";
                          const isImage = mimeType.startsWith("image/") ||
                                          fileName.endsWith(".jpg") ||
                                          fileName.endsWith(".jpeg") ||
                                          fileName.endsWith(".png") ||
                                          fileName.endsWith(".gif") ||
                                          fileName.endsWith(".webp");
                          const isVideo = mimeType.startsWith("video/") ||
                                          fileName.endsWith(".mp4") ||
                                          fileName.endsWith(".mov") ||
                                          fileName.endsWith(".webm") ||
                                          fileName.endsWith(".avi") ||
                                          fileName.endsWith(".mkv") ||
                                          fileName.endsWith(".3gp");
                          const fileUrl = att.downloadUrl;

                          // Debug logging
                          console.log("Attachment:", att.originalName, "mimeType:", att.mimeType, "isVideo:", isVideo, "isImage:", isImage, "hasUrl:", !!fileUrl);

                          if (isVideo) {
                            return (
                              <div key={att.id} style={{
                                borderRadius: 8,
                                overflow: "hidden",
                                background: "#000",
                                maxWidth: 500,
                              }}>
                                {fileUrl ? (
                                  <video
                                    controls
                                    style={{ width: "100%", display: "block", minHeight: 200 }}
                                    preload="metadata"
                                    playsInline
                                  >
                                    <source src={fileUrl} type={att.mimeType || "video/mp4"} />
                                    Your browser does not support video playback.
                                  </video>
                                ) : (
                                  <div style={{
                                    padding: 40,
                                    textAlign: "center",
                                    color: "#fff",
                                    background: "#374151",
                                  }}>
                                    🎬 Video loading...
                                  </div>
                                )}
                                <div style={{
                                  padding: "10px 14px",
                                  background: "#f9fafb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}>
                                  <span style={{ fontSize: 13, color: "#374151" }}>
                                    🎬 {att.originalName} ({formatFileSize(att.size)})
                                  </span>
                                  <a
                                    href={att.forceDownloadUrl || fileUrl || "#"}
                                    download={att.originalName}
                                    style={{
                                      fontSize: 13,
                                      color: theme.colors.primary,
                                      textDecoration: "none",
                                    }}
                                  >
                                    Download
                                  </a>
                                </div>
                              </div>
                            );
                          }

                          if (isImage && fileUrl) {
                            return (
                              <div key={att.id} style={{
                                borderRadius: 8,
                                overflow: "hidden",
                                border: "1px solid #e5e7eb",
                                maxWidth: 400,
                              }}>
                                <img
                                  src={fileUrl}
                                  alt={att.originalName}
                                  style={{ width: "100%", display: "block" }}
                                />
                                <div style={{
                                  padding: "10px 14px",
                                  background: "#f9fafb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}>
                                  <span style={{ fontSize: 13, color: "#374151" }}>
                                    {att.originalName} ({formatFileSize(att.size)})
                                  </span>
                                  <div style={{ display: "flex", gap: 12 }}>
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: 13,
                                        color: theme.colors.primary,
                                        textDecoration: "none",
                                      }}
                                    >
                                      View full-size
                                    </a>
                                    <a
                                      href={att.forceDownloadUrl || fileUrl}
                                      download={att.originalName}
                                      style={{
                                        fontSize: 13,
                                        color: theme.colors.primary,
                                        textDecoration: "none",
                                      }}
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Other file types
                          return (
                            <div key={att.id} style={{
                              padding: "12px 16px",
                              background: "#f9fafb",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              maxWidth: 400,
                            }}>
                              <span style={{ fontSize: 24 }}>{getFileIcon(att.mimeType)}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>
                                  {att.originalName}
                                </div>
                                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                                  {formatFileSize(att.size)}
                                </div>
                              </div>
                              {(att.forceDownloadUrl || fileUrl) && (
                                <a
                                  href={att.forceDownloadUrl || fileUrl}
                                  download={att.originalName}
                                  style={{
                                    padding: "6px 12px",
                                    background: theme.colors.primary,
                                    color: "white",
                                    borderRadius: 6,
                                    fontSize: 13,
                                    textDecoration: "none",
                                  }}
                                >
                                  Download
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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

      {/* Styles for comment content */}
      <style jsx global>{`
        .comment-content p {
          margin: 0.5em 0;
        }
        .comment-content p:first-child {
          margin-top: 0;
        }
        .comment-content p:last-child {
          margin-bottom: 0;
        }
        .comment-content strong {
          font-weight: 600;
        }
        .comment-content em {
          font-style: italic;
        }
        .comment-content s {
          text-decoration: line-through;
          color: #9ca3af;
        }
        .comment-content a {
          color: #7c3aed;
          text-decoration: underline;
        }
        .comment-content code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .comment-content pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 12px 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.9em;
          margin: 0.5em 0;
        }
        .comment-content pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .comment-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1em;
          margin: 0.5em 0;
          color: #6b7280;
          font-style: italic;
        }
        .comment-content ul, .comment-content ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .comment-content li {
          margin: 0.25em 0;
        }
        .comment-content h1, .comment-content h2, .comment-content h3 {
          font-weight: 600;
          margin: 0.75em 0 0.5em;
        }
        .comment-content h1 { font-size: 1.5em; }
        .comment-content h2 { font-size: 1.3em; }
        .comment-content h3 { font-size: 1.1em; }
        .comment-content hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1em 0;
        }
        .comment-content mark {
          background: #fef08a;
          padding: 1px 4px;
          border-radius: 2px;
        }
        .comment-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
}
