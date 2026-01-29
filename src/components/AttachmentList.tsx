"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "OTHER";
  duration?: number;
  thumbnail?: string;
  createdAt: string;
  uploader: {
    name: string;
  };
}

interface AttachmentListProps {
  noteId: string;
  onDelete?: () => void;
}

export default function AttachmentList({ noteId, onDelete }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttachments();
  }, [noteId]);

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/notes/${noteId}/attachments`);
      const data = await res.json();
      setAttachments(data.attachments || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Delete this attachment?")) return;

    try {
      const res = await fetch(`/api/notes/${noteId}/attachments/${attachmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAttachments();
        onDelete?.();
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      alert("Failed to delete attachment");
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      // Get download URL
      const res = await fetch(`/api/notes/${noteId}/attachments/${attachment.id}/download`);
      const data = await res.json();
      
      // Open in new tab
      window.open(data.downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading:", error);
      alert("Failed to download attachment");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "IMAGE": return "🖼️";
      case "AUDIO": return "🎵";
      case "VIDEO": return "🎬";
      case "DOCUMENT": return "📄";
      default: return "📎";
    }
  };

  if (loading) {
    return <div style={{ fontSize: 13, color: theme.colors.textMuted }}>Loading attachments...</div>;
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 8 }}>
        Attachments ({attachments.length})
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              background: "rgba(255,255,255,0.5)",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 8,
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: 24 }}>{getIcon(attachment.type)}</div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.colors.textPrimary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {attachment.originalName}
              </div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                {formatSize(Number(attachment.size))}
                {attachment.duration && ` • ${Math.floor(attachment.duration / 60)}:${(attachment.duration % 60).toString().padStart(2, "0")}`}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleDownload(attachment)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 4,
                }}
                title="Download"
              >
                ⬇️
              </button>
              <button
                onClick={() => handleDelete(attachment.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 4,
                }}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
