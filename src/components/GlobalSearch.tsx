"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";

type SearchResults = {
  clients: Array<{ id: string; name: string; email: string | null; company: string | null; status: string; nickname: string | null }>;
  projects: Array<{ id: string; name: string; status: string; serviceType: string; clientName: string | null }>;
  tasks: Array<{ id: string; name: string; status: string; priority: string; clientName: string | null; clientId: string | null }>;
  notes: Array<{ id: string; title: string | null; color: string }>;
  leads: Array<{ id: string; name: string; email: string; company: string | null }>;
  team: Array<{ id: string; name: string | null; email: string; role: string }>;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; }> = {
  clients: { label: "Clients", icon: "👤" },
  projects: { label: "Projects", icon: "📁" },
  tasks: { label: "Tasks", icon: "✓" },
  notes: { label: "Notes", icon: "📝" },
  leads: { label: "Leads", icon: "🎯" },
  team: { label: "Team", icon: "👥" },
};

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Build flat list of all results for keyboard navigation
  const flatResults = results
    ? (Object.entries(results) as [string, any[]][])
        .filter(([, items]) => items.length > 0)
        .flatMap(([category, items]) =>
          items.map((item: any) => ({ ...item, _category: category }))
        )
    : [];

  const totalResults = flatResults.length;
  const hasResults = totalResults > 0;

  // Get navigation URL for a result
  const getResultUrl = useCallback((item: any, category: string): string => {
    switch (category) {
      case "clients":
        return `/clients/${item.id}`;
      case "projects":
        return `/projects/${item.id}`;
      case "tasks":
        return item.clientId ? `/clients/${item.clientId}` : "/tasks";
      case "notes":
        return "/notes";
      case "leads":
        return "/lead-qualifier";
      case "team":
        return "/team";
      default:
        return "/dashboard";
    }
  }, []);

  // Debounced search
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setSelectedIndex(-1);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setIsOpen(true);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.trim().length < 2) {
        setResults(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      debounceRef.current = setTimeout(() => {
        search(value.trim());
      }, 300);
    },
    [search]
  );

  // Handle result click
  const handleResultClick = useCallback(
    (item: any, category: string) => {
      const url = getResultUrl(item, category);
      router.push(url);
      setIsOpen(false);
      setQuery("");
      setResults(null);
    },
    [router, getResultUrl]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < totalResults - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : totalResults - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < totalResults) {
            const item = flatResults[selectedIndex];
            handleResultClick(item, item._category);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, selectedIndex, totalResults, flatResults, handleResultClick]
  );

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Ctrl+K shortcut
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Track cumulative index for keyboard nav
  let cumulativeIndex = 0;

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, maxWidth: 400 }}>
      {/* Search Input */}
      <div style={{ position: "relative" }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search... (Ctrl+K)"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            padding: "8px 12px 8px 36px",
            border: `1px solid ${isOpen && query.length >= 2 ? theme.colors.primary : theme.colors.borderLight}`,
            borderRadius: 6,
            fontSize: 14,
            background: theme.colors.bgPrimary,
            outline: "none",
            transition: "border-color 0.15s",
            boxSizing: "border-box",
          }}
        />
        {/* Ctrl+K badge */}
        {!query && (
          <div
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: 11,
              color: theme.colors.textMuted,
              pointerEvents: "none",
            }}
          >
            Ctrl+K
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query.length >= 2 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            zIndex: 1001,
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          {loading && !results ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: theme.colors.textMuted,
                fontSize: 14,
              }}
            >
              Searching...
            </div>
          ) : results && !hasResults ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: theme.colors.textMuted,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14 }}>No results for &ldquo;{query}&rdquo;</div>
            </div>
          ) : results ? (
            <>
              {(Object.entries(results) as [string, any[]][])
                .filter(([, items]) => items.length > 0)
                .map(([category, items]) => {
                  const config = CATEGORY_CONFIG[category];
                  const startIndex = cumulativeIndex;

                  return (
                    <div key={category}>
                      {/* Category Header */}
                      <div
                        style={{
                          padding: "8px 16px",
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: theme.colors.textMuted,
                          background: theme.colors.bgTertiary,
                          borderBottom: `1px solid ${theme.colors.borderLight}`,
                          borderTop:
                            startIndex > 0
                              ? `1px solid ${theme.colors.borderLight}`
                              : "none",
                        }}
                      >
                        {config?.icon} {config?.label} ({items.length})
                      </div>

                      {/* Results */}
                      {items.map((item: any, idx: number) => {
                        const globalIdx = cumulativeIndex++;
                        const isSelected = globalIdx === selectedIndex;

                        return (
                          <div
                            key={`${category}-${item.id}`}
                            onClick={() => handleResultClick(item, category)}
                            style={{
                              padding: "10px 16px",
                              cursor: "pointer",
                              background: isSelected
                                ? theme.colors.primaryBg
                                : "transparent",
                              borderBottom:
                                idx < items.length - 1
                                  ? `1px solid ${theme.colors.bgTertiary}`
                                  : "none",
                              transition: "background 0.1s",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                theme.colors.bgTertiary;
                              setSelectedIndex(globalIdx);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = isSelected
                                ? theme.colors.primaryBg
                                : "transparent";
                            }}
                          >
                            {/* Result content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: theme.colors.textPrimary,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {getResultTitle(item, category)}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: theme.colors.textMuted,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {getResultSubtitle(item, category)}
                              </div>
                            </div>

                            {/* Status badge */}
                            {item.status && (
                              <div
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: theme.borderRadius.full,
                                  background: theme.colors.bgTertiary,
                                  color: theme.colors.textSecondary,
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                {item.status.replace(/_/g, " ")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

              {/* Footer */}
              {loading && (
                <div
                  style={{
                    padding: "8px 16px",
                    textAlign: "center",
                    fontSize: 12,
                    color: theme.colors.textMuted,
                    borderTop: `1px solid ${theme.colors.borderLight}`,
                  }}
                >
                  Updating results...
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Helper: Get display title for a result item
function getResultTitle(item: any, category: string): string {
  switch (category) {
    case "clients":
      return item.nickname || item.name;
    case "projects":
      return item.name;
    case "tasks":
      return item.name;
    case "notes":
      return item.title || "Untitled Note";
    case "leads":
      return item.name;
    case "team":
      return item.name || item.email;
    default:
      return item.name || item.id;
  }
}

// Helper: Get subtitle/description for a result item
function getResultSubtitle(item: any, category: string): string {
  switch (category) {
    case "clients":
      return [item.company, item.email].filter(Boolean).join(" · ") || "No details";
    case "projects":
      return [item.clientName, item.serviceType?.replace(/_/g, " ")].filter(Boolean).join(" · ");
    case "tasks":
      return [item.clientName, item.priority].filter(Boolean).join(" · ");
    case "notes":
      return item.color ? `${item.color} note` : "Note";
    case "leads":
      return [item.company, item.email].filter(Boolean).join(" · ");
    case "team":
      return [item.email, item.role?.replace(/_/g, " ")].filter(Boolean).join(" · ");
    default:
      return "";
  }
}
