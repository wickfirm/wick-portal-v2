"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export default function ClientMetricsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["analytics", "seo"]));

  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7),
    gaSessions: "", gaUsers: "", gaPageviews: "", gaBounceRate: "",
    gscClicks: "", gscImpressions: "", gscCtr: "", gscAvgPosition: "",
    hoursSeo: "", hoursContent: "", hoursPaidMedia: "", hoursSocial: "", hoursDesign: "", hoursMaintenance: "", hoursStrategy: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/clients/" + clientId).then(res => res.json()),
      fetch("/api/clients/" + clientId + "/metrics").then(res => res.json()),
    ]).then(([clientData, metricsData]) => {
      setClient(clientData);
      setMetrics(metricsData);
      setLoading(false);
    });
  }, [clientId]);

  async function fetchMetrics() {
    const res = await fetch("/api/clients/" + clientId + "/metrics");
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

    const res = await fetch("/api/clients/" + clientId + "/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      fetchMetrics();
      setFormData({
        month: new Date().toISOString().slice(0, 7),
        gaSessions: "", gaUsers: "", gaPageviews: "", gaBounceRate: "",
        gscClicks: "", gscImpressions: "", gscCtr: "", gscAvgPosition: "",
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

  const fmt = (n: any) => n === null || n === undefined ? "-" : Number(n).toLocaleString();
  const fmtDec = (n: any) => n === null || n === undefined ? "-" : Number(n).toFixed(2);
  const fmtPct = (n: any) => n === null || n === undefined ? "-" : Number(n).toFixed(2) + "%";
  const fmtCur = (n: any) => n === null || n === undefined ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid " + theme.colors.borderMedium,
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
    color: theme.colors.textSecondary,
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  const latest = metrics[0];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={"/clients/" + clientId} style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to {client?.name}
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Performance Metrics</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Track KPIs for {client?.name}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: theme.gradients.primary,
            color: "white",
            padding: "12px 24px",
            borderRadius: theme.borderRadius.md,
            border: "none",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
          }}>
            + Add Metrics
          </button>
        </div>

        {/* Summary Cards */}
        {latest && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, borderLeft: "4px solid " + theme.colors.info }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Sessions</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmt(latest.gaSessions)}</div>
              <div style={{ fontSize: 12, color: theme.colors.info }}>Google Analytics</div>
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, borderLeft: "4px solid " + theme.colors.success }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>GSC Clicks</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmt(latest.gscClicks)}</div>
              <div style={{ fontSize: 12, color: theme.colors.success }}>Search Console</div>
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, borderLeft: "4px solid " + theme.colors.primary }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Ad Spend</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>
                {fmtCur((Number(latest.metaSpend) || 0) + (Number(latest.googleAdsSpend) || 0) + (Number(latest.linkedinAdsSpend) || 0) + (Number(latest.tiktokAdsSpend) || 0))}
              </div>
              <div style={{ fontSize: 12, color: theme.colors.primary }}>All Platforms</div>
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, borderLeft: "4px solid " + theme.colors.warning }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Total Hours</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>
                {fmtDec((Number(latest.hoursSeo) || 0) + (Number(latest.hoursContent) || 0) + (Number(latest.hoursPaidMedia) || 0) + (Number(latest.hoursSocial) || 0) + (Number(latest.hoursDesign) || 0) + (Number(latest.hoursMaintenance) || 0) + (Number(latest.hoursStrategy) || 0))}
              </div>
              <div style={{ fontSize: 12, color: theme.colors.warning }}>This Month</div>
            </div>
          </div>
        )}

        {/* Add Metrics Form */}
        {showForm && (
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 32, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Add Monthly Metrics</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Month</label>
                <input type="month" value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} required style={{ ...inputStyle, maxWidth: 200 }} />
              </div>

              {/* Google Analytics */}
              <div style={{ background: theme.colors.bgPrimary, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: theme.colors.info }}>Google Analytics</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <div><label style={labelStyle}>Sessions</label><input type="number" step="any" value={formData.gaSessions} onChange={(e) => setFormData({ ...formData, gaSessions: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Users</label><input type="number" step="any" value={formData.gaUsers} onChange={(e) => setFormData({ ...formData, gaUsers: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Pageviews</label><input type="number" step="any" value={formData.gaPageviews} onChange={(e) => setFormData({ ...formData, gaPageviews: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Bounce Rate %</label><input type="number" step="any" value={formData.gaBounceRate} onChange={(e) => setFormData({ ...formData, gaBounceRate: e.target.value })} style={inputStyle} /></div>
                </div>
              </div>

              {/* Search Console */}
              <div style={{ background: theme.colors.bgPrimary, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: theme.colors.success }}>Search Console</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <div><label style={labelStyle}>Clicks</label><input type="number" step="any" value={formData.gscClicks} onChange={(e) => setFormData({ ...formData, gscClicks: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Impressions</label><input type="number" step="any" value={formData.gscImpressions} onChange={(e) => setFormData({ ...formData, gscImpressions: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>CTR %</label><input type="number" step="any" value={formData.gscCtr} onChange={(e) => setFormData({ ...formData, gscCtr: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Avg Position</label><input type="number" step="any" value={formData.gscAvgPosition} onChange={(e) => setFormData({ ...formData, gscAvgPosition: e.target.value })} style={inputStyle} /></div>
                </div>
              </div>

              {/* Hours Tracking */}
              <div style={{ background: theme.colors.bgPrimary, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: theme.colors.warning }}>Hours Tracking</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <div><label style={labelStyle}>SEO</label><input type="number" step="any" value={formData.hoursSeo} onChange={(e) => setFormData({ ...formData, hoursSeo: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Content</label><input type="number" step="any" value={formData.hoursContent} onChange={(e) => setFormData({ ...formData, hoursContent: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Paid Media</label><input type="number" step="any" value={formData.hoursPaidMedia} onChange={(e) => setFormData({ ...formData, hoursPaidMedia: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Social</label><input type="number" step="any" value={formData.hoursSocial} onChange={(e) => setFormData({ ...formData, hoursSocial: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Design</label><input type="number" step="any" value={formData.hoursDesign} onChange={(e) => setFormData({ ...formData, hoursDesign: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Maintenance</label><input type="number" step="any" value={formData.hoursMaintenance} onChange={(e) => setFormData({ ...formData, hoursMaintenance: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Strategy</label><input type="number" step="any" value={formData.hoursStrategy} onChange={(e) => setFormData({ ...formData, hoursStrategy: e.target.value })} style={inputStyle} /></div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={saving} style={{
                  padding: "12px 24px",
                  background: saving ? theme.colors.bgTertiary : theme.colors.primary,
                  color: saving ? theme.colors.textMuted : "white",
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: saving ? "not-allowed" : "pointer"
                }}>
                  {saving ? "Saving..." : "Save Metrics"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: "12px 24px",
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textSecondary,
                  border: "none",
                  borderRadius: theme.borderRadius.md,
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
          <div style={{ background: theme.colors.bgSecondary, padding: 64, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>M</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No metrics recorded</div>
            <div style={{ color: theme.colors.textSecondary }}>Add your first monthly metrics to start tracking</div>
          </div>
        ) : (
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            {/* Analytics Section */}
            <div onClick={() => toggleSection("analytics")} style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: expandedSections.has("analytics") ? "1px solid " + theme.colors.borderLight : "none", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: theme.borderRadius.md, background: theme.colors.infoBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: theme.colors.info, fontWeight: 600 }}>A</div>
              <span style={{ fontWeight: 600, color: theme.colors.textPrimary, flex: 1 }}>Google Analytics</span>
              <span style={{ color: theme.colors.textMuted, transform: expandedSections.has("analytics") ? "rotate(180deg)" : "rotate(0)", transition: "transform 150ms" }}>v</span>
            </div>
            {expandedSections.has("analytics") && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: theme.colors.bgPrimary }}>
                      <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Month</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Sessions</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Users</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Pageviews</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
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

            {/* SEO Section */}
            <div onClick={() => toggleSection("seo")} style={{ padding: "16px 20px", background: theme.colors.bgPrimary, borderBottom: expandedSections.has("seo") ? "1px solid " + theme.colors.borderLight : "none", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: theme.borderRadius.md, background: theme.colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: theme.colors.success, fontWeight: 600 }}>S</div>
              <span style={{ fontWeight: 600, color: theme.colors.textPrimary, flex: 1 }}>Search Console</span>
              <span style={{ color: theme.colors.textMuted, transform: expandedSections.has("seo") ? "rotate(180deg)" : "rotate(0)", transition: "transform 150ms" }}>v</span>
            </div>
            {expandedSections.has("seo") && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: theme.colors.bgPrimary }}>
                      <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Month</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Clicks</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Impressions</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>CTR</th>
                      <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary }}>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                        <td style={{ padding: 12, fontWeight: 500 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmt(m.gscClicks)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmt(m.gscImpressions)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmtPct(m.gscCtr)}</td>
                        <td style={{ padding: 12, textAlign: "right" }}>{fmtDec(m.gscAvgPosition)}</td>
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
