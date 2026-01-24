"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
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

export default function MyLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case "PENDING": return "#FEF3C7";
      case "APPROVED": return "#D1FAE5";
      case "REJECTED": return "#FEE2E2";
      case "CANCELLED": return "#F3F4F6";
    }
  };

  const getStatusTextColor = (status: LeaveStatus) => {
    switch (status) {
      case "PENDING": return "#92400E";
      case "APPROVED": return "#065F46";
      case "REJECTED": return "#991B1B";
      case "CANCELLED": return "#374151";
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
        <div style={{ padding: "2rem" }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ height: "2rem", width: "200px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "0.5rem" }}></div>
            <div style={{ height: "1rem", width: "300px", background: "#E5E7EB", borderRadius: "4px" }}></div>
          </div>

          {/* Cards Skeleton */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
                <div style={{ height: "0.875rem", width: "120px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "0.5rem" }}></div>
                <div style={{ height: "2.5rem", width: "80px", background: "#E5E7EB", borderRadius: "4px" }}></div>
              </div>
            ))}
          </div>

          {/* Requests Skeleton */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <div style={{ height: "1.25rem", width: "200px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "1.5rem" }}></div>
            {[1, 2].map((i) => (
              <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
                <div style={{ height: "1.5rem", width: "150px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "0.5rem" }}></div>
                <div style={{ height: "1rem", width: "250px", background: "#E5E7EB", borderRadius: "4px" }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: "2rem" }}>
          <div style={{ background: "white", padding: "3rem", borderRadius: "12px", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              No Employee Profile
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>
              Contact your HR administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = leaveRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <div style={{ padding: "2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
                My Leave
              </h1>
              <p style={{ color: theme.colors.textSecondary }}>
                Manage your leave requests and view your balance
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {/* Quick Links for Managers/Admins */}
              {(session?.user as any)?.role !== "MEMBER" && (
                <>
                  <Link 
                    href="/dashboard/hr/team"
                    style={{ 
                      padding: "0.75rem 1.5rem",
                      border: `1px solid ${theme.colors.primary}`,
                      color: theme.colors.primary,
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    👥 Team Leave
                  </Link>
                  <Link 
                    href="/dashboard/hr/employees"
                    style={{ 
                      padding: "0.75rem 1.5rem",
                      border: "1px solid #E5E7EB",
                      color: theme.colors.textPrimary,
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    📋 Employees
                  </Link>
                </>
              )}
              <button
                onClick={() => setShowRequestForm(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: theme.colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <span>+</span> Request Leave
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
              Annual Leave Balance
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#2563EB" }}>
                {profile.annualLeaveBalance}
              </span>
              <span style={{ color: theme.colors.textSecondary, marginBottom: "0.25rem" }}>
                / {profile.annualLeaveEntitlement} days
              </span>
            </div>
          </div>

          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
              Sick Leave Balance
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#10B981" }}>
                {profile.sickLeaveBalance}
              </span>
              <span style={{ color: theme.colors.textSecondary, marginBottom: "0.25rem" }}>
                / {profile.sickLeaveEntitlement} days
              </span>
            </div>
          </div>

          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
              Pending Requests
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#F59E0B" }}>
                {pendingCount}
              </span>
              <span style={{ color: theme.colors.textSecondary, marginBottom: "0.25rem" }}>
                awaiting approval
              </span>
            </div>
          </div>
        </div>

        <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>
            📅 My Leave Requests
          </h2>

          {leaveRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p style={{ color: theme.colors.textSecondary }}>
                No leave requests yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {leaveRequests.map((request) => (
                <div key={request.id} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600", background: getStatusColor(request.status), color: getStatusTextColor(request.status) }}>
                          {request.status}
                        </span>
                        <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", background: "#F3F4F6", color: "#374151" }}>
                          {request.leaveType === "ANNUAL" ? "Annual Leave" : "Sick Leave"}
                        </span>
                        <span style={{ fontSize: "0.875rem", color: theme.colors.textSecondary }}>
                          {request.totalDays} {Number(request.totalDays) === 1 ? "day" : "days"}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
                        <span><strong>From:</strong> {formatDate(request.startDate)}</span>
                        <span><strong>To:</strong> {formatDate(request.endDate)}</span>
                      </div>

                      {request.reason && (
                        <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      )}

                      {request.status === "APPROVED" && request.reviewer && (
                        <>
                          <p style={{ fontSize: "0.875rem", color: "#065F46" }}>
                            <strong>Approved by:</strong> {request.reviewer.name}
                            {request.reviewedAt && ` on ${formatDate(request.reviewedAt)}`}
                          </p>
                          {request.reviewNotes && (
                            <p style={{ fontSize: "0.875rem", color: "#065F46", marginTop: "0.25rem" }}>
                              <strong>Notes:</strong> {request.reviewNotes}
                            </p>
                          )}
                        </>
                      )}

                      {request.status === "REJECTED" && (
                        <>
                          {request.reviewer && (
                            <p style={{ fontSize: "0.875rem", color: "#991B1B" }}>
                              <strong>Rejected by:</strong> {request.reviewer.name}
                            </p>
                          )}
                          {request.reviewNotes && (
                            <p style={{ fontSize: "0.875rem", color: "#991B1B", marginTop: "0.25rem" }}>
                              <strong>Reason:</strong> {request.reviewNotes}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {request.status === "PENDING" && (
                      <button onClick={() => cancelRequest(request.id)} style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", border: "1px solid #E5E7EB", borderRadius: "6px", background: "white", cursor: "pointer" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leave Request Form Modal */}
      {showRequestForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "2rem", maxWidth: "500px", width: "90%", maxHeight: "90vh", overflow: "auto" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1.5rem" }}>
              Request Leave
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              
              const formData = new FormData(e.currentTarget);
              const data = {
                leaveType: formData.get("leaveType"),
                startDate: formData.get("startDate"),
                endDate: formData.get("endDate"),
                reason: formData.get("reason")
              };

              try {
                const res = await fetch("/api/hr/leave-requests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data)
                });

                if (!res.ok) {
                  const error = await res.json();
                  alert(error.error || "Failed to submit request");
                  setSubmitting(false);
                  return;
                }

                alert("Leave request submitted successfully!");
                setShowRequestForm(false);
                loadData();
              } catch (error) {
                console.error("Error:", error);
                alert("Failed to submit request");
              } finally {
                setSubmitting(false);
              }
            }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Leave Type
                </label>
                <select
                  name="leaveType"
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem" }}
                >
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Reason (Optional)
                </label>
                <textarea
                  name="reason"
                  rows={3}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem", resize: "vertical" }}
                  placeholder="Why are you taking leave?"
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  disabled={submitting}
                  style={{ padding: "0.75rem 1.5rem", border: "1px solid #E5E7EB", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "0.75rem 1.5rem", background: theme.colors.primary, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600" }}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
