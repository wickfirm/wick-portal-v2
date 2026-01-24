"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from "lucide-react";

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
  const { data: session } = useSession();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load employee profile
      const profileRes = await fetch("/api/hr/employees");
      const profiles = await profileRes.json();
      
      // Find current user's profile
      const myProfile = profiles.find(
        (p: any) => p.user.email === session?.user?.email
      );
      setProfile(myProfile || null);

      // Load leave requests
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
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Employee Profile
              </h3>
              <p className="text-gray-600 mb-4">
                Your employee profile hasn't been created yet. Please contact
                your HR administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Leave</h1>
          <p className="text-gray-600 mt-1">
            Manage your leave requests and view your balance
          </p>
        </div>
        <Button
          onClick={() => setShowRequestForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </Button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Annual Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-blue-600">
                {profile.annualLeaveBalance}
              </span>
              <span className="text-gray-500 mb-1">
                / {profile.annualLeaveEntitlement} days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sick Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-green-600">
                {profile.sickLeaveBalance}
              </span>
              <span className="text-gray-500 mb-1">
                / {profile.sickLeaveEntitlement} days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-yellow-600">
                {leaveRequests.filter((r) => r.status === "PENDING").length}
              </span>
              <span className="text-gray-500 mb-1">awaiting approval</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            My Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Leave Requests
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any leave requests yet.
              </p>
              <Button onClick={() => setShowRequestForm(true)}>
                Request Your First Leave
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant="outline"
                          className={getStatusColor(request.status)}
                        >
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </Badge>
                        <Badge variant="outline">
                          {request.leaveType === "ANNUAL"
                            ? "Annual Leave"
                            : "Sick Leave"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {request.totalDays}{" "}
                          {Number(request.totalDays) === 1 ? "day" : "days"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>
                          <strong>From:</strong> {formatDate(request.startDate)}
                        </span>
                        <span>
                          <strong>To:</strong> {formatDate(request.endDate)}
                        </span>
                      </div>

                      {request.reason && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      )}

                      {request.status === "APPROVED" && request.reviewer && (
                        <p className="text-sm text-green-700">
                          <strong>Approved by:</strong> {request.reviewer.name}
                          {request.reviewedAt &&
                            ` on ${formatDate(request.reviewedAt)}`}
                        </p>
                      )}

                      {request.status === "REJECTED" && (
                        <>
                          {request.reviewer && (
                            <p className="text-sm text-red-700">
                              <strong>Rejected by:</strong>{" "}
                              {request.reviewer.name}
                              {request.reviewedAt &&
                                ` on ${formatDate(request.reviewedAt)}`}
                            </p>
                          )}
                          {request.reviewNotes && (
                            <p className="text-sm text-red-700 mt-1">
                              <strong>Reason:</strong> {request.reviewNotes}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {request.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to cancel this leave request?"
                            )
                          ) {
                            try {
                              await fetch(
                                `/api/hr/leave-requests/${request.id}`,
                                {
                                  method: "DELETE",
                                }
                              );
                              loadData();
                            } catch (error) {
                              console.error("Error cancelling request:", error);
                            }
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Form Modal - Will add in next iteration */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Request Leave Form (Coming Soon)
            </h3>
            <p className="text-gray-600 mb-4">
              For now, use the browser console to submit leave requests. UI form
              coming next!
            </p>
            <Button onClick={() => setShowRequestForm(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
