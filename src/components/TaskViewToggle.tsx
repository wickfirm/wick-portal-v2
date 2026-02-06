"use client";

import { theme } from "@/lib/theme";

type ViewType = "table" | "board" | "calendar";

type TaskViewToggleProps = {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
};

export default function TaskViewToggle({
  activeView,
  onViewChange,
}: TaskViewToggleProps) {
  const views: { id: ViewType; label: string; icon: JSX.Element }[] = [
    {
      id: "table",
      label: "Table",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      ),
    },
    {
      id: "board",
      label: "Board",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="5" height="18" rx="1" />
          <rect x="10" y="3" width="5" height="12" rx="1" />
          <rect x="17" y="3" width="5" height="16" rx="1" />
        </svg>
      ),
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: "inline-flex",
        background: theme.colors.bgTertiary,
        borderRadius: theme.borderRadius.md,
        padding: 4,
        gap: 2,
      }}
    >
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => {
            if (activeView !== view.id) {
              onViewChange(view.id);
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background:
              activeView === view.id ? theme.colors.bgSecondary : "transparent",
            border: "none",
            borderRadius: theme.borderRadius.sm,
            color:
              activeView === view.id
                ? theme.colors.primary
                : theme.colors.textMuted,
            fontSize: 13,
            fontWeight: activeView === view.id ? 600 : 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow:
              activeView === view.id
                ? "0 1px 3px rgba(0,0,0,0.1)"
                : "none",
          }}
        >
          {view.icon}
          <span>{view.label}</span>
        </button>
      ))}
    </div>
  );
}
