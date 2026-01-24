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
  employee: {
    user: {
      name: string;
      email: string;
    };
    jobTitle?: string;
    department?: string;
  };
}

export default function TeamLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | LeaveStatus>("PENDING");
  const [processing, setProcessing] = useState<string | null>(null);

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
      year: "numeric"
    });
  };

  const filteredRequests = filter === "ALL" 
    ? requests 
    : requests.filter(r => r.status === filter);

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <div style={{ padding: "2rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <Link href="/dashboard/hr" style={{ color: theme.colors.textSecondary, textDecoration: "none" }}>
              ← My Leave
            </Link>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
            Team Leave Requests
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Review and approve team leave requests
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
              Pending Approval
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#F59E0B" }}>
              {pendingCount}
            </div>
          </div>
          
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
              Total Requests
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: theme.colors.textPrimary }}>
              {requests.length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #E5E7EB", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "0.5rem 1rem",
                  border: filter === f ? `2px solid ${theme.colors.primary}` : "1px solid #E5E7EB",
                  borderRadius: "8px",
                  background: filter === f ? `${theme.colors.primary}10` : "white",
                  color: filter === f ? theme.colors.primary : theme.colors.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: filter === f ? "600" : "400"
                }}
              >
                {f} {f === "PENDING" && pendingCount > 0 && `(${pendingCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: theme.colors.textSecondary }}>
              Loading requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: theme.colors.textSecondary }}>
              No {filter.toLowerCase()} requests
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredRequests.map((request) => (
                <div key={request.id} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      {/* Employee Info */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <div style={{ fontWeight: "600", fontSize: "1rem", marginBottom: "0.25rem" }}>
                          {request.employee.user.name}
                        </div>
                        {request.employee.jobTitle && (
                          <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary }}>
                            {request.employee.jobTitle}
                            {request.employee.department && ` • ${request.employee.department}`}
                          </div>
                        )}
                      </div>

                      {/* Status and Details */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                        <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600", background: getStatusColor(request.status), color: getStatusTextColor(request.status) }}>
                          {request.status}
                        </span>
                        <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", background: "#F3F4F6", color: "#374151" }}>
                          {request.leaveType === "ANNUAL" ? "Annual" : "Sick"}
                        </span>
                        <span style={{ fontSize: "0.875rem", color: theme.colors.textSecondary }}>
                          {request.totalDays} days
                        </span>
                      </div>

                      <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
                        <strong>From:</strong> {formatDate(request.startDate)} → <strong>To:</strong> {formatDate(request.endDate)}
                      </div>

                      {request.reason && (
                        <div style={{ fontSize: "0.875rem", color: theme.colors.textPrimary, marginTop: "0.5rem", padding: "0.75rem", background: "#F9FAFB", borderRadius: "6px" }}>
                          <strong>Reason:</strong> {request.reason}
                        </div>
                      )}

                      {/* Show Review Notes for Approved/Rejected */}
                      {request.status === "APPROVED" && (
                        <div style={{ fontSize: "0.875rem", color: "#065F46", marginTop: "0.5rem", padding: "0.75rem", background: "#ECFDF5", borderRadius: "6px" }}>
                          <strong>✓ Approval Notes:</strong> {request.reviewNotes || "No notes provided"}
                        </div>
                      )}

                      {request.status === "REJECTED" && (
                        <div style={{ fontSize: "0.875rem", color: "#991B1B", marginTop: "0.5rem", padding: "0.75rem", background: "#FEF2F2", borderRadius: "6px" }}>
                          <strong>✗ Rejection Reason:</strong> {request.reviewNotes || "No reason provided"}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {request.status === "PENDING" && (
                      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processing === request.id}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#10B981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: processing === request.id ? "not-allowed" : "pointer",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            opacity: processing === request.id ? 0.5 : 1
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processing === request.id}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#EF4444",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: processing === request.id ? "not-allowed" : "pointer",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            opacity: processing === request.id ? 0.5 : 1
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
