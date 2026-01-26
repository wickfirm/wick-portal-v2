"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";

interface DeleteClientButtonProps {
  clientId: string;
  clientName: string;
}

export default function DeleteClientButton({ clientId, clientName }: DeleteClientButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete client");
      }

      // Success - redirect to clients list
      router.push("/clients");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          padding: "10px 16px",
          borderRadius: theme.borderRadius.md,
          background: theme.colors.errorBg,
          color: theme.colors.error,
          border: "none",
          fontWeight: 500,
          fontSize: 13,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.colors.error;
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.colors.errorBg;
          e.currentTarget.style.color = theme.colors.error;
        }}
      >
        Delete Client
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !isDeleting && setShowConfirm(false)}
        >
          <div
            style={{
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              padding: 32,
              maxWidth: 500,
              width: "90%",
              boxShadow: theme.shadows.lg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: theme.colors.errorBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 28 }}>⚠️</span>
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Delete Client
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Are you sure you want to delete <strong>{clientName}</strong>? This action cannot be undone and will permanently delete:
              </p>
              <ul
                style={{
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  marginTop: 12,
                  marginBottom: 0,
                  lineHeight: 1.8,
                }}
              >
                <li>All projects associated with this client</li>
                <li>All tasks and onboarding items</li>
                <li>All metrics and performance data</li>
                <li>All team assignments</li>
                <li>All client resources and files</li>
              </ul>
            </div>

            {error && (
              <div
                style={{
                  background: theme.colors.errorBg,
                  color: theme.colors.error,
                  padding: "12px 16px",
                  borderRadius: theme.borderRadius.md,
                  marginBottom: 20,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textSecondary,
                  border: "none",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  background: isDeleting ? theme.colors.bgTertiary : theme.colors.error,
                  color: isDeleting ? theme.colors.textMuted : "white",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
