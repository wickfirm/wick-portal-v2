"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import NoteEditor from "@/components/NoteEditor";
import { theme } from "@/lib/theme";

interface Note {
  id: string;
  title: string | null;
  content: string;
  color: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    type: string;
  }>;
  client?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

const COLOR_OPTIONS = [
  { value: "yellow", label: "Yellow", hex: "#FEF3C7" },
  { value: "pink", label: "Pink", hex: "#FCE7F3" },
  { value: "blue", label: "Blue", hex: "#DBEAFE" },
  { value: "green", label: "Green", hex: "#D1FAE5" },
  { value: "purple", label: "Purple", hex: "#E9D5FF" },
];

export default function NotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [filter, setFilter] = useState({
    color: "",
    pinned: false,
    search: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchNotes();
    }
  }, [session, filter]);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.color) params.append("color", filter.color);
      if (filter.pinned) params.append("pinned", "true");
      if (filter.search) params.append("search", filter.search);

      const res = await fetch(`/api/notes?${params}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;

    try {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const togglePin = async (note: Note) => {
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      fetchNotes();
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  if (status === "loading" || !session) return null;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ padding: "32px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
              Sticky Notes
            </h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
              Quick notes, reminders, and ideas
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: theme.colors.primary,
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + New Note
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search notes..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            style={{
              flex: 1,
              minWidth: 250,
              padding: "8px 12px",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 6,
              fontSize: 14,
            }}
          />

          <select
            value={filter.color}
            onChange={(e) => setFilter({ ...filter, color: e.target.value })}
            style={{
              padding: "8px 12px",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            <option value="">All Colors</option>
            {COLOR_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilter({ ...filter, pinned: !filter.pinned })}
            style={{
              padding: "8px 16px",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 6,
              fontSize: 14,
              background: filter.pinned ? theme.colors.primaryBg : "transparent",
              color: filter.pinned ? theme.colors.primary : theme.colors.textSecondary,
              cursor: "pointer",
            }}
          >
            📌 Pinned Only
          </button>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>Loading...</div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <p style={{ color: theme.colors.textMuted, fontSize: 16 }}>No notes yet. Create your first one!</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {notes.map((note) => {
              const colorObj = COLOR_OPTIONS.find((c) => c.value === note.color);
              return (
                <div
                  key={note.id}
                  style={{
                    background: colorObj?.hex || "#FEF3C7",
                    padding: 16,
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.borderLight}`,
                    cursor: "pointer",
                    position: "relative",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onClick={() => setSelectedNote(note)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Pin icon */}
                  {note.isPinned && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        fontSize: 16,
                      }}
                    >
                      📌
                    </div>
                  )}

                  {/* Title */}
                  {note.title && (
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: theme.colors.textPrimary,
                      }}
                    >
                      {note.title}
                    </h3>
                  )}

                  {/* Content */}
                  <p
                    style={{
                      fontSize: 14,
                      color: theme.colors.textSecondary,
                      lineHeight: 1.5,
                      marginBottom: 12,
                      display: "-webkit-box",
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {note.content}
                  </p>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            background: "rgba(0,0,0,0.1)",
                            borderRadius: 4,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attachments indicator */}
                  {note.attachments.length > 0 && (
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>
                      📎 {note.attachments.length} attachment{note.attachments.length > 1 ? "s" : ""}
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      color: theme.colors.textMuted,
                      borderTop: "1px solid rgba(0,0,0,0.1)",
                      paddingTop: 8,
                      marginTop: 8,
                    }}
                  >
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(note);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                        title={note.isPinned ? "Unpin" : "Pin"}
                      >
                        {note.isPinned ? "📌" : "📍"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedNote) && (
        <NoteEditor
          note={selectedNote}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedNote(null);
          }}
          onSave={fetchNotes}
        />
      )}
    </div>
  );
}
