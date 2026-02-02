"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface Manager {
  id: string;
  user: {
    id: string;
    name: string;
  };
}

export default function EditEmployeePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [employee, setEmployee] = useState<any>(null);

  const [formData, setFormData] = useState({
    employeeNumber: "",
    jobTitle: "",
    department: "",
    employmentType: "FULL_TIME",
    weeklyCapacity: 40,
    startDate: "",
    endDate: "",
    annualLeaveEntitlement: 21,
    sickLeaveEntitlement: 10,
    annualLeaveBalance: 21,
    sickLeaveBalance: 10,
    managerId: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
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
  }, [status, employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load employee
      const empRes = await fetch(`/api/hr/employees/${employeeId}`);
      if (!empRes.ok) {
        alert("Employee not found");
        router.push("/dashboard/hr/employees");
        return;
      }
      const empData = await empRes.json();
      setEmployee(empData);

      // Load managers
      const managersRes = await fetch("/api/hr/employees");
      const allEmployees = await managersRes.json();
      setManagers(allEmployees.filter((e: any) => e.id !== employeeId));

      // Extract departments from all employees
      const depts = Array.from(new Set(allEmployees.map((e: any) => e.department).filter(Boolean))) as string[];
      setDepartments(depts.sort());

      // Populate form
      setFormData({
        employeeNumber: empData.employeeNumber || "",
        jobTitle: empData.jobTitle || "",
        department: empData.department || "",
        employmentType: empData.employmentType || "FULL_TIME",
        weeklyCapacity: empData.weeklyCapacity != null ? Number(empData.weeklyCapacity) : 40,
        startDate: empData.startDate ? empData.startDate.split("T")[0] : "",
        endDate: empData.endDate ? empData.endDate.split("T")[0] : "",
        annualLeaveEntitlement: Number(empData.annualLeaveEntitlement),
        sickLeaveEntitlement: Number(empData.sickLeaveEntitlement),
        annualLeaveBalance: Number(empData.annualLeaveBalance),
        sickLeaveBalance: Number(empData.sickLeaveBalance),
        managerId: empData.managerId || "",
        emergencyContactName: empData.emergencyContactName || "",
        emergencyContactPhone: empData.emergencyContactPhone || "",
        emergencyContactRelation: empData.emergencyContactRelation || "",
      });
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load employee");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/hr/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to update employee");
        setSaving(false);
        return;
      }

      alert("Employee updated successfully!");
      router.push("/dashboard/hr/employees");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update employee");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${employee?.user?.name}'s employee profile?\n\nThis will:\n- Remove their employee profile\n- Delete their leave history\n- Keep their user account\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to delete employee");
        setDeleting(false);
        return;
      }

      alert("Employee profile deleted successfully");
      router.push("/dashboard/hr/employees");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete employee");
      setDeleting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto", marginLeft: 60, transition: "margin-left 0.2s" }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ height: "1rem", width: "150px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "1rem" }}></div>
            <div style={{ height: "2rem", width: "300px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "0.5rem" }}></div>
            <div style={{ height: "1rem", width: "400px", background: "#E5E7EB", borderRadius: "4px" }}></div>
          </div>

          {/* Form Skeleton */}
          <div style={{ background: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ marginBottom: "2rem" }}>
                <div style={{ height: "1.5rem", width: "200px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "1rem" }}></div>
                <div style={{ height: "3rem", width: "100%", background: "#E5E7EB", borderRadius: "8px", marginBottom: "0.5rem" }}></div>
                <div style={{ height: "3rem", width: "100%", background: "#E5E7EB", borderRadius: "8px" }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: "2rem", marginLeft: 60, transition: "margin-left 0.2s", color: theme.colors.textSecondary }}>
          Employee not found
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto", marginLeft: 60, transition: "margin-left 0.2s" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href="/dashboard/hr/employees"
            style={{ color: theme.colors.textSecondary, textDecoration: "none" }}
          >
            ← Back to Employees
          </Link>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            Edit Employee: {employee.user.name}
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Update employee profile and leave settings
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
            }}
          >
            {/* User Info (Read-only) */}
            <div style={{ marginBottom: "2rem", padding: "1rem", background: "#F9FAFB", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
                User Account
              </div>
              <div style={{ fontWeight: "600" }}>{employee.user.name}</div>
              <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary }}>
                {employee.user.email}
              </div>
            </div>

            {/* Employment Details */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                Employment Details
              </h2>
              <div style={{ display: "grid", gap: "1.5rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Employee Number
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeNumber: e.target.value })
                    }
                    placeholder="e.g., EMP011"
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
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
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
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Department *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">-- Select a department --</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                    Manage departments in Settings → HR Settings
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) =>
                        setFormData({ ...formData, employmentType: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Weekly Capacity (Hours)
                  </label>
                  <input
                    type="number"
                    value={formData.weeklyCapacity}
                    onChange={(e) =>
                      setFormData({ ...formData, weeklyCapacity: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    max="168"
                    step="0.5"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                  <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                    Max hours per week (e.g. 40 for full-time, 20 for part-time). Used by Jarvis for availability reports.
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                  <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                    Leave blank if currently employed
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Manager
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">-- No manager --</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.user.id}>
                        {manager.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "2rem 0" }} />

            {/* Leave Entitlements & Balances */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                Leave Management
              </h2>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                  Annual Entitlements (Days per Year)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                      Annual Leave Entitlement
                    </label>
                    <input
                      type="number"
                      value={formData.annualLeaveEntitlement}
                      onChange={(e) =>
                        setFormData({ ...formData, annualLeaveEntitlement: parseInt(e.target.value) })
                      }
                      min="0"
                      max="365"
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
                      Sick Leave Entitlement
                    </label>
                    <input
                      type="number"
                      value={formData.sickLeaveEntitlement}
                      onChange={(e) =>
                        setFormData({ ...formData, sickLeaveEntitlement: parseInt(e.target.value) })
                      }
                      min="0"
                      max="365"
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
              </div>

              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                  Current Balances (Remaining Days)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                      Annual Leave Balance
                    </label>
                    <input
                      type="number"
                      value={formData.annualLeaveBalance}
                      onChange={(e) =>
                        setFormData({ ...formData, annualLeaveBalance: parseInt(e.target.value) })
                      }
                      min="0"
                      max="365"
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
                      Sick Leave Balance
                    </label>
                    <input
                      type="number"
                      value={formData.sickLeaveBalance}
                      onChange={(e) =>
                        setFormData({ ...formData, sickLeaveBalance: parseInt(e.target.value) })
                      }
                      min="0"
                      max="365"
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
                <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.5rem" }}>
                  Adjust balances manually (e.g., for carry-over, corrections)
                </p>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "2rem 0" }} />

            {/* Emergency Contact */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                Emergency Contact
              </h2>
              <div style={{ display: "grid", gap: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyContactName: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContactPhone: e.target.value })
                      }
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
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactRelation}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContactRelation: e.target.value })
                      }
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
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#EF4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (deleting || saving) ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  opacity: (deleting || saving) ? 0.5 : 1,
                }}
              >
                {deleting ? "Deleting..." : "Delete Employee"}
              </button>

              <div style={{ display: "flex", gap: "1rem" }}>
                <Link
                  href="/dashboard/hr/employees"
                  style={{
                    padding: "0.75rem 1.5rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: theme.colors.textPrimary,
                    fontSize: "0.875rem",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || deleting}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: theme.colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: (saving || deleting) ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    opacity: (saving || deleting) ? 0.5 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
