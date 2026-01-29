"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";
import AttachmentUploader from "./AttachmentUploader";
import VoiceRecorder from "./VoiceRecorder";
import AttachmentList from "./AttachmentList";

interface NoteEditorProps {
  note?: {
    id: string;
    title: string | null;
    content: string;
    color: string;
    isPinned: boolean;
    tags: string[];
  } | null;
  onClose: () => void;
  onSave: () => void;
}

const COLOR_OPTIONS = [
  { value: "yellow", label: "Yellow", hex: "#FEF3C7" },
  { value: "pink", label: "Pink", hex: "#FCE7F3" },
  { value: "blue", label: "Blue", hex: "#DBEAFE" },
  { value: "green", label: "Green", hex: "#D1FAE5" },
  { value: "purple", label: "Purple", hex: "#E9D5FF" },
];

export default function NoteEditor({ note, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [color, setColor] = useState(note?.color || "yellow");
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [attachmentKey, setAttachmentKey] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      alert("Content is required");
      return;
    }

    setSaving(true);
    try {
      const url = note ? `/api/notes/${note.id}` : "/api/notes";
      const method = note ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          color,
          isPinned,
          tags,
        }),
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        alert("Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === color);

  return (
    <div
      style={{
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
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: selectedColor?.hex || "#FEF3C7",
          borderRadius: 12,
          maxWidth: 600,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          border: `1px solid ${theme.colors.borderLight}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary }}>
            {note ? "Edit Note" : "New Note"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: theme.colors.textMuted,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Title */}
          <input
            type="text"
            placeholder="Note title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: 18,
              fontWeight: 600,
              border: "none",
              background: "rgba(255,255,255,0.5)",
              borderRadius: 6,
              marginBottom: 12,
              outline: "none",
            }}
          />

          {/* Content */}
          <textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              minHeight: 200,
              padding: "12px",
              fontSize: 14,
              border: "none",
              background: "rgba(255,255,255,0.5)",
              borderRadius: 6,
              marginBottom: 16,
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />

          {/* Color Picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, display: "block", marginBottom: 8 }}>
              Color
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: c.hex,
                    border: color === c.value ? `3px solid ${theme.colors.primary}` : "2px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Pin Toggle */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>📌 Pin this note</span>
            </label>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, display: "block", marginBottom: 8 }}>
              Tags
            </label>
            
            {/* Tag list */}
            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      background: "rgba(0,0,0,0.1)",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        padding: 0,
                        color: theme.colors.textMuted,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "rgba(255,255,255,0.5)",
                  borderRadius: 6,
                  outline: "none",
                }}
              />
              <button
                onClick={addTag}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  background: "rgba(0,0,0,0.1)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Attachments (only for existing notes) */}
          {note && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, display: "block", marginBottom: 8 }}>
                  Attachments
                </label>
                <AttachmentUploader 
                  noteId={note.id} 
                  onUploadComplete={() => setAttachmentKey(prev => prev + 1)} 
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary, display: "block", marginBottom: 8 }}>
                  Voice Memo
                </label>
                <VoiceRecorder 
                  noteId={note.id} 
                  onRecordingComplete={() => setAttachmentKey(prev => prev + 1)} 
                />
              </div>

              <AttachmentList key={attachmentKey} noteId={note.id} />
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              background: "rgba(0,0,0,0.05)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              background: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: saving || !content.trim() ? "not-allowed" : "pointer",
              fontWeight: 500,
              opacity: saving || !content.trim() ? 0.5 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
