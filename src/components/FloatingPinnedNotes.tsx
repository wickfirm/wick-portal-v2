"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { theme } from "@/lib/theme";

interface PinnedNote {
  id: string;
  title: string | null;
  content: string;
  color: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const NOTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  yellow: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  pink:   { bg: "#FCE7F3", border: "#EC4899", text: "#9D174D" },
  blue:   { bg: "#DBEAFE", border: "#3B82F6", text: "#1E3A8A" },
  green:  { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
  purple: { bg: "#E9D5FF", border: "#8B5CF6", text: "#5B21B6" },
};

export default function FloatingPinnedNotes() {
  const [notes, setNotes] = useState<PinnedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load dismissed state from sessionStorage (resets each session)
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("dismissed-pinned-notes");
      if (dismissed) {
        setDismissedIds(new Set(JSON.parse(dismissed)));
      }
      const collapsed = sessionStorage.getItem("pinned-notes-collapsed");
      if (collapsed === "true") {
        setIsCollapsed(true);
      }
    } catch {}
  }, []);

  // Fetch pinned notes
  const fetchPinnedNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes?pinned=true");
      if (!res.ok) return;
      const data = await res.json();
      setNotes(data.notes || data || []);
    } catch (error) {
      console.error("Error fetching pinned notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPinnedNotes();
    // Poll every 2 minutes for pinned note changes
    const poll = setInterval(fetchPinnedNotes, 120000);
    return () => clearInterval(poll);
  }, [fetchPinnedNotes]);

  // Dismiss a note for this session
  const dismissNote = useCallback((noteId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(noteId);
      try {
        sessionStorage.setItem("dismissed-pinned-notes", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setExpandedNoteId(null);
  }, []);

  // Toggle collapsed
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem("pinned-notes-collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Filter out dismissed notes
  const visibleNotes = notes.filter((n) => !dismissedIds.has(n.id));

  // Don't render if loading or no pinned notes
  if (isLoading || visibleNotes.length === 0) return null;

  const getColors = (color: string) => NOTE_COLORS[color] || NOTE_COLORS.yellow;

  // Truncate content for preview
  const truncate = (text: string, maxLen: number) => {
    // Strip HTML tags for preview
    const plain = text.replace(/<[^>]*>/g, "").trim();
    if (plain.length <= maxLen) return plain;
    return plain.substring(0, maxLen) + "...";
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: "calc(100vh - 100px)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 20,
          border: "none",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "white",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        }}
      >
        <span style={{ fontSize: 14 }}>📌</span>
        {isCollapsed ? (
          <span>{visibleNotes.length} pinned note{visibleNotes.length !== 1 ? "s" : ""}</span>
        ) : (
          <span>Hide notes</span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "transform 0.3s",
            transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Notes stack */}
      {!isCollapsed && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflowY: "auto",
            maxHeight: "calc(100vh - 160px)",
            paddingRight: 4,
          }}
        >
          {visibleNotes.map((note) => {
            const colors = getColors(note.color);
            const isExpanded = expandedNoteId === note.id;

            return (
              <div
                key={note.id}
                onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                style={{
                  width: isExpanded ? 320 : 260,
                  padding: isExpanded ? "14px 16px" : "10px 14px",
                  borderRadius: 12,
                  background: colors.bg,
                  borderLeft: `4px solid ${colors.border}`,
                  boxShadow: isExpanded
                    ? "0 8px 24px rgba(0,0,0,0.15)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                  }
                }}
              >
                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNote(note.id);
                  }}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "none",
                    background: `${colors.border}20`,
                    color: colors.text,
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.5,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                  title="Dismiss for this session"
                >
                  ×
                </button>

                {/* Title */}
                {note.title && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: colors.text,
                      marginBottom: 4,
                      paddingRight: 20,
                      whiteSpace: isExpanded ? "normal" : ("nowrap" as const),
                      overflow: isExpanded ? "visible" : "hidden",
                      textOverflow: isExpanded ? "unset" : "ellipsis",
                    }}
                  >
                    📌 {note.title}
                  </div>
                )}

                {/* Content */}
                <div
                  style={{
                    fontSize: 12,
                    color: colors.text,
                    opacity: 0.85,
                    lineHeight: 1.5,
                    ...(isExpanded
                      ? {
                          maxHeight: 200,
                          overflowY: "auto" as const,
                          whiteSpace: "pre-wrap" as const,
                        }
                      : {
                          maxHeight: 36,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                        }),
                  }}
                >
                  {isExpanded
                    ? note.content.replace(/<[^>]*>/g, "").trim()
                    : truncate(note.content, 80)}
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && isExpanded && (
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                      marginTop: 8,
                    }}
                  >
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: `${colors.border}20`,
                          color: colors.text,
                          fontWeight: 500,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp for expanded view */}
                {isExpanded && (
                  <div
                    style={{
                      fontSize: 10,
                      color: colors.text,
                      opacity: 0.5,
                      marginTop: 8,
                    }}
                  >
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
