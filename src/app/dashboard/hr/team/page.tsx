"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: string;
  reason?: string;
  status: LeaveStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  employee: {
    user: {
      name: string;
      email: string;
    };
    jobTitle?: string;
    department?: string;
  };
}

const icons = {
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  x: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  sun: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  heart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  emptyInbox: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
};

const statusConfig: Record<LeaveStatus, { bg: string; color: string; label: string }> = {
  PENDING: { bg: theme.colors.warningBg, color: "#92400E", label: "Pending" },
  APPROVED: { bg: theme.colors.successBg, color: theme.colors.success, label: "Approved" },
  REJECTED: { bg: theme.colors.errorBg, color: theme.colors.error, label: "Rejected" },
  CANCELLED: { bg: theme.colors.bgTertiary, color: theme.colors.textMuted, label: "Cancelled" },
};

const avatarColors = ["#76527c", "#5f4263", "#3d6b73", "#8a6030", "#34a853"];
const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

const filterOptions = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

export default function TeamLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | LeaveStatus>("PENDING");
  const [processing, setProcessing] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadRequests();
    }
  }, [status]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/leave-requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm("Approve this leave request?")) return;

    setProcessing(requestId);
    try {
      const notes = prompt("Add approval notes (optional):");
      const res = await fetch(`/api/hr/leave-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          reviewNotes: notes || "Approved"
        })
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to approve");
        return;
      }

      alert("Leave request approved!");
      loadRequests();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const notes = prompt("Enter rejection reason:");
    if (!notes) return;

    setProcessing(requestId);
    try {
      const res = await fetch(`/api/hr/leave-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          reviewNotes: notes
        })
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to reject");
        return;
      }

      alert("Leave request rejected");
      loadRequests();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const filteredRequests = filter === "ALL"
    ? requests
    : requests.filter(r => r.status === filter);

  const pendingCount = requests.filter(r => r.status === "PENDING").length;
  const approvedCount = requests.filter(r => r.status === "APPROVED").length;

  // Loading skeleton
  if (loading && requests.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ height: 18, width: 100, background: theme.colors.bgSecondary, borderRadius: 6, marginBottom: 16 }} />
            <div style={{ height: 32, width: 220, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ height: 16, width: 280, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: 100, background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }} />
            ))}
          </div>
          <div style={{ height: 52, background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}`, marginBottom: 16 }} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 120, background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}`, marginBottom: 12 }} />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Back Link + Header */}
        <div style={{ marginBottom: 28, ...anim(0.05) }}>
          <Link
            href="/dashboard/hr"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: theme.colors.textMuted,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 16,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.colors.textMuted)}
          >
            {icons.arrowLeft} My Leave
          </Link>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 28,
            fontWeight: 400,
            color: theme.colors.textPrimary,
            margin: "0 0 4px 0",
          }}>
            Team Leave Requests
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
            Review and approve team leave requests
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24, ...anim(0.1) }}>
          {[
            {
              icon: icons.clock,
              iconBg: theme.colors.warningBg,
              iconColor: "#92400E",
              label: "Pending Approval",
              value: pendingCount,
              valueColor: pendingCount > 0 ? "#F59E0B" : theme.colors.textPrimary,
            },
            {
              icon: icons.check,
              iconBg: theme.colors.successBg,
              iconColor: theme.colors.success,
              label: "Approved",
              value: approvedCount,
              valueColor: theme.colors.success,
            },
            {
              icon: icons.clipboard,
              iconBg: theme.colors.infoBg,
              iconColor: theme.colors.info,
              label: "Total Requests",
              value: requests.length,
              valueColor: theme.colors.textPrimary,
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: theme.colors.bgSecondary,
                borderRadius: 14,
                border: `1px solid ${theme.colors.borderLight}`,
                padding: "20px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: card.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: card.iconColor,
                flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: card.valueColor,
                  lineHeight: 1,
                }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                  {card.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Pills */}
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
          ...anim(0.15),
        }}>
          {filterOptions.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 20,
                  border: isActive ? "none" : `1px solid ${theme.colors.borderLight}`,
                  background: isActive ? theme.gradients.primary : "transparent",
                  color: isActive ? "white" : theme.colors.textSecondary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                {f === "ALL" ? "All" : statusConfig[f as LeaveStatus]?.label || f}
                {f === "PENDING" && pendingCount > 0 && (
                  <span style={{
                    background: isActive ? "rgba(255,255,255,0.25)" : theme.colors.warningBg,
                    color: isActive ? "white" : "#92400E",
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Requests List */}
        <div style={{ ...anim(0.2) }}>
          {filteredRequests.length === 0 ? (
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 14,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: 64,
              textAlign: "center",
            }}>
              <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
                {icons.emptyInbox}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
                No {filter === "ALL" ? "" : filter.toLowerCase() + " "}requests
              </div>
              <div style={{ fontSize: 14, color: theme.colors.textMuted }}>
                {filter === "PENDING" ? "All caught up! No requests need your attention." : "No requests match this filter."}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredRequests.map((request) => {
                const sc = statusConfig[request.status];
                const avatarColor = getAvatarColor(request.employee.user.name);
                const isProcessingThis = processing === request.id;

                return (
                  <div
                    key={request.id}
                    style={{
                      background: theme.colors.bgSecondary,
                      borderRadius: 14,
                      border: `1px solid ${theme.colors.borderLight}`,
                      padding: "18px 22px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.bgPrimary)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = theme.colors.bgSecondary)}
                  >
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      {/* Avatar */}
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: avatarColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 16,
                        flexShrink: 0,
                        marginTop: 2,
                      }}>
                        {request.employee.user.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: theme.colors.textPrimary, marginBottom: 2 }}>
                              {request.employee.user.name}
                            </div>
                            {request.employee.jobTitle && (
                              <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                                {request.employee.jobTitle}
                                {request.employee.department && ` · ${request.employee.department}`}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons (only for pending) */}
                          {request.status === "PENDING" && (
                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                              <button
                                onClick={() => handleApprove(request.id)}
                                disabled={isProcessingThis}
                                style={{
                                  padding: "8px 18px",
                                  background: isProcessingThis ? theme.colors.bgTertiary : theme.colors.success,
                                  color: isProcessingThis ? theme.colors.textMuted : "white",
                                  border: "none",
                                  borderRadius: 10,
                                  cursor: isProcessingThis ? "not-allowed" : "pointer",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {icons.check} Approve
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                disabled={isProcessingThis}
                                style={{
                                  padding: "8px 18px",
                                  background: isProcessingThis ? theme.colors.bgTertiary : "transparent",
                                  color: isProcessingThis ? theme.colors.textMuted : theme.colors.error,
                                  border: `1px solid ${isProcessingThis ? theme.colors.borderLight : theme.colors.error}`,
                                  borderRadius: 10,
                                  cursor: isProcessingThis ? "not-allowed" : "pointer",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {icons.x} Reject
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Badges row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 500,
                            background: sc.bg,
                            color: sc.color,
                          }}>
                            {sc.label}
                          </span>
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 500,
                            background: theme.colors.bgTertiary,
                            color: theme.colors.textSecondary,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}>
                            {request.leaveType === "ANNUAL" ? icons.sun : icons.heart}
                            {request.leaveType === "ANNUAL" ? "Annual" : "Sick"}
                          </span>
                          <span style={{
                            fontSize: 12,
                            color: theme.colors.textMuted,
                            fontWeight: 500,
                          }}>
                            {request.totalDays} day{Number(request.totalDays) !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Date range */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          color: theme.colors.textSecondary,
                          marginBottom: request.reason || request.reviewNotes ? 10 : 0,
                        }}>
                          {icons.calendar}
                          {formatDate(request.startDate)} → {formatDate(request.endDate)}
                        </div>

                        {/* Reason */}
                        {request.reason && (
                          <div style={{
                            fontSize: 13,
                            color: theme.colors.textPrimary,
                            padding: "10px 14px",
                            background: theme.colors.bgTertiary,
                            borderRadius: 10,
                            marginTop: 8,
                          }}>
                            <span style={{ fontWeight: 600, color: theme.colors.textSecondary, fontSize: 12 }}>Reason: </span>
                            {request.reason}
                          </div>
                        )}

                        {/* Approval Notes */}
                        {request.status === "APPROVED" && request.reviewNotes && (
                          <div style={{
                            fontSize: 13,
                            color: theme.colors.success,
                            padding: "10px 14px",
                            background: theme.colors.successBg,
                            borderRadius: 10,
                            marginTop: 8,
                          }}>
                            <span style={{ fontWeight: 600, fontSize: 12 }}>Approval Notes: </span>
                            {request.reviewNotes}
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {request.status === "REJECTED" && request.reviewNotes && (
                          <div style={{
                            fontSize: 13,
                            color: theme.colors.error,
                            padding: "10px 14px",
                            background: theme.colors.errorBg,
                            borderRadius: 10,
                            marginTop: 8,
                          }}>
                            <span style={{ fontWeight: 600, fontSize: 12 }}>Rejection Reason: </span>
                            {request.reviewNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
