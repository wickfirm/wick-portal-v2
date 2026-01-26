"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";

type DeleteProjectButtonProps = {
  projectId: string;
  projectName: string;
  isDefault: boolean;
  clientId: string;
};

export default function DeleteProjectButton({
  projectId,
  projectName,
  isDefault,
  clientId,
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Don't show delete button for Admin/Operations
  if (isDefault) {
    return null;
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Redirect to client's projects page
        router.push(`/clients/${clientId}?tab=projects`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete project");
        setDeleting(false);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete project");
      setDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          padding: "10px 20px",
          background: "transparent",
          border: `1px solid ${theme.colors.error}`,
          borderRadius: theme.borderRadius.md,
          color: theme.colors.error,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.colors.error;
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = theme.colors.error;
        }}
      >
        🗑️ Delete Project
      </button>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        background: theme.colors.bgSecondary,
        border: `2px solid ${theme.colors.error}`,
        borderRadius: theme.borderRadius.lg,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.error,
            marginBottom: 8,
          }}
        >
          ⚠️ Delete Project
        </div>
        <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 }}>
          Are you sure you want to delete <strong>"{projectName}"</strong>?
        </div>
        <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
          This will permanently delete the project and all associated data. This action cannot be undone.
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: theme.colors.errorBg,
            border: `1px solid ${theme.colors.error}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.error,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            flex: 1,
            padding: "10px 20px",
            background: theme.colors.error,
            border: "none",
            borderRadius: theme.borderRadius.md,
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.6 : 1,
          }}
        >
          {deleting ? "Deleting..." : "Yes, Delete Project"}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false);
            setError("");
          }}
          disabled={deleting}
          style={{
            flex: 1,
            padding: "10px 20px",
            background: "transparent",
            border: `1px solid ${theme.colors.borderMedium}`,
            borderRadius: theme.borderRadius.md,
            color: theme.colors.textSecondary,
            fontSize: 14,
            fontWeight: 500,
            cursor: deleting ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
