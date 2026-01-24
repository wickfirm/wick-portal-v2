"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface User {
  id: string;
  name: string;
  email: string;
  agencyId?: string;
}

interface Manager {
  id: string;
  user: {
    id: string;
    name: string;
  };
}

export default function AddEmployeePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [hrSettings, setHrSettings] = useState<any>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    userId: "",
    employeeNumber: "",
    jobTitle: "",
    department: "",
    employmentType: "FULL_TIME",
    startDate: "",
    annualLeaveEntitlement: 21,
    sickLeaveEntitlement: 10,
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
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current user's agency from session hook
      const currentUserAgencyId = (session?.user as any)?.agencyId;

      if (!currentUserAgencyId) {
        console.error("No agency ID found in session");
        setLoading(false);
        return;
      }

      // Load users without employee profiles
      const usersRes = await fetch("/api/users");
      const allUsers = await usersRes.json();

      // Load existing employees to filter out and get managers
      const employeesRes = await fetch("/api/hr/employees");
      const employees = await employeesRes.json();

      const employeeUserIds = employees.map((e: any) => e.userId);
      
      // Filter: Same agency + No employee profile
      const availableUsers = allUsers.filter(
        (u: User) => 
          u.agencyId === currentUserAgencyId && 
          !employeeUserIds.includes(u.id)
      );

      console.log("Current agency:", currentUserAgencyId);
      console.log("All users:", allUsers.length);
      console.log("Filtered users:", availableUsers.length);

      setUsers(availableUsers);
      setManagers(employees);

      // Extract unique departments from existing employees
      const uniqueDepts = Array.from(
        new Set(employees.map((e: any) => e.department).filter(Boolean))
      ) as string[];
      setDepartments(uniqueDepts.sort());

      // Load HR settings for default entitlements
      const settingsRes = await fetch("/api/hr/settings");
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setHrSettings(settings);
        setFormData((prev) => ({
          ...prev,
          annualLeaveEntitlement: Number(settings.annualLeaveEntitlement),
          sickLeaveEntitlement: Number(settings.sickLeaveEntitlement),
        }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to create employee");
        setSaving(false);
        return;
      }

      alert("Employee created successfully!");
      router.push("/dashboard/hr/employees");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create employee");
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ height: "1rem", width: "150px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "1rem" }}></div>
            <div style={{ height: "2rem", width: "250px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "0.5rem" }}></div>
            <div style={{ height: "1rem", width: "350px", background: "#E5E7EB", borderRadius: "4px" }}></div>
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

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
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
            Add Employee
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Create a new employee profile for a team member
          </p>
        </div>

        {users.length === 0 ? (
          <div
            style={{
              background: "white",
              padding: "3rem",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <p style={{ color: theme.colors.textSecondary, marginBottom: "0.5rem", fontSize: "1rem", fontWeight: "600" }}>
              No users available to add as employees.
            </p>
            <p style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "2rem" }}>
              All users already have employee profiles.
            </p>
            <Link
              href="/team"
              style={{
                padding: "0.75rem 1.5rem",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
                display: "inline-block",
              }}
            >
              + Create New User in Team Section
            </Link>
            <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "1.5rem", lineHeight: "1.5" }}>
              💡 To add a new employee: First create a user account in the Team section,<br />
              then return here to create their employee profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                background: "white",
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
              }}
            >
              {/* User Selection */}
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                  Team Member
                </h2>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Select User *
                  </label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">-- Select a user --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "2rem 0" }} />

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
                      placeholder="e.g., Senior Developer"
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

              {/* Leave Entitlements */}
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                  Leave Entitlements
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Annual Leave (days/year)
                    </label>
                    <input
                      type="number"
                      value={formData.annualLeaveEntitlement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          annualLeaveEntitlement: parseInt(e.target.value),
                        })
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
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Sick Leave (days/year)
                    </label>
                    <input
                      type="number"
                      value={formData.sickLeaveEntitlement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sickLeaveEntitlement: parseInt(e.target.value),
                        })
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
                {hrSettings && (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: theme.colors.textSecondary,
                      marginTop: "0.5rem",
                    }}
                  >
                    Default from HR Settings: {hrSettings.annualLeaveEntitlement} annual,{" "}
                    {hrSettings.sickLeaveEntitlement} sick
                  </p>
                )}
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "2rem 0" }} />

              {/* Emergency Contact */}
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                  Emergency Contact (Optional)
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
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContactName: e.target.value })
                      }
                      placeholder="Emergency contact name"
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
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContactPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, emergencyContactPhone: e.target.value })
                        }
                        placeholder="+971 50 123 4567"
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
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactRelation}
                        onChange={(e) =>
                          setFormData({ ...formData, emergencyContactRelation: e.target.value })
                        }
                        placeholder="e.g., Spouse, Parent"
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

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
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
                  disabled={saving}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: theme.colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? "Creating..." : "Create Employee"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
