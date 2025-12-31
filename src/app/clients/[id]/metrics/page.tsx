"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Section = "analytics" | "seo" | "aeo" | "meta" | "google" | "linkedin" | "tiktok" | "instagram" | "facebook" | "liOrganic" | "ttOrganic" | "twitter" | "content" | "hours";

const emptyForm: any = {
  month: new Date().toISOString().slice(0, 7) + "-01",
  // GA
  gaSessions: "", gaUsers: "", gaPageviews: "", gaBounceRate: "", gaAvgSessionDuration: "",
  // GSC
  gscImpressions: "", gscClicks: "", gscCtr: "", gscAvgPosition: "",
  // SEO
  seoKeywordsTop3: "", seoKeywordsTop10: "", seoKeywordsTop100: "", seoBacklinks: "", seoDomainRating: "",
  // AEO
  aeoVisibilityScore: "", aeoCitations: "", aeoBrandMentions: "",
  // META
  metaSpend: "", metaImpressions: "", metaClicks: "", metaConversions: "", metaCtr: "", metaCpc: "", metaRoas: "",
  // Google Ads
  googleAdsSpend: "", googleAdsImpressions: "", googleAdsClicks: "", googleAdsConversions: "", googleAdsCtr: "", googleAdsCpc: "", googleAdsRoas: "",
  // LinkedIn Ads
  linkedinAdsSpend: "", linkedinAdsImpressions: "", linkedinAdsClicks: "", linkedinAdsConversions: "", linkedinAdsCtr: "", linkedinAdsCpc: "",
  // TikTok Ads
  tiktokAdsSpend: "", tiktokAdsImpressions: "", tiktokAdsClicks: "", tiktokAdsConversions: "", tiktokAdsCtr: "", tiktokAdsCpc: "",
  // Instagram
  igFollowers: "", igFollowing: "", igPosts: "", igReach: "", igEngagementRate: "",
  // Facebook
  fbFollowers: "", fbPosts: "", fbReach: "", fbEngagementRate: "",
  // LinkedIn Organic
  liFollowers: "", liPosts: "", liImpressions: "", liEngagementRate: "",
  // TikTok Organic
  ttFollowers: "", ttVideos: "", ttViews: "", ttEngagementRate: "",
  // Twitter
  twFollowers: "", twTweets: "", twImpressions: "", twEngagementRate: "",
  // Content
  contentBlogPosts: "", contentSocialPosts: "", contentEmailsSent: "", contentVideosProduced: "", contentGraphicsCreated: "", contentLandingPages: "",
  // Hours
  hoursSeo: "", hoursContent: "", hoursPaidMedia: "", hoursSocial: "", hoursDesign: "", hoursMaintenance: "", hoursStrategy: "",
  notes: "",
};

export default function ClientMetricsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(() => new Set<Section>(["analytics", "hours"]));

  useEffect(() => { fetchData(); }, [clientId]);

  async function fetchData() {
    setLoading(true);
    const [metricsRes, clientRes] = await Promise.all([
      fetch(`/api/clients/${clientId}/metrics`),
      fetch(`/api/clients/${clientId}`),
    ]);
    setMetrics(await metricsRes.json());
    setClientName((await clientRes.json()).name || "");
    setLoading(false);
  }

  function toggleSection(section: Section) {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) newSet.delete(section);
    else newSet.add(section);
    setExpandedSections(newSet);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: any = { month: form.month };
    Object.keys(form).forEach(key => {
      if (key !== "month" && form[key] !== "") {
        payload[key] = isNaN(parseFloat(form[key])) ? form[key] : parseFloat(form[key]);
      }
    });

    const res = await fetch(`/api/clients/${clientId}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchData();
    }
    setSaving(false);
  }

  function editMetrics(m: any) {
    const newForm: any = { month: m.month.split("T")[0] };
    Object.keys(emptyForm).forEach(key => {
      if (key !== "month") newForm[key] = m[key]?.toString() || "";
    });
    setForm(newForm);
    setEditingId(m.id);
    setShowForm(true);
    setExpandedSections(new Set<Section>(["analytics", "seo", "aeo", "meta", "google", "linkedin", "tiktok", "instagram", "facebook", "liOrganic", "ttOrganic", "twitter", "content", "hours"]));
  }

  async function deleteMetrics(m: any) {
    if (!confirm(`Delete metrics for ${new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}?`)) return;
    await fetch(`/api/metrics/${m.id}`, { method: "DELETE" });
    fetchData();
  }

  const fmt = (n: any) => n === null || n === undefined ? "-" : Number(n).toLocaleString();
  const fmtDec = (n: any, suffix = "") => n === null || n === undefined ? "-" : Number(n).toFixed(2) + suffix;
  const fmtCur = (n: any) => n === null || n === undefined ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const SectionHeader = ({ title, section, color }: { title: string; section: Section; color: string }) => (
    <div 
      onClick={() => toggleSection(section)}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", cursor: "pointer", borderBottom: expandedSections.has(section) ? "1px solid #eee" : "none" }}
    >
      <h4 style={{ margin: 0, color }}>{title}</h4>
      <span style={{ color: "#888" }}>{expandedSections.has(section) ? "▼" : "▶"}</span>
    </div>
  );

  const InputField = ({ label, field, type = "number", step }: { label: string; field: string; type?: string; step?: string }) => (
    <div>
      <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>{label}</label>
      <input
        type={type}
        step={step}
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        placeholder="0"
        style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
      />
    </div>
  );

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Clients</Link>
            <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
            <Link href="/analytics" style={{ color: "#666", textDecoration: "none" }}>Analytics</Link>
            <Link href="/settings" style={{ color: "#666", textDecoration: "none" }}>Settings</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/clients/${clientId}`} style={{ color: "#666", textDecoration: "none" }}>← Back to {clientName}</Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>Performance Metrics</h1>
            <p style={{ margin: "4px 0 0", color: "#666" }}>Track KPIs for {clientName}</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setForm(emptyForm); setEditingId(null); }} style={{ background: "#e74c3c", color: "white", padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer" }}>
            + Add Metrics
          </button>
        </div>

        {showForm && (
          <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Metrics" : "Add Monthly Metrics"}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Month</label>
                <input type="month" value={form.month.slice(0,7)} onChange={(e) => setForm({ ...form, month: e.target.value + "-01" })} required style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4 }} />
              </div>

              {/* Google Analytics */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="Google Analytics" section="analytics" color="#1976d2" />
                {expandedSections.has("analytics") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Sessions" field="gaSessions" />
                    <InputField label="Users" field="gaUsers" />
                    <InputField label="Pageviews" field="gaPageviews" />
                    <InputField label="Bounce Rate %" field="gaBounceRate" step="0.01" />
                  </div>
                )}
              </div>

              {/* Search Console */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="Search Console" section="seo" color="#2e7d32" />
                {expandedSections.has("seo") && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 12 }}>
                      <InputField label="Clicks" field="gscClicks" />
                      <InputField label="Impressions" field="gscImpressions" />
                      <InputField label="CTR %" field="gscCtr" step="0.01" />
                      <InputField label="Avg Position" field="gscAvgPosition" step="0.1" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 12 }}>
                      <InputField label="Keywords Top 3" field="seoKeywordsTop3" />
                      <InputField label="Keywords Top 10" field="seoKeywordsTop10" />
                      <InputField label="Keywords Top 100" field="seoKeywordsTop100" />
                      <InputField label="Backlinks" field="seoBacklinks" />
                      <InputField label="Domain Rating" field="seoDomainRating" step="0.1" />
                    </div>
                  </>
                )}
              </div>

              {/* AEO */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="AEO (AI Engine Optimization)" section="aeo" color="#9c27b0" />
                {expandedSections.has("aeo") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="AI Visibility Score" field="aeoVisibilityScore" step="0.01" />
                    <InputField label="AI Citations" field="aeoCitations" />
                    <InputField label="Brand Mentions" field="aeoBrandMentions" />
                  </div>
                )}
              </div>

              {/* META Ads */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="META Ads (Facebook/Instagram)" section="meta" color="#1877f2" />
                {expandedSections.has("meta") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Spend ($)" field="metaSpend" step="0.01" />
                    <InputField label="Impressions" field="metaImpressions" />
                    <InputField label="Clicks" field="metaClicks" />
                    <InputField label="Conversions" field="metaConversions" />
                    <InputField label="CTR (%)" field="metaCtr" step="0.01" />
                    <InputField label="CPC ($)" field="metaCpc" step="0.01" />
                    <InputField label="ROAS" field="metaRoas" step="0.01" />
                  </div>
                )}
              </div>

              {/* Google Ads */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="Google Ads" section="google" color="#ea4335" />
                {expandedSections.has("google") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Spend ($)" field="googleAdsSpend" step="0.01" />
                    <InputField label="Impressions" field="googleAdsImpressions" />
                    <InputField label="Clicks" field="googleAdsClicks" />
                    <InputField label="Conversions" field="googleAdsConversions" />
                    <InputField label="CTR (%)" field="googleAdsCtr" step="0.01" />
                    <InputField label="CPC ($)" field="googleAdsCpc" step="0.01" />
                    <InputField label="ROAS" field="googleAdsRoas" step="0.01" />
                  </div>
                )}
              </div>

              {/* LinkedIn Ads */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="LinkedIn Ads" section="linkedin" color="#0a66c2" />
                {expandedSections.has("linkedin") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Spend ($)" field="linkedinAdsSpend" step="0.01" />
                    <InputField label="Impressions" field="linkedinAdsImpressions" />
                    <InputField label="Clicks" field="linkedinAdsClicks" />
                    <InputField label="Conversions" field="linkedinAdsConversions" />
                    <InputField label="CTR (%)" field="linkedinAdsCtr" step="0.01" />
                    <InputField label="CPC ($)" field="linkedinAdsCpc" step="0.01" />
                  </div>
                )}
              </div>

              {/* TikTok Ads */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="TikTok Ads" section="tiktok" color="#000000" />
                {expandedSections.has("tiktok") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Spend ($)" field="tiktokAdsSpend" step="0.01" />
                    <InputField label="Impressions" field="tiktokAdsImpressions" />
                    <InputField label="Clicks" field="tiktokAdsClicks" />
                    <InputField label="Conversions" field="tiktokAdsConversions" />
                    <InputField label="CTR (%)" field="tiktokAdsCtr" step="0.01" />
                    <InputField label="CPC ($)" field="tiktokAdsCpc" step="0.01" />
                  </div>
                )}
              </div>

              {/* Instagram Organic */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="Instagram (Organic)" section="instagram" color="#e4405f" />
                {expandedSections.has("instagram") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Followers" field="igFollowers" />
                    <InputField label="Following" field="igFollowing" />
                    <InputField label="Posts" field="igPosts" />
                    <InputField label="Reach" field="igReach" />
                    <InputField label="Engagement Rate (%)" field="igEngagementRate" step="0.01" />
                  </div>
                )}
              </div>

              {/* Facebook Organic */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="Facebook (Organic)" section="facebook" color="#1877f2" />
                {expandedSections.has("facebook") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Followers" field="fbFollowers" />
                    <InputField label="Posts" field="fbPosts" />
                    <InputField label="Reach" field="fbReach" />
                    <InputField label="Engagement Rate (%)" field="fbEngagementRate" step="0.01" />
                  </div>
                )}
              </div>

              {/* LinkedIn Organic */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="LinkedIn (Organic)" section="liOrganic" color="#0a66c2" />
                {expandedSections.has("liOrganic") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Followers" field="liFollowers" />
                    <InputField label="Posts" field="liPosts" />
                    <InputField label="Impressions" field="liImpressions" />
                    <InputField label="Engagement Rate (%)" field="liEngagementRate" step="0.01" />
                  </div>
                )}
              </div>

              {/* TikTok Organic */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="TikTok (Organic)" section="ttOrganic" color="#000000" />
                {expandedSections.has("ttOrganic") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Followers" field="ttFollowers" />
                    <InputField label="Videos" field="ttVideos" />
                    <InputField label="Views" field="ttViews" />
                    <InputField label="Engagement Rate (%)" field="ttEngagementRate" step="0.01" />
                  </div>
                )}
              </div>

              {/* Twitter */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="Twitter / X" section="twitter" color="#1da1f2" />
                {expandedSections.has("twitter") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Followers" field="twFollowers" />
                    <InputField label="Tweets" field="twTweets" />
                    <InputField label="Impressions" field="twImpressions" />
                    <InputField label="Engagement Rate (%)" field="twEngagementRate" step="0.01" />
                  </div>
                )}
              </div>

              {/* Content Deliverables */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="Content Deliverables" section="content" color="#ff5722" />
                {expandedSections.has("content") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="Blog Posts" field="contentBlogPosts" />
                    <InputField label="Social Posts" field="contentSocialPosts" />
                    <InputField label="Emails Sent" field="contentEmailsSent" />
                    <InputField label="Videos Produced" field="contentVideosProduced" />
                    <InputField label="Graphics Created" field="contentGraphicsCreated" />
                    <InputField label="Landing Pages" field="contentLandingPages" />
                  </div>
                )}
              </div>

              {/* Hours Tracking */}
              <div style={{ marginBottom: 16, border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                <SectionHeader title="Hours Tracking" section="hours" color="#f39c12" />
                {expandedSections.has("hours") && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 12 }}>
                    <InputField label="SEO" field="hoursSeo" step="0.5" />
                    <InputField label="Content" field="hoursContent" step="0.5" />
                    <InputField label="Paid Media" field="hoursPaidMedia" step="0.5" />
                    <InputField label="Social" field="hoursSocial" step="0.5" />
                    <InputField label="Design" field="hoursDesign" step="0.5" />
                    <InputField label="Maintenance" field="hoursMaintenance" step="0.5" />
                    <InputField label="Strategy" field="hoursStrategy" step="0.5" />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Monthly highlights, observations, etc." style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#e74c3c", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                  {saving ? "Saving..." : editingId ? "Update Metrics" : "Save Metrics"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} style={{ padding: "10px 20px", background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        {metrics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 8, borderLeft: "4px solid #1976d2" }}>
              <div style={{ fontSize: 12, color: "#888" }}>Sessions</div>
              <div style={{ fontSize: 28, fontWeight: "bold" }}>{fmt(metrics[0].gaSessions)}</div>
              <div style={{ fontSize: 12, color: "#1976d2" }}>Google Analytics</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 8, borderLeft: "4px solid #2e7d32" }}>
              <div style={{ fontSize: 12, color: "#888" }}>GSC Clicks</div>
              <div style={{ fontSize: 28, fontWeight: "bold" }}>{fmt(metrics[0].gscClicks)}</div>
              <div style={{ fontSize: 12, color: "#2e7d32" }}>Search Console</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 8, borderLeft: "4px solid #1877f2" }}>
              <div style={{ fontSize: 12, color: "#888" }}>Total Ad Spend</div>
              <div style={{ fontSize: 28, fontWeight: "bold" }}>{fmtCur((Number(metrics[0].metaSpend) || 0) + (Number(metrics[0].googleAdsSpend) || 0) + (Number(metrics[0].linkedinAdsSpend) || 0) + (Number(metrics[0].tiktokAdsSpend) || 0))}</div>
              <div style={{ fontSize: 12, color: "#1877f2" }}>All Platforms</div>
            </div>
            <div style={{ background: "white", padding: 20, borderRadius: 8, borderLeft: "4px solid #f39c12" }}>
              <div style={{ fontSize: 12, color: "#888" }}>Total Hours</div>
              <div style={{ fontSize: 28, fontWeight: "bold" }}>{fmtDec((Number(metrics[0].hoursSeo) || 0) + (Number(metrics[0].hoursContent) || 0) + (Number(metrics[0].hoursPaidMedia) || 0) + (Number(metrics[0].hoursSocial) || 0) + (Number(metrics[0].hoursDesign) || 0) + (Number(metrics[0].hoursMaintenance) || 0) + (Number(metrics[0].hoursStrategy) || 0))}</div>
              <div style={{ fontSize: 12, color: "#f39c12" }}>This Month</div>
            </div>
          </div>
        )}

        {/* History Table */}
        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          <h3 style={{ margin: 0, padding: 24, borderBottom: "1px solid #eee" }}>Metrics History</h3>
          {metrics.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#888" }}>No metrics recorded yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                <thead>
                  <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Month</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Sessions</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>GSC Clicks</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Ad Spend</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Hours</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 12, fontWeight: 500 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</td>
                      <td style={{ padding: 12 }}>{fmt(m.gaSessions)}</td>
                      <td style={{ padding: 12 }}>{fmt(m.gscClicks)}</td>
                      <td style={{ padding: 12 }}>{fmtCur((Number(m.metaSpend) || 0) + (Number(m.googleAdsSpend) || 0) + (Number(m.linkedinAdsSpend) || 0) + (Number(m.tiktokAdsSpend) || 0))}</td>
                      <td style={{ padding: 12 }}>{fmtDec((Number(m.hoursSeo) || 0) + (Number(m.hoursContent) || 0) + (Number(m.hoursPaidMedia) || 0) + (Number(m.hoursSocial) || 0) + (Number(m.hoursDesign) || 0) + (Number(m.hoursMaintenance) || 0) + (Number(m.hoursStrategy) || 0))}</td>
                      <td style={{ padding: 12 }}>
                        <button onClick={() => editMetrics(m)} style={{ padding: "4px 8px", marginRight: 4, background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => deleteMetrics(m)} style={{ padding: "4px 8px", background: "#fee", color: "#c00", border: "none", borderRadius: 4, cursor: "pointer" }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
