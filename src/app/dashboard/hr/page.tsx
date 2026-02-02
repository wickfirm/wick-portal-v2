"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import LeaveRequestForm from "./leave-request-form";
import { theme } from "@/lib/theme";

type LeaveType = "ANNUAL" | "SICK";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface LeaveRequest {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: string;
  reason?: string;
  status: LeaveStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  reviewer?: {
    name: string;
    email: string;
  };
}

interface EmployeeProfile {
  id: string;
  annualLeaveBalance: string;
  sickLeaveBalance: string;
  annualLeaveEntitlement: string;
  sickLeaveEntitlement: string;
  user: {
    name: string;
    email: string;
  };
}

const icons = {
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  sun: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  heart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  clipboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  emptyCalendar: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

const statusConfig: Record<LeaveStatus, { bg: string; color: string; label: string }> = {
  PENDING: { bg: theme.colors.warningBg, color: "#92400E", label: "Pending" },
  APPROVED: { bg: theme.colors.successBg, color: theme.colors.success, label: "Approved" },
  REJECTED: { bg: theme.colors.errorBg, color: theme.colors.error, label: "Rejected" },
  CANCELLED: { bg: theme.colors.bgTertiary, color: theme.colors.textSecondary, label: "Cancelled" },
};

export default function MyLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [mounted, setMounted] = useState(false);

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
      loadData();
    }
  }, [status]);

  useEffect(() => { setMounted(true); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await fetch("/api/hr/employees");
      const profiles = await profileRes.json();
      const myProfile = profiles.find(
        (p: any) => p.user.email === session?.user?.email
      );
      setProfile(myProfile || null);
      const requestsRes = await fetch("/api/hr/leave-requests");
      const requests = await requestsRes.json();
      setLeaveRequests(requests);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const cancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    try {
      await fetch(`/api/hr/leave-requests/${requestId}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert("Failed to cancel request");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
          {/* Header Skeleton */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ width: 160, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ width: 280, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 120, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
              <div style={{ width: 140, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
            </div>
          </div>
          {/* Stat Cards Skeleton */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: theme.colors.bgSecondary, padding: 22, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.bgTertiary }} />
                  <div style={{ width: 60, height: 32, background: theme.colors.bgTertiary, borderRadius: 6 }} />
                </div>
                <div style={{ width: 120, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          {/* Requests Skeleton */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: `1px solid ${theme.colors.bgTertiary}` }}>
              <div style={{ width: 180, height: 20, background: theme.colors.bgTertiary, borderRadius: 6 }} />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: "18px 22px", borderBottom: i < 3 ? `1px solid ${theme.colors.bgTertiary}` : "none", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: theme.colors.bgTertiary }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: 200, height: 16, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: 280, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                </div>
                <div style={{ width: 70, height: 26, background: theme.colors.bgTertiary, borderRadius: 12 }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 64,
            borderRadius: 16,
            textAlign: "center",
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
              {icons.emptyCalendar}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
              No Employee Profile
            </h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
              Contact your HR administrator to set up your employee profile.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const pendingCount = leaveRequests.filter((r) => r.status === "PENDING").length;
  const userRole = (session?.user as any)?.role;

  const statCards = [
    {
      label: "Annual Leave Balance",
      value: profile.annualLeaveBalance,
      sub: `/ ${profile.annualLeaveEntitlement} days`,
      icon: icons.sun,
      color: theme.colors.primary,
      bg: "rgba(118,82,124,0.08)",
    },
    {
      label: "Sick Leave Balance",
      value: profile.sickLeaveBalance,
      sub: `/ ${profile.sickLeaveEntitlement} days`,
      icon: icons.heart,
      color: theme.colors.success,
      bg: theme.colors.successBg,
    },
    {
      label: "Pending Requests",
      value: pendingCount,
      sub: "awaiting approval",
      icon: icons.clock,
      color: "#d97706",
      bg: theme.colors.warningBg,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, ...anim(0.05) }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>
              My Leave
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
              Manage your leave requests and view your balance
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {userRole !== "MEMBER" && (
              <>
                <Link
                  href="/dashboard/hr/team"
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${theme.colors.primary}`,
                    color: theme.colors.primary,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s ease",
                  }}
                >
                  {icons.users} Team Leave
                </Link>
                <Link
                  href="/dashboard/hr/employees"
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${theme.colors.borderLight}`,
                    color: theme.colors.textPrimary,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s ease",
                  }}
                >
                  {icons.clipboard} Employees
                </Link>
              </>
            )}
            <button
              onClick={() => setShowRequestForm(true)}
              style={{
                padding: "10px 22px",
                background: theme.gradients.primary,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: theme.shadows.button,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {icons.plus} Request Leave
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28, ...anim(0.1) }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: theme.colors.bgSecondary,
                padding: "20px 22px",
                borderRadius: 14,
                border: `1px solid ${theme.colors.borderLight}`,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11,
                  background: card.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: card.color, flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{card.sub}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 500 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Leave Requests */}
        <div style={{ ...anim(0.15) }}>
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 16, border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: `1px solid ${theme.colors.bgTertiary}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ color: theme.colors.primary, display: "flex", alignItems: "center" }}>{icons.calendar}</div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
                My Leave Requests
              </h2>
              <span style={{ fontSize: 12, color: theme.colors.textMuted, marginLeft: "auto" }}>
                {leaveRequests.length} total
              </span>
            </div>

            {leaveRequests.length === 0 ? (
              <div style={{ padding: 56, textAlign: "center" }}>
                <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
                  {icons.emptyCalendar}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
                  No leave requests yet
                </div>
                <div style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  Click "Request Leave" to submit your first request
                </div>
              </div>
            ) : (
              leaveRequests.map((request, idx) => {
                const sc = statusConfig[request.status];
                return (
                  <div
                    key={request.id}
                    style={{
                      padding: "18px 22px",
                      borderBottom: idx < leaveRequests.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.colors.bgPrimary}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Type Icon */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: request.leaveType === "ANNUAL" ? "rgba(118,82,124,0.08)" : theme.colors.successBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: request.leaveType === "ANNUAL" ? theme.colors.primary : theme.colors.success,
                    }}>
                      {request.leaveType === "ANNUAL" ? icons.sun : icons.heart}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>
                          {request.leaveType === "ANNUAL" ? "Annual Leave" : "Sick Leave"}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                          background: sc.bg, color: sc.color,
                        }}>
                          {sc.label}
                        </span>
                        <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                          {request.totalDays} {Number(request.totalDays) === 1 ? "day" : "days"}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 16, fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 }}>
                        <span>{formatDate(request.startDate)} — {formatDate(request.endDate)}</span>
                      </div>

                      {request.reason && (
                        <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
                          {request.reason}
                        </div>
                      )}

                      {request.status === "APPROVED" && request.reviewer && (
                        <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 6 }}>
                          Approved by {request.reviewer.name}{request.reviewedAt && ` on ${formatDate(request.reviewedAt)}`}
                          {request.reviewNotes && ` — ${request.reviewNotes}`}
                        </div>
                      )}

                      {request.status === "REJECTED" && (
                        <div style={{ fontSize: 12, color: theme.colors.error, marginTop: 6 }}>
                          {request.reviewer && `Rejected by ${request.reviewer.name}`}
                          {request.reviewNotes && ` — ${request.reviewNotes}`}
                        </div>
                      )}
                    </div>

                    {/* Cancel Button */}
                    {request.status === "PENDING" && (
                      <button
                        onClick={() => cancelRequest(request.id)}
                        style={{
                          padding: "8px 16px",
                          fontSize: 12,
                          fontWeight: 500,
                          border: `1px solid ${theme.colors.borderLight}`,
                          borderRadius: 8,
                          background: theme.colors.bgSecondary,
                          color: theme.colors.textSecondary,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.error; e.currentTarget.style.color = theme.colors.error; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.borderLight; e.currentTarget.style.color = theme.colors.textSecondary; }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Leave Request Form Modal */}
      {showRequestForm && (
        <LeaveRequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
