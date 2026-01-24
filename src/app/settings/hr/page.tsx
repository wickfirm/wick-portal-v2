"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export default function HRSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Default settings (these would come from database in production)
  const [settings, setSettings] = useState({
    annualLeaveEntitlement: 21,
    sickLeaveEntitlement: 10,
    weekendDays: "FRI_SAT", // UAE standard
    workingHoursPerDay: 8,
    carryOverEnabled: false,
    maxCarryOverDays: 5,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to database via API
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert("Settings saved! (Note: This is currently display-only. Database integration coming next.)");
    setSaving(false);
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: "2rem", color: theme.colors.textSecondary }}>
          Loading...
        </div>
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
            Configure leave policies and working hours for your agency
          </p>
        </div>

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

          {/* Important Notes */}
          <div style={{ background: "#FEF3C7", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #FDE68A" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem", color: "#92400E" }}>
              ⚠️ Important Notes
            </h3>
            <ul style={{ fontSize: "0.875rem", color: "#92400E", paddingLeft: "1.25rem", margin: 0 }}>
              <li style={{ marginBottom: "0.25rem" }}>Changes apply to new employees only</li>
              <li style={{ marginBottom: "0.25rem" }}>Existing employee entitlements must be updated individually</li>
              <li style={{ marginBottom: "0.25rem" }}>Weekend changes affect future leave calculations</li>
              <li>These settings are currently display-only (database integration coming next)</li>
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
      </main>
    </div>
  );
}
