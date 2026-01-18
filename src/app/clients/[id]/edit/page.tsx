"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type Agency = {
  id: string;
  name: string;
  isDefault: boolean;
};

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [client, setClient] = useState<any>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${clientId}`).then(res => res.json()),
      fetch("/api/partner-agencies").then(res => res.json()),
      fetch("/api/auth/session").then(res => res.json()),
    ]).then(([clientData, agenciesData, sessionData]) => {
      setClient(clientData);
      setAgencies(Array.isArray(agenciesData) ? agenciesData : []);
      setUserRole(sessionData?.user?.role || "");
      setUserName(sessionData?.user?.name || "");
      setLoading(false);
    });
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name"),
      nickname: formData.get("nickname") || null,
      industry: formData.get("industry") || null,
      website: formData.get("website") || null,
      status: formData.get("status"),
      primaryContact: formData.get("primaryContact") || null,
      primaryEmail: formData.get("primaryEmail") || null,
      agencyId: formData.get("agencyId") || null,
      showTimeInPortal: formData.get("showTimeInPortal") === "on",
    };

    // Only include monthlyRetainer for SUPER_ADMIN
    if (userRole === "SUPER_ADMIN") {
      data.monthlyRetainer = formData.get("monthlyRetainer") ? parseFloat(formData.get("monthlyRetainer") as string) : null;
    }

    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(`/clients/${clientId}`);
      router.refresh();
    } else {
      const err = await res.json();
      setError(err.error || "Failed to update client");
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: `1px solid ${theme.colors.borderMedium}`,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    boxSizing: "border-box" as const,
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontWeight: 500,
    fontSize: 14,
    color: theme.colors.textPrimary,
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;
  if (!client) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Client not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/clients/${clientId}`} style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to {client.name}
          </Link>
        </div>

        <div style={{ background: theme.colors.bgSecondary, padding: 32, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textPrimary, marginTop: 0, marginBottom: 8 }}>Edit Client</h1>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 32, fontSize: 14 }}>Update client information</p>

          {error && (
            <div style={{ background: theme.colors.errorBg, color: theme.colors.error, padding: "12px 16px", borderRadius: theme.borderRadius.md, marginBottom: 24, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Client Name *</label>
                <input name="name" required defaultValue={client.name} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nickname</label>
                <input name="nickname" defaultValue={client.nickname || ""} placeholder="e.g., OB" style={inputStyle} />
                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>Short name for tasks</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Servicing Agency</label>
                <select name="agencyId" defaultValue={client.agencyId || ""} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select agency...</option>
                  {agencies.map(agency => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name} {agency.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select name="status" defaultValue={client.status} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="LEAD">Lead</option>
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CHURNED">Churned</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Industry</label>
                <input name="industry" defaultValue={client.industry || ""} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input name="website" type="url" defaultValue={client.website || ""} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Primary Contact</label>
                <input name="primaryContact" defaultValue={client.primaryContact || ""} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Primary Email</label>
                <input name="primaryEmail" type="email" defaultValue={client.primaryEmail || ""} style={inputStyle} />
              </div>
            </div>

            {userRole === "SUPER_ADMIN" && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Monthly Retainer (USD)</label>
                <input name="monthlyRetainer" type="number" step="0.01" defaultValue={client.monthlyRetainer || ""} style={inputStyle} />
              </div>
            )}

            {/* Portal Settings */}
            <div style={{ 
              marginBottom: 32, 
              padding: 20, 
              background: theme.colors.bgTertiary, 
              borderRadius: theme.borderRadius.md,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textSecondary, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Client Portal Settings
              </h3>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="showTimeInPortal"
                  defaultChecked={client.showTimeInPortal || false}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                    Show time tracking in portal
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                    Allow clients to see how many hours have been logged on their projects
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} style={{
                flex: 1,
                padding: 14,
                background: saving ? theme.colors.bgTertiary : theme.gradients.primary,
                color: saving ? theme.colors.textMuted : "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
              }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link href={`/clients/${clientId}`} style={{
                padding: "14px 24px",
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: theme.borderRadius.md,
                textDecoration: "none",
                color: theme.colors.textSecondary,
                fontWeight: 500,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
              }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
