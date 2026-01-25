"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface Employee {
  id: string;
  employeeNumber: string;
  jobTitle: string;
  department: string;
  employmentType: string;
  startDate: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  manager?: {
    user: {
      name: string;
    };
  };
}

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

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

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ).sort();

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || emp.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ height: "2.5rem", width: "200px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "1rem" }}></div>
            <div style={{ height: "1rem", width: "300px", background: "#E5E7EB", borderRadius: "4px" }}></div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ height: "3rem", flex: 1, background: "#E5E7EB", borderRadius: "8px" }}></div>
            <div style={{ height: "3rem", width: "200px", background: "#E5E7EB", borderRadius: "8px" }}></div>
            <div style={{ height: "3rem", width: "150px", background: "#E5E7EB", borderRadius: "8px" }}></div>
          </div>
          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ padding: "1.5rem", borderBottom: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ height: "2.5rem", width: "2.5rem", borderRadius: "50%", background: "#E5E7EB" }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: "1rem", width: "200px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "0.5rem" }}></div>
                    <div style={{ height: "0.875rem", width: "150px", background: "#E5E7EB", borderRadius: "4px" }}></div>
                  </div>
                  <div style={{ height: "2.5rem", width: "100px", background: "#E5E7EB", borderRadius: "6px" }}></div>
                </div>
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
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              Employee Management
            </h1>
            <p style={{ color: theme.colors.textSecondary }}>
              {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link
              href="/dashboard/hr"
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
              ← My Leave
            </Link>
            <Link
              href="/dashboard/hr/team"
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
              Team Leave
            </Link>
            <Link
              href="/dashboard/hr/employees/new"
              style={{
                padding: "0.75rem 1.5rem",
                background: theme.colors.primary,
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              + Add Employee
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          <input
            type="text"
            placeholder="Search by name, email, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "0.875rem",
              minWidth: "200px",
            }}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Employee List */}
        {filteredEmployees.length === 0 ? (
          <div
            style={{
              background: "white",
              padding: "3rem",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <p style={{ color: theme.colors.textSecondary, marginBottom: "1rem" }}>
              {searchTerm || departmentFilter !== "all"
                ? "No employees match your filters"
                : "No employees yet"}
            </p>
            <Link
              href="/dashboard/hr/employees/new"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                background: theme.colors.primary,
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Add First Employee
            </Link>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    background: theme.colors.primary,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    flexShrink: 0,
                  }}
                >
                  {employee.user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: "600", fontSize: "0.9375rem" }}>
                      {employee.user.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: theme.colors.textSecondary,
                        background: "#F3F4F6",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      {employee.employeeNumber}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: theme.colors.textSecondary }}>
                    <span>{employee.jobTitle}</span>
                    <span>•</span>
                    <span>{employee.department}</span>
                    {employee.manager && (
                      <>
                        <span>•</span>
                        <span>Reports to {employee.manager.user.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <Link
                  href={`/dashboard/hr/employees/${employee.id}/edit`}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                    textDecoration: "none",
                    color: theme.colors.textPrimary,
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    flexShrink: 0,
                  }}
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
