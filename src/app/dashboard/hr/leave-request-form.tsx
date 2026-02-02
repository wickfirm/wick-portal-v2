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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${theme.colors.borderLight}`,
  borderRadius: 10,
  fontSize: 14,
  color: theme.colors.textPrimary,
  background: theme.colors.bgPrimary,
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box" as const,
};

export default function LeaveRequestForm({ onClose, onSuccess }: LeaveRequestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [hrSettings, setHRSettings] = useState<HRSettings | null>(null);
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coveragePerson, setCoveragePerson] = useState("");

  useEffect(() => {
    fetch("/api/hr/settings")
      .then(res => res.json())
      .then(data => setHRSettings(data))
      .catch(err => console.error("Failed to load HR settings:", err));
  }, []);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateNoticeDays = (start: string) => {
    if (!start) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    return Math.ceil((s.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPolicyInfo = () => {
    const leaveDays = calculateDays(startDate, endDate);
    const noticeDays = calculateNoticeDays(startDate);
    if (!hrSettings || leaveDays === 0) return null;

    if (leaveType === "SICK") {
      return { policyType: "Sick Leave", requiredDays: 0, noticeDays, leaveDays, meetsRequirement: true, status: "ok" as const, isSickLeave: true };
    }

    let policyType = "";
    let requiredDays = 0;
    if (leaveDays <= 2) { policyType = "Short Leave (1-2 days)"; requiredDays = hrSettings.shortLeaveMinDays; }
    else if (leaveDays <= 5) { policyType = "Medium Leave (3-5 days)"; requiredDays = hrSettings.mediumLeaveMinDays; }
    else { policyType = "Long Leave (7+ days)"; requiredDays = hrSettings.longLeaveMinDays; }

    const meetsRequirement = noticeDays >= requiredDays;
    const status = meetsRequirement ? "ok" as const : noticeDays >= requiredDays * 0.7 ? "warning" as const : "error" as const;
    return { policyType, requiredDays, noticeDays, leaveDays, meetsRequirement, status, isSickLeave: false };
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

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = theme.colors.primary;
  };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = theme.colors.borderLight;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: theme.colors.bgSecondary,
          borderRadius: 16,
          padding: 32,
          maxWidth: 560,
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          zIndex: 1001,
          boxShadow: theme.shadows.lg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>
          Request Leave
        </h3>
        <p style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 24 }}>
          Submit your leave request for approval
        </p>

        {/* Policy Guidelines */}
        {hrSettings?.leaveRequestGuidelines && (
          <div style={{
            background: theme.colors.infoBg,
            border: `1px solid ${theme.colors.info}20`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.info, marginBottom: 6 }}>
              Leave Request Guidelines
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {hrSettings.leaveRequestGuidelines}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
              Leave Type
            </label>
            <select
              name="leaveType"
              required
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              onFocus={focusHandler as any}
              onBlur={blurHandler as any}
              style={inputStyle}
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                min={leaveType === "SICK" ? undefined : new Date().toISOString().split("T")[0]}
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || new Date().toISOString().split("T")[0]}
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>
          </div>

          {/* Policy Validation */}
          {policyInfo && (
            <div style={{
              background: policyInfo.status === "ok" ? theme.colors.successBg : policyInfo.status === "warning" ? theme.colors.warningBg : theme.colors.errorBg,
              border: `1px solid ${(policyInfo.status === "ok" ? theme.colors.success : policyInfo.status === "warning" ? theme.colors.warning : theme.colors.error)}20`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600, marginBottom: 6,
                color: policyInfo.status === "ok" ? theme.colors.success : policyInfo.status === "warning" ? theme.colors.warning : theme.colors.error,
              }}>
                {policyInfo.status === "ok" && "Policy Requirement Met"}
                {policyInfo.status === "warning" && "Close to Minimum Notice"}
                {policyInfo.status === "error" && "Insufficient Notice Period"}
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
                <div><strong>{policyInfo.policyType}</strong> applies ({policyInfo.leaveDays} days requested)</div>
                {policyInfo.isSickLeave ? (
                  <div>No minimum notice period required for sick leave</div>
                ) : (
                  <>
                    <div>Required notice: <strong>{policyInfo.requiredDays} days</strong> | Your notice: <strong>{policyInfo.noticeDays} days</strong></div>
                    {!policyInfo.meetsRequirement && (
                      <div style={{ marginTop: 6, fontWeight: 500 }}>
                        This request may require manager approval due to short notice.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Coverage Handover */}
          {hrSettings?.requireCoverageHandover && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
                Coverage Person *
              </label>
              <input
                type="text"
                name="coveragePerson"
                value={coveragePerson}
                onChange={(e) => setCoveragePerson(e.target.value)}
                required={hrSettings.requireCoverageHandover}
                placeholder="Who will handle your responsibilities?"
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
              <p style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4, marginBottom: 0 }}>
                Name of colleague who will cover your work
              </p>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
              Reason (Optional)
            </label>
            <textarea
              name="reason"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" as const }}
              onFocus={focusHandler as any}
              onBlur={blurHandler as any}
              placeholder="Why are you taking leave?"
            />
          </div>

          {/* Approval Email Info */}
          {hrSettings?.approvalEmail && (
            <div style={{
              background: theme.colors.bgTertiary,
              borderRadius: 10,
              padding: 14,
              marginBottom: 24,
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}>
              Your request will be sent to <strong>{hrSettings.approvalEmail}</strong> for approval
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "10px 22px",
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 10,
                background: theme.colors.bgSecondary,
                color: theme.colors.textSecondary,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.15s ease",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 22px",
                background: submitting ? theme.colors.bgTertiary : theme.gradients.primary,
                color: submitting ? theme.colors.textMuted : "white",
                border: "none",
                borderRadius: 10,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 500,
                boxShadow: submitting ? "none" : theme.shadows.button,
                transition: "all 0.15s ease",
              }}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
