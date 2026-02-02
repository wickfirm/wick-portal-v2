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
  } | null;
}

const icons = {
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  briefcase: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  emptyUsers: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

const avatarColors = ["#76527c", "#5f4263", "#3d6b73", "#8a6030", "#34a853"];
function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") loadEmployees();
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
      emp.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const uniqueDepts = new Set(employees.map(e => e.department).filter(Boolean));

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ width: 240, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ width: 180, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 100, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
              <div style={{ width: 100, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
              <div style={{ width: 140, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.bgTertiary }} />
                  <div style={{ width: 48, height: 28, background: theme.colors.bgTertiary, borderRadius: 6 }} />
                </div>
                <div style={{ width: 120, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div style={{ height: 46, background: theme.colors.bgSecondary, borderRadius: 10, marginBottom: 20, border: `1px solid ${theme.colors.borderLight}` }} />
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ padding: "18px 22px", borderBottom: i < 4 ? `1px solid ${theme.colors.bgTertiary}` : "none", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, background: theme.colors.bgTertiary, borderRadius: 12 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: 180, height: 16, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: 260, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, ...anim(0.05) }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>
              Employee Management
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
              {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/dashboard/hr" style={{
              padding: "10px 18px", border: `1px solid ${theme.colors.borderLight}`, borderRadius: 10,
              textDecoration: "none", color: theme.colors.textSecondary, fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s ease",
            }}>
              {icons.arrowLeft} My Leave
            </Link>
            <Link href="/dashboard/hr/team" style={{
              padding: "10px 18px", border: `1px solid ${theme.colors.primary}`, borderRadius: 10,
              textDecoration: "none", color: theme.colors.primary, fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s ease",
            }}>
              {icons.calendar} Team Leave
            </Link>
            <Link href="/dashboard/hr/employees/new" style={{
              padding: "10px 22px", background: theme.gradients.primary, color: "white", borderRadius: 10,
              textDecoration: "none", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
              boxShadow: theme.shadows.button,
            }}>
              {icons.plus} Add Employee
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28, ...anim(0.1) }}>
          {[
            { label: "Total Employees", value: employees.length, icon: icons.users, color: theme.colors.primary, bg: "rgba(118,82,124,0.08)" },
            { label: "Departments", value: uniqueDepts.size, icon: icons.briefcase, color: "#3d6b73", bg: "rgba(61,107,115,0.08)" },
            { label: "Showing", value: filteredEmployees.length, icon: icons.search, color: theme.colors.info, bg: theme.colors.infoBg },
          ].map(card => (
            <div key={card.label} style={{
              background: theme.colors.bgSecondary, padding: "20px 22px", borderRadius: 14,
              border: `1px solid ${theme.colors.borderLight}`, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>{card.icon}</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1 }}>{card.value}</div>
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 500 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", ...anim(0.15) }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.colors.textMuted, display: "flex", alignItems: "center" }}>
              {icons.search}
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%", padding: "10px 16px 10px 40px", borderRadius: 10,
                border: `1px solid ${theme.colors.borderLight}`, background: theme.colors.bgSecondary,
                color: theme.colors.textPrimary, fontSize: 14, outline: "none", transition: "border-color 0.15s",
                boxSizing: "border-box" as const,
              }}
              onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
              onBlur={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: "10px 14px", border: `1px solid ${theme.colors.borderLight}`, borderRadius: 10,
              background: theme.colors.bgSecondary, color: theme.colors.textPrimary, fontSize: 13,
              cursor: "pointer", minWidth: 180, outline: "none", transition: "border-color 0.15s",
            }}
            onFocus={(e: any) => e.currentTarget.style.borderColor = theme.colors.primary}
            onBlur={(e: any) => e.currentTarget.style.borderColor = theme.colors.borderLight}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Employee List */}
        <div style={anim(0.2)}>
          {filteredEmployees.length === 0 ? (
            <div style={{
              background: theme.colors.bgSecondary, borderRadius: 16,
              border: `1px solid ${theme.colors.borderLight}`, padding: 64, textAlign: "center",
            }}>
              <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
                {icons.emptyUsers}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
                {searchTerm || departmentFilter !== "all" ? "No employees match your filters" : "No employees yet"}
              </div>
              <div style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 24 }}>
                {searchTerm || departmentFilter !== "all" ? "Try adjusting your search or filters" : "Add your first employee to get started"}
              </div>
              {!searchTerm && departmentFilter === "all" && (
                <Link href="/dashboard/hr/employees/new" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", background: theme.gradients.primary, color: "white",
                  borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500,
                  boxShadow: theme.shadows.button,
                }}>
                  {icons.plus} Add First Employee
                </Link>
              )}
            </div>
          ) : (
            <div style={{ background: theme.colors.bgSecondary, borderRadius: 16, border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden" }}>
              {filteredEmployees.map((employee, idx) => (
                <div
                  key={employee.id}
                  style={{
                    padding: "16px 22px",
                    borderBottom: idx < filteredEmployees.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                    display: "flex", alignItems: "center", gap: 14,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.colors.bgPrimary}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: getAvatarColor(employee.user?.name || "?"),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 600, fontSize: 16, flexShrink: 0,
                  }}>
                    {employee.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary }}>
                        {employee.user?.name || "Unknown"}
                      </span>
                      <span style={{
                        fontSize: 11, color: theme.colors.textMuted,
                        background: theme.colors.bgTertiary, padding: "2px 8px", borderRadius: 6,
                      }}>
                        {employee.employeeNumber}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, fontSize: 13, color: theme.colors.textSecondary, flexWrap: "wrap" as const }}>
                      <span>{employee.jobTitle}</span>
                      {employee.department && (
                        <>
                          <span style={{ color: theme.colors.textMuted }}>·</span>
                          <span>{employee.department}</span>
                        </>
                      )}
                      {employee.manager?.user?.name && (
                        <>
                          <span style={{ color: theme.colors.textMuted }}>·</span>
                          <span style={{ color: theme.colors.textMuted }}>Reports to {employee.manager.user.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/hr/employees/${employee.id}/edit`}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: "none",
                      background: "transparent", color: theme.colors.textMuted,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      textDecoration: "none", transition: "all 0.15s ease", flexShrink: 0,
                    }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.background = theme.colors.infoBg; e.currentTarget.style.color = theme.colors.info; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textMuted; }}
                  >
                    {icons.edit}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
