"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

interface LeaveRequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface HRSettings {
  shortLeaveMinDays: number;
  mediumLeaveMinDays: number;
  longLeaveMinDays: number;
  approvalEmail: string;
  requireCoverageHandover: boolean;
  leaveRequestGuidelines: string;
}

export default function LeaveRequestForm({ onClose, onSuccess }: LeaveRequestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [hrSettings, setHRSettings] = useState<HRSettings | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coveragePerson, setCoveragePerson] = useState("");
  
  // Load HR settings for policy validation
  useEffect(() => {
    fetch("/api/hr/settings")
      .then(res => res.json())
      .then(data => setHRSettings(data))
      .catch(err => console.error("Failed to load HR settings:", err));
  }, []);

  // Calculate days between dates
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end
    return diffDays;
  };

  // Calculate notice period (days from today to start date)
  const calculateNoticeDays = (start: string) => {
    if (!start) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Determine which policy applies
  const getPolicyInfo = () => {
    const leaveDays = calculateDays(startDate, endDate);
    const noticeDays = calculateNoticeDays(startDate);

    if (!hrSettings || leaveDays === 0) {
      return null;
    }

    let policyType = "";
    let requiredDays = 0;
    let meetsRequirement = false;
    let status: "ok" | "warning" | "error" = "ok";

    if (leaveDays <= 2) {
      policyType = "Short Leave (1-2 days)";
      requiredDays = hrSettings.shortLeaveMinDays;
    } else if (leaveDays <= 5) {
      policyType = "Medium Leave (3-5 days)";
      requiredDays = hrSettings.mediumLeaveMinDays;
    } else {
      policyType = "Long Leave (7+ days)";
      requiredDays = hrSettings.longLeaveMinDays;
    }

    meetsRequirement = noticeDays >= requiredDays;

    // Determine status
    if (meetsRequirement) {
      status = "ok";
    } else if (noticeDays >= requiredDays * 0.7) {
      status = "warning"; // Close to requirement
    } else {
      status = "error"; // Insufficient notice
    }

    return {
      policyType,
      requiredDays,
      noticeDays,
      leaveDays,
      meetsRequirement,
      status,
    };
  };

  const policyInfo = getPolicyInfo();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      leaveType: formData.get("leaveType"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      reason: formData.get("reason"),
      coveragePerson: formData.get("coveragePerson") || undefined,
    };

    try {
      const res = await fetch("/api/hr/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to submit request");
        setSubmitting(false);
        return;
      }

      alert("Leave request submitted successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>
          Request Leave
        </h3>
        <p style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "1.5rem" }}>
          Submit your leave request for approval
        </p>

        {/* Policy Guidelines */}
        {hrSettings?.leaveRequestGuidelines && (
          <div
            style={{
              background: theme.colors.infoBg,
              border: `1px solid ${theme.colors.info}`,
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ fontSize: "0.875rem", fontWeight: "600", color: theme.colors.info, marginBottom: "0.5rem" }}>
              📋 Leave Request Guidelines
            </div>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, whiteSpace: "pre-wrap" }}>
              {hrSettings.leaveRequestGuidelines}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Leave Type
            </label>
            <select
              name="leaveType"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "0.875rem",
              }}
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || new Date().toISOString().split("T")[0]}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>

          {/* Policy Validation Display */}
          {policyInfo && (
            <div
              style={{
                background:
                  policyInfo.status === "ok"
                    ? theme.colors.successBg
                    : policyInfo.status === "warning"
                    ? theme.colors.warningBg
                    : theme.colors.errorBg,
                border: `1px solid ${
                  policyInfo.status === "ok"
                    ? theme.colors.success
                    : policyInfo.status === "warning"
                    ? theme.colors.warning
                    : theme.colors.error
                }`,
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color:
                    policyInfo.status === "ok"
                      ? theme.colors.success
                      : policyInfo.status === "warning"
                      ? theme.colors.warning
                      : theme.colors.error,
                  marginBottom: "0.5rem",
                }}
              >
                {policyInfo.status === "ok" && "✅ Policy Requirement Met"}
                {policyInfo.status === "warning" && "⚠️ Close to Minimum Notice"}
                {policyInfo.status === "error" && "❌ Insufficient Notice Period"}
              </div>
              <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary }}>
                <div>• <strong>{policyInfo.policyType}</strong> applies ({policyInfo.leaveDays} days requested)</div>
                <div>• Required notice: <strong>{policyInfo.requiredDays} days</strong></div>
                <div>• Your notice: <strong>{policyInfo.noticeDays} days</strong></div>
                {!policyInfo.meetsRequirement && (
                  <div style={{ marginTop: "0.5rem", fontWeight: "500" }}>
                    ⚡ This request may require manager approval due to short notice.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coverage Handover (if required) */}
          {hrSettings?.requireCoverageHandover && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                Coverage Person {hrSettings.requireCoverageHandover && "*"}
              </label>
              <input
                type="text"
                name="coveragePerson"
                value={coveragePerson}
                onChange={(e) => setCoveragePerson(e.target.value)}
                required={hrSettings.requireCoverageHandover}
                placeholder="Who will handle your responsibilities?"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
              />
              <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                Name of colleague who will cover your work
              </p>
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Reason (Optional)
            </label>
            <textarea
              name="reason"
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "0.875rem",
                resize: "vertical",
              }}
              placeholder="Why are you taking leave?"
            />
          </div>

          {/* Approval Email Info */}
          {hrSettings?.approvalEmail && (
            <div
              style={{
                background: theme.colors.bgTertiary,
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.5rem",
                fontSize: "0.75rem",
                color: theme.colors.textSecondary,
              }}
            >
              📧 Your request will be sent to <strong>{hrSettings.approvalEmail}</strong> for approval
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "0.75rem 1.5rem",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                background: "white",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.75rem 1.5rem",
                background: submitting ? theme.colors.bgTertiary : theme.colors.primary,
                color: submitting ? theme.colors.textMuted : "white",
                border: "none",
                borderRadius: "8px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
