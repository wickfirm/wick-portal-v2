"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

type ClientMetrics = {
  id: string;
  month: string;
  gaSessions: number | null;
  gaUsers: number | null;
  gaPageviews: number | null;
  gaAvgSessionDuration: number | null;
  gaBounceRate: number | null;
  gaConversionRate: number | null;
  gaTransactions: number | null;
  gaRevenue: number | null;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscCtr: number | null;
  gscPosition: number | null;
  metaSpend: number | null;
  metaImpressions: number | null;
  metaClicks: number | null;
  metaCtr: number | null;
  metaCpc: number | null;
  metaConversions: number | null;
  metaCpa: number | null;
  metaRoas: number | null;
  googleAdsSpend: number | null;
  googleAdsImpressions: number | null;
  googleAdsClicks: number | null;
  googleAdsCtr: number | null;
  googleAdsCpc: number | null;
  googleAdsConversions: number | null;
  googleAdsCpa: number | null;
  googleAdsRoas: number | null;
  linkedinAdsSpend: number | null;
  linkedinAdsImpressions: number | null;
  linkedinAdsClicks: number | null;
  linkedinAdsCtr: number | null;
  linkedinAdsCpc: number | null;
  linkedinAdsConversions: number | null;
  tiktokAdsSpend: number | null;
  tiktokAdsImpressions: number | null;
  tiktokAdsClicks: number | null;
  tiktokAdsCtr: number | null;
  tiktokAdsCpc: number | null;
  tiktokAdsConversions: number | null;
  hoursSeo: number | null;
  hoursContent: number | null;
  hoursPaidMedia: number | null;
  hoursSocial: number | null;
  hoursDesign: number | null;
  hoursMaintenance: number | null;
  hoursStrategy: number | null;
};

export default function ClientMetricsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [metrics, setMetrics] = useState<ClientMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["analytics", "seo"]));

  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7),
    gaSessions: "", gaUsers: "", gaPageviews: "", gaAvgSessionDuration: "", gaBounceRate: "", gaConversionRate: "", gaTransactions: "", gaRevenue: "",
    gscClicks: "", gscImpressions: "", gscCtr: "", gscPosition: "",
    metaSpend: "", metaImpressions: "", metaClicks: "", metaCtr: "", metaCpc: "", metaConversions: "", metaCpa: "", metaRoas: "",
    googleAdsSpend: "", googleAdsImpressions: "", googleAdsClicks: "", googleAdsCtr: "", googleAdsCpc: "", googleAdsConversions: "", googleAdsCpa: "", googleAdsRoas: "",
    linkedinAdsSpend: "", linkedinAdsImpressions: "", linkedinAdsClicks: "", linkedinAdsCtr: "", linkedinAdsCpc: "", linkedinAdsConversions: "",
    tiktokAdsSpend: "", tiktokAdsImpressions: "", tiktokAdsClicks: "", tiktokAdsCtr: "", tiktokAdsCpc: "", tiktokAdsConversions: "",
    hoursSeo: "", hoursContent: "", hoursPaidMedia: "", hoursSocial: "", hoursDesign: "", hoursMaintenance: "", hoursStrategy: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${clientId}`).then(res => res.json()),
      fetch(`/api/clients/${clientId}/metrics`).then(res => res.json()),
    ]).then(([clientData, metricsData]) => {
      setClient(clientData);
      setMetrics(metricsData);
      setLoading(false);
    });
  }, [clientId]);

  async function fetchMetrics() {
    const res = await fetch(`/api/clients/${clientId}/metrics`);
    const data = await res.json();
    setMetrics(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: any = { month: formData.month + "-01" };
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "month" && value !== "") {
        payload[key] = parseFloat(value);
      }
    });

    const res = await fetch(`/api/clients/${clientId}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      fetchMetrics();
      setFormData({
        month: new Date().toISOString().slice(0, 7),
        gaSessions: "", gaUsers: "", gaPageviews: "", gaAvgSessionDuration: "", gaBounceRate: "", gaConversionRate: "", gaTransactions: "", gaRevenue: "",
        gscClicks: "", gscImpressions: "", gscCtr: "", gscPosition: "",
        metaSpend: "", metaImpressions: "", metaClicks: "", metaCtr: "", metaCpc: "", metaConversions: "", metaCpa: "", metaRoas: "",
        googleAdsSpend: "", googleAdsImpressions: "", googleAdsClicks: "", googleAdsCtr: "", googleAdsCpc: "", googleAdsConversions: "", googleAdsCpa: "", googleAdsRoas: "",
        linkedinAdsSpend: "", linkedinAdsImpressions: "", linkedinAdsClicks: "", linkedinAdsCtr: "", linkedinAdsCpc: "", linkedinAdsConversions: "",
        tiktokAdsSpend: "", tiktokAdsImpressions: "", tiktokAdsClicks: "", tiktokAdsCtr: "", tiktokAdsCpc: "", tiktokAdsConversions: "",
        hoursSeo: "", hoursContent: "", hoursPaidMedia: "", hoursSocial: "", hoursDesign: "", hoursMaintenance: "", hoursStrategy: "",
      });
    }
    setSaving(false);
  }

  function toggleSection(section: string) {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  }

  const fmt = (n: any) => n === null || n === undefined ? "—" : Number(n).toLocaleString();
  const fmtDec = (n: any) => n === null || n === undefined ? "—" : Number(n).toFixed(2);
  const fmtPct = (n: any) => n === null || n === undefined ? "—" : Number(n).toFixed(2) + "%";
  const fmtCur = (n: any) => n === null || n === undefined ? "—" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #dadce0",
    borderRadius: 6,
    fontSize: 13,
    boxSizing: "border-box" as const,
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 4,
    fontWeight: 500,
    fontSize: 12,
    color: "#5f6368",
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "#5f6368" }}>Loading...</div>;

  const latest = metrics[0];

  const SectionHeader = ({ title, section, icon, color }: { title: string; section: string; icon: string; color: string }) => (
    <div
      onClick={() => toggleSection(section)}
      style={{
        padding: "16px 20px",
        background: "#f8f9fa",
        borderBottom: expandedSections.has(section) ? "1px solid #e8eaed" : "none",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
      }}>
        {icon}
      </div>
      <span style={{ fontWeight: 600, color: "#1a1a1a", flex: 1 }}>{title}</span>
      <span style={{ color: "#9aa0a6", transform: expandedSections.has(section) ? "rotate(180deg)" : "rotate(0)", transition: "transform 150ms" }}>▼</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/clients/${clientId}`} style={{ color: "#5f6368", textDecoration: "none", fontSize: 14 }}>
            ← Back to {client?.name}
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Performance Metrics</h1>
            <p style={{ color: "#5f6368", fontSize: 15 }}>Track KPIs for {client?.name}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "linear-gradient(135deg, #e85a4f, #d44a3f)",
              color: "white",
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            + Add Metrics
          </button>
        </div>

        {/* Summary Cards */}
        {latest && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed", borderLeft: "4px solid #4285f4" }}>
              <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Sessions</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>{fmt(latest.gaSessions)}</div>
              <div style={{ fontSize: 12, color: "#4285f4" }}>Google Analytics</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed", borderLeft: "4px solid #34a853" }}>
              <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>GSC Clicks</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>{fmt(latest.gscClicks)}</div>
              <div style={{ fontSize: 12, color: "#34a853" }}>Search Console</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed", borderLeft: "4px solid #e85a4f" }}>
              <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Total Ad Spend</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>
                {fmtCur((Number(latest.metaSpend) || 0) + (Number(latest.googleAdsSpend) || 0) + (Number(latest.linkedinAdsSpend) || 0) + (Number(latest.tiktokAdsSpend) || 0))}
              </div>
              <div style={{ fontSize: 12, color: "#e85a4f" }}>All Platforms</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed", borderLeft: "4px solid #f9ab00" }}>
              <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Total Hours</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>
                {fmtDec((Number(latest.hoursSeo) || 0) + (Number(latest.hoursContent) || 0) + (Number(latest.hoursPaidMedia) || 0) + (Number(latest.hoursSocial) || 0) + (Number(latest.hoursDesign) || 0) + (Number(latest.hoursMaintenance) || 0) + (Number(latest.hoursStrategy) || 0))}
              </div>
              <div style={{ fontSize: 12, color: "#f9ab00" }}>This Month</div>
            </div>
          </div>
        )}

        {/* Add Metrics Form */}
        {showForm && (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", marginBottom: 32, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8eaed" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Add Monthly Metrics</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Month</label>
                <input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                  style={{ ...inputStyle, maxWidth: 200 }}
                />
              </div>

              {/* Google Analytics */}
              <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#4285f4" }}>📊 Google Analytics</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { key: "gaSessions", label: "Sessions" },
                    { key: "gaUsers", label: "Users" },
                    { key: "gaPageviews", label: "Pageviews" },
                    { key: "gaBounceRate", label: "Bounce Rate %" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label}</label>
                      <input
                        type="number"
                        step="any"
                        value={(formData as any)[f.key]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Console */}
              <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#34a853" }}>🔍 Search Console</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { key: "gscClicks", label: "Clicks" },
                    { key: "gscImpressions", label: "Impressions" },
                    { key: "gscCtr", label: "CTR %" },
                    { key: "gscPosition", label: "Avg Position" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label}</label>
                      <input
                        type="number"
                        step="any"
                        value={(formData as any)[f.key]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours Tracking */}
              <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 16, marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#f9ab00" }}>⏱️ Hours Tracking</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { key: "hoursSeo", label: "SEO" },
                    { key: "hoursContent", label: "Content" },
                    { key: "hoursPaidMedia", label: "Paid Media" },
                    { key: "hoursSocial", label: "Social" },
                    { key: "hoursDesign", label: "Design" },
                    { key: "hoursMaintenance", label: "Maintenance" },
                    { key: "hoursStrategy", label: "Strategy" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label}</label>
                      <input
                        type="number"
                        step="any"
                        value={(formData as any)[f.key]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={saving} style={{
                  padding: "12px 24px",
                  background: saving ? "#f1f3f4" : "#e85a4f",
                  color: saving ? "#9aa0a6" : "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: saving ? "not-allowed" : "pointer"
                }}>
                  {saving ? "Saving..." : "Save Metrics"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: "12px 24px",
                  background: "#f1f3f4",
                  color: "#5f6368",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer"
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Metrics History */}
        {metrics.length === 0 ? (
          <div style={{ background: "white", padding: 64, borderRadius: 12, border: "1px solid #e8eaed", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>No metrics recorded</div>
            <div style={{ color: "#5f6368" }}>Add your first monthly metrics to start tracking</div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
            <SectionHeader title="Google Analytics" section="analytics" icon="📊" color="#4285f4" />
            {expandedSections.has("analytics") && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Month</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Sessions</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Users</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Pageviews</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                        <td style={{ padding: 12, fontWeight: 500 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmt(m.gaSessions)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmt(m.gaUsers)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmt(m.gaPageviews)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmtPct(m.gaBounceRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <SectionHeader title="Search Console" section="seo" icon="🔍" color="#34a853" />
            {expandedSections.has("seo") && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Month</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Clicks</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Impressions</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>CTR</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368" }}>Avg Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                        <td style={{ padding: 12, fontWeight: 500 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmt(m.gscClicks)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmt(m.gscImpressions)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmtPct(m.gscCtr)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmtDec(m.gscPosition)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
