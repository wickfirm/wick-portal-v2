"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import HolidaysManager from "./holidays-manager";
import { theme } from "@/lib/theme";

export default function HRSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"settings" | "holidays">("settings");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editDeptValue, setEditDeptValue] = useState("");
  
  const [settings, setSettings] = useState({
    annualLeaveEntitlement: 21,
    sickLeaveEntitlement: 10,
    weekendDays: "FRI_SAT",
    workingHoursPerDay: 8,
    carryOverEnabled: false,
    maxCarryOverDays: 5,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadSettings();
    }
  }, [status]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          annualLeaveEntitlement: Number(data.annualLeaveEntitlement),
          sickLeaveEntitlement: Number(data.sickLeaveEntitlement),
          weekendDays: data.weekendDays,
          workingHoursPerDay: data.workingHoursPerDay,
          carryOverEnabled: data.carryOverEnabled,
          maxCarryOverDays: data.maxCarryOverDays,
        });
      }

      // Load employees to get departments
      const empRes = await fetch("/api/hr/employees");
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
        const depts = Array.from(new Set(empData.map((e: any) => e.department).filter(Boolean))) as string[];
        setDepartments(depts.sort());
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hr/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to save settings");
        return;
      }

      alert("HR Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) {
      alert("Please enter a department name");
      return;
    }
    if (departments.includes(newDepartment.trim())) {
      alert("Department already exists");
      return;
    }
    setDepartments([...departments, newDepartment.trim()].sort());
    setNewDepartment("");
  };

  const handleEditDepartment = (oldName: string) => {
    if (!editDeptValue.trim()) {
      alert("Department name cannot be empty");
      return;
    }
    if (editDeptValue === oldName) {
      setEditingDept(null);
      return;
    }
    if (departments.includes(editDeptValue.trim())) {
      alert("Department already exists");
      return;
    }

    // Update department in state
    setDepartments(departments.map(d => d === oldName ? editDeptValue.trim() : d).sort());
    setEditingDept(null);

    // Update all employees with this department
    const employeesToUpdate = employees.filter(e => e.department === oldName);
    if (employeesToUpdate.length > 0) {
      if (confirm(`Update ${employeesToUpdate.length} employee(s) from "${oldName}" to "${editDeptValue.trim()}"?`)) {
        updateEmployeeDepartments(oldName, editDeptValue.trim());
      }
    }
  };

  const handleDeleteDepartment = (deptName: string) => {
    const employeesInDept = employees.filter(e => e.department === deptName);
    
    if (employeesInDept.length > 0) {
      if (!confirm(`"${deptName}" has ${employeesInDept.length} employee(s). Delete anyway?\n\nEmployees will have no department until reassigned.`)) {
        return;
      }
      // Update employees to null department
      updateEmployeeDepartments(deptName, null);
    }
    
    setDepartments(departments.filter(d => d !== deptName));
  };

  const updateEmployeeDepartments = async (oldDept: string, newDept: string | null) => {
    const employeesToUpdate = employees.filter(e => e.department === oldDept);
    
    for (const emp of employeesToUpdate) {
      try {
        await fetch(`/api/hr/employees/${emp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department: newDept })
        });
      } catch (error) {
        console.error(`Failed to update employee ${emp.id}:`, error);
      }
    }
    
    // Reload employees
    loadSettings();
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ height: "1rem", width: "120px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "1rem" }}></div>
            <div style={{ height: "2rem", width: "180px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "0.5rem" }}></div>
            <div style={{ height: "1rem", width: "400px", background: "#E5E7EB", borderRadius: "4px" }}></div>
          </div>

          {/* Settings Form Skeleton */}
          <div style={{ background: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ marginBottom: "2rem" }}>
                <div style={{ height: "1.5rem", width: "200px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "1rem" }}></div>
                <div style={{ height: "1rem", width: "350px", background: "#E5E7EB", borderRadius: "4px", marginBottom: "1.5rem" }}></div>
                <div style={{ height: "3rem", width: "200px", background: "#E5E7EB", borderRadius: "8px", marginBottom: "1rem" }}></div>
                <div style={{ height: "3rem", width: "200px", background: "#E5E7EB", borderRadius: "8px" }}></div>
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
      
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Back Link */}
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none" }}>
            ← Back to Settings
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: "bold", color: theme.colors.textPrimary, marginBottom: 8 }}>
            HR Settings
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Configure leave policies, holidays, and working hours for your agency
          </p>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: `2px solid ${theme.colors.borderLight}`, marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setActiveTab("settings")}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: activeTab === "settings" ? theme.colors.primary : theme.colors.textSecondary,
                border: "none",
                borderBottom: `3px solid ${activeTab === "settings" ? theme.colors.primary : "transparent"}`,
                fontWeight: activeTab === "settings" ? 600 : 500,
                fontSize: 15,
                cursor: "pointer",
                marginBottom: -2,
              }}
            >
              Leave & Schedule
            </button>
            <button
              onClick={() => setActiveTab("holidays")}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: activeTab === "holidays" ? theme.colors.primary : theme.colors.textSecondary,
                border: "none",
                borderBottom: `3px solid ${activeTab === "holidays" ? theme.colors.primary : "transparent"}`,
                fontWeight: activeTab === "holidays" ? 600 : 500,
                fontSize: 15,
                cursor: "pointer",
                marginBottom: -2,
              }}
            >
              Public Holidays
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "holidays" ? (
          <HolidaysManager />
        ) : (
          <>
        {/* Settings Form */}
        <div style={{ background: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
          
          {/* Leave Entitlements */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Leave Entitlements
            </h2>
            <p style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "1.5rem" }}>
              Set default annual leave and sick leave days for new employees
            </p>

            <div style={{ display: "grid", gap: "1.5rem" }}>
              {/* Annual Leave */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Annual Leave (days per year)
                </label>
                <input
                  type="number"
                  value={settings.annualLeaveEntitlement}
                  onChange={(e) => setSettings({...settings, annualLeaveEntitlement: parseInt(e.target.value)})}
                  style={{ width: "100%", maxWidth: "200px", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem" }}
                />
                <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                  UAE standard: 21 days (30 days after 1 year)
                </p>
              </div>

              {/* Sick Leave */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Sick Leave (days per year)
                </label>
                <input
                  type="number"
                  value={settings.sickLeaveEntitlement}
                  onChange={(e) => setSettings({...settings, sickLeaveEntitlement: parseInt(e.target.value)})}
                  style={{ width: "100%", maxWidth: "200px", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem" }}
                />
                <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                  UAE standard: 90 days per year (paid varies)
                </p>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "2rem 0" }} />

          {/* Working Schedule */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Working Schedule
            </h2>
            <p style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "1.5rem" }}>
              Configure your agency's working week
            </p>

            <div style={{ display: "grid", gap: "1.5rem" }}>
              {/* Weekend Structure */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Weekend Days
                </label>
                <select
                  value={settings.weekendDays}
                  onChange={(e) => setSettings({...settings, weekendDays: e.target.value})}
                  style={{ width: "100%", maxWidth: "300px", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem" }}
                >
                  <option value="FRI_SAT">Friday & Saturday (UAE)</option>
                  <option value="SAT_SUN">Saturday & Sunday (Western)</option>
                  <option value="SUN_ONLY">Sunday Only</option>
                  <option value="FRI_ONLY">Friday Only</option>
                </select>
                <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                  Used for calculating working days in leave requests
                </p>
              </div>

              {/* Working Hours */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Working Hours Per Day
                </label>
                <input
                  type="number"
                  value={settings.workingHoursPerDay}
                  onChange={(e) => setSettings({...settings, workingHoursPerDay: parseInt(e.target.value)})}
                  style={{ width: "100%", maxWidth: "200px", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem" }}
                />
                <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                  Used for calculating half-day leave (future feature)
                </p>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "2rem 0" }} />

          {/* Leave Carry-Over */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Leave Carry-Over Policy
            </h2>
            <p style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "1.5rem" }}>
              Allow employees to carry over unused leave to next year
            </p>

            <div style={{ display: "grid", gap: "1.5rem" }}>
              {/* Enable Carry-Over */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={settings.carryOverEnabled}
                  onChange={(e) => setSettings({...settings, carryOverEnabled: e.target.checked})}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <label style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                  Enable annual leave carry-over
                </label>
              </div>

              {/* Max Carry-Over Days */}
              {settings.carryOverEnabled && (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                    Maximum Days to Carry Over
                  </label>
                  <input
                    type="number"
                    value={settings.maxCarryOverDays}
                    onChange={(e) => setSettings({...settings, maxCarryOverDays: parseInt(e.target.value)})}
                    style={{ width: "100%", maxWidth: "200px", padding: "0.75rem", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "0.875rem" }}
                  />
                  <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
                    Maximum unused days that can roll over to next year
                  </p>
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "2rem 0" }} />

          {/* Current Configuration Info */}
          <div style={{ background: "#F9FAFB", padding: "1rem", borderRadius: "8px", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.75rem" }}>
              📋 Current Configuration
            </h3>
            <div style={{ fontSize: "0.875rem", color: theme.colors.textSecondary }}>
              <p style={{ marginBottom: "0.5rem" }}>
                • Default Annual Leave: <strong>{settings.annualLeaveEntitlement} days/year</strong>
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                • Default Sick Leave: <strong>{settings.sickLeaveEntitlement} days/year</strong>
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                • Weekend: <strong>{settings.weekendDays === "FRI_SAT" ? "Friday & Saturday" : settings.weekendDays === "SAT_SUN" ? "Saturday & Sunday" : settings.weekendDays}</strong>
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                • Working Hours: <strong>{settings.workingHoursPerDay} hours/day</strong>
              </p>
              <p>
                • Carry-Over: <strong>{settings.carryOverEnabled ? `Enabled (max ${settings.maxCarryOverDays} days)` : "Disabled"}</strong>
              </p>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "2rem 0" }} />

          {/* Department Management */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Department Management
            </h2>
            <p style={{ fontSize: "0.875rem", color: theme.colors.textSecondary, marginBottom: "1.5rem" }}>
              Manage departments used across your organization. Changes update all employee profiles.
            </p>

            {/* Add Department */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddDepartment()}
                placeholder="Enter new department name"
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                }}
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: theme.colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                + Add
              </button>
            </div>

            {/* Departments List */}
            {departments.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", background: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                <p style={{ color: theme.colors.textSecondary, fontSize: "0.875rem" }}>
                  No departments yet. Add your first department above.
                </p>
              </div>
            ) : (
              <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
                {departments.map((dept) => {
                  const employeeCount = employees.filter(e => e.department === dept).length;
                  const isEditing = editingDept === dept;

                  return (
                    <div
                      key={dept}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        borderBottom: "1px solid #E5E7EB",
                        background: "white",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDeptValue}
                            onChange={(e) => setEditDeptValue(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") handleEditDepartment(dept);
                              if (e.key === "Escape") setEditingDept(null);
                            }}
                            onBlur={() => setEditingDept(null)}
                            autoFocus
                            style={{
                              padding: "0.5rem",
                              border: "2px solid " + theme.colors.primary,
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              width: "250px",
                            }}
                          />
                        ) : (
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "0.875rem" }}>
                              {dept}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: theme.colors.textSecondary }}>
                              {employeeCount} employee{employeeCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => {
                                setEditingDept(dept);
                                setEditDeptValue(dept);
                              }}
                              style={{
                                padding: "0.5rem 1rem",
                                background: "white",
                                color: theme.colors.primary,
                                border: "1px solid " + theme.colors.primary,
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(dept)}
                              style={{
                                padding: "0.5rem 1rem",
                                background: "#FEE2E2",
                                color: "#991B1B",
                                border: "1px solid #FCA5A5",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {isEditing && (
                          <button
                            onClick={() => handleEditDepartment(dept)}
                            style={{
                              padding: "0.5rem 1rem",
                              background: theme.colors.primary,
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                            }}
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p style={{ fontSize: "0.75rem", color: theme.colors.textSecondary, marginTop: "0.75rem" }}>
              💡 Tip: When you rename or delete a department, all employees in that department will be updated automatically.
            </p>
          </div>

          {/* Important Notes */}
          <div style={{ background: "#FEF3C7", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #FDE68A" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "#92400E" }}>
              ⚠️ Important Notes
            </h3>
            <ul style={{ fontSize: "0.875rem", color: "#92400E", paddingLeft: "1.25rem", margin: 0 }}>
              <li style={{ marginBottom: "0.25rem" }}>Changes apply to new employees only</li>
              <li style={{ marginBottom: "0.25rem" }}>Existing employee entitlements must be updated individually</li>
              <li>Weekend changes affect future leave calculations</li>
            </ul>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <Link 
              href="/settings"
              style={{ padding: "0.75rem 1.5rem", border: "1px solid #E5E7EB", borderRadius: "8px", textDecoration: "none", color: theme.colors.textPrimary, fontSize: "0.875rem", fontWeight: "600" }}
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "0.75rem 1.5rem", background: theme.colors.primary, color: "white", border: "none", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: "600", opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
}
