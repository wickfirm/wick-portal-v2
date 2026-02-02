"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";
import { fetchServiceTypes, buildServiceTypeMap, getServiceTypeName, getServiceTypeIcon } from "@/lib/service-types";

type Agency = {
  id: string;
  name: string;
  isDefault: boolean;
};

export default function NewClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [stMap, setStMap] = useState<Record<string, any>>({});

  const userRole = (session?.user as any)?.role;
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(userRole);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin) {
      router.push("/clients");
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/partner-agencies").then(res => res.json()),
      fetch("/api/onboarding-templates").then(res => res.json()),
      fetchServiceTypes(),
    ]).then(([agenciesData, templatesData, serviceTypesData]) => {
      if (Array.isArray(agenciesData)) {
        setAgencies(agenciesData);
        const defaultAgency = agenciesData.find((a: Agency) => a.isDefault);
        if (defaultAgency) {
          setSelectedAgencyId(defaultAgency.id);
        } else if (agenciesData.length === 1) {
          // Auto-select if only one agency exists
          setSelectedAgencyId(agenciesData[0].id);
        }
      }
      if (Array.isArray(templatesData)) {
        const activeTemplates = templatesData.filter((t: any) => t.isActive);
        setTemplates(activeTemplates);
      }
      if (Array.isArray(serviceTypesData)) {
        setStMap(buildServiceTypeMap(serviceTypesData));
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      nickname: formData.get("nickname") || null,
      industry: formData.get("industry") || null,
      website: formData.get("website") || null,
      status: formData.get("status") || "LEAD",
      primaryContact: formData.get("primaryContact") || null,
      primaryEmail: formData.get("primaryEmail") || null,
      monthlyRetainer: formData.get("monthlyRetainer") && !isNaN(parseFloat(formData.get("monthlyRetainer") as string)) ? parseFloat(formData.get("monthlyRetainer") as string) : null,
      agencyId: formData.get("agencyId") || null,
    };

    try {
      // Create client
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.details || err.error || "Failed to create client");
        setLoading(false);
        return;
      }

      const newClient = await res.json();

      // Initialize onboarding if services selected
      if (selectedServices.length > 0) {
        await fetch(`/api/clients/${newClient.id}/onboarding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceTypes: selectedServices }),
        });
      }

      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError("Failed to create client");
      setLoading(false);
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

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/clients" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
            ← Back to Clients
          </Link>
        </div>

        <div style={{ background: theme.colors.bgSecondary, padding: 32, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textPrimary, marginTop: 0, marginBottom: 8 }}>New Client</h1>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 32, fontSize: 14 }}>Add a new client to your portfolio</p>

          {error && (
            <div style={{ background: theme.colors.errorBg, color: theme.colors.error, padding: "12px 16px", borderRadius: theme.borderRadius.md, marginBottom: 24, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Client Name *</label>
                <input name="name" required style={inputStyle} placeholder="Acme Corporation" />
              </div>
              <div>
                <label style={labelStyle}>Nickname</label>
                <input name="nickname" style={inputStyle} placeholder="e.g., ACME" />
                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>Short name for tasks</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Servicing Agency</label>
                <select
                  name="agencyId"
                  value={selectedAgencyId}
                  onChange={(e) => setSelectedAgencyId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
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
                <select name="status" defaultValue="LEAD" style={{ ...inputStyle, cursor: "pointer" }}>
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
                <input name="industry" style={inputStyle} placeholder="Technology" />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input name="website" type="url" style={inputStyle} placeholder="https://example.com" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Primary Contact</label>
                <input name="primaryContact" style={inputStyle} placeholder="John Smith" />
              </div>
              <div>
                <label style={labelStyle}>Primary Email</label>
                <input name="primaryEmail" type="email" style={inputStyle} placeholder="john@example.com" />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>Monthly Retainer (USD)</label>
              <input name="monthlyRetainer" type="number" step="0.01" style={inputStyle} placeholder="5000" />
            </div>

            {/* Service Types Selection */}
            {templates.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <label style={{ ...labelStyle, marginBottom: 12 }}>Services (Optional)</label>
                <p style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16 }}>
                  Select the services you'll provide to automatically set up onboarding checklists
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {Array.from(new Set(templates.map((t: any) => t.serviceType))).map((serviceType: any) => {
                    const template = templates.find((t: any) => t.serviceType === serviceType);
                    const isSelected = selectedServices.includes(serviceType);
                    // Service type labels and icons loaded dynamically from database
                    
                    if (serviceType === "GENERAL") return null;
                    
                    return (
                      <div
                        key={serviceType}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServices(prev => prev.filter(s => s !== serviceType));
                          } else {
                            setSelectedServices(prev => [...prev, serviceType]);
                          }
                        }}
                        style={{
                          padding: 16,
                          border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.borderLight}`,
                          borderRadius: theme.borderRadius.md,
                          cursor: "pointer",
                          background: isSelected ? theme.colors.primaryBg : theme.colors.bgPrimary,
                          transition: "all 150ms ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 20 }}>{getServiceTypeIcon(serviceType, stMap)}</span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{getServiceTypeName(serviceType, stMap)}</span>
                          {isSelected && <span style={{ marginLeft: "auto", color: theme.colors.primary }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                          {template?.items?.length || 0} items
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedServices.length > 0 && (
                  <div style={{ marginTop: 12, fontSize: 13, color: theme.colors.textSecondary }}>
                    {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} selected
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={loading} style={{
                flex: 1,
                padding: 14,
                background: loading ? theme.colors.bgTertiary : theme.gradients.primary,
                color: loading ? theme.colors.textMuted : "white",
                border: "none",
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Creating..." : "Create Client"}
              </button>
              <Link href="/clients" style={{
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
