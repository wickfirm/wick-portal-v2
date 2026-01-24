"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface Employee {
  id: string;
  employeeNumber?: string;
  jobTitle?: string;
  department?: string;
  annualLeaveBalance: string;
  sickLeaveBalance: string;
  annualLeaveEntitlement: string;
  sickLeaveEntitlement: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  manager?: {
    name: string;
  };
}

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadEmployees();
    }
  }, [status]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  
  const filteredEmployees = filterDept === "ALL" 
    ? employees 
    : employees.filter(e => e.department === filterDept);

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
            Employee Management
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            View and manage employee profiles
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
              Total Employees
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: theme.colors.textPrimary }}>
              {employees.length}
            </div>
          </div>

          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
              Departments
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: theme.colors.textPrimary }}>
              {departments.length}
            </div>
          </div>
        </div>

        {/* Filters */}
        {departments.length > 0 && (
          <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #E5E7EB", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setFilterDept("ALL")}
                style={{
                  padding: "0.5rem 1rem",
                  border: filterDept === "ALL" ? `2px solid ${theme.colors.primary}` : "1px solid #E5E7EB",
                  borderRadius: "8px",
                  background: filterDept === "ALL" ? `${theme.colors.primary}10` : "white",
                  color: filterDept === "ALL" ? theme.colors.primary : theme.colors.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: filterDept === "ALL" ? "600" : "400"
                }}
              >
                All Departments ({employees.length})
              </button>
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setFilterDept(dept!)}
                  style={{
                    padding: "0.5rem 1rem",
                    border: filterDept === dept ? `2px solid ${theme.colors.primary}` : "1px solid #E5E7EB",
                    borderRadius: "8px",
                    background: filterDept === dept ? `${theme.colors.primary}10` : "white",
                    color: filterDept === dept ? theme.colors.primary : theme.colors.textSecondary,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: filterDept === dept ? "600" : "400"
                  }}
                >
                  {dept} ({employees.filter(e => e.department === dept).length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Employee List */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: theme.colors.textSecondary }}>
              Loading employees...
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  <tr>
                    <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                      Employee
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                      Department
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                      Manager
                    </th>
                    <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                      Annual Leave
                    </th>
                    <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase" }}>
                      Sick Leave
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <td style={{ padding: "1rem" }}>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                            {employee.user.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: theme.colors.textSecondary }}>
                            {employee.jobTitle || employee.user.email}
                          </div>
                          {employee.employeeNumber && (
                            <div style={{ fontSize: "0.75rem", color: theme.colors.textSecondary }}>
                              #{employee.employeeNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                        {employee.department || "—"}
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                        {employee.manager?.name || "—"}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#2563EB" }}>
                          {employee.annualLeaveBalance}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: theme.colors.textSecondary }}>
                          / {employee.annualLeaveEntitlement}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#10B981" }}>
                          {employee.sickLeaveBalance}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: theme.colors.textSecondary }}>
                          / {employee.sickLeaveEntitlement}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
