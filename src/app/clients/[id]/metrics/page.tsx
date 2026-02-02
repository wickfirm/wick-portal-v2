"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";
import MetricsChart, {
  Sparkline,
  BarChart,
  MultiLineChart,
  DonutChart,
} from "@/components/MetricsChart";

type Section = "analytics" | "seo" | "aeo" | "meta" | "google" | "linkedin" | "tiktok" | "instagram" | "facebook" | "liOrganic" | "ttOrganic" | "twitter" | "content" | "hours";

const icons = {
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  dollar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  chart: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  trendUp: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  trendDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

const sectionColors: Record<string, string> = {
  analytics: "#1976d2",
  seo: "#34a853",
  aeo: theme.colors.primary,
  meta: "#1877f2",
  google: "#ea4335",
  linkedin: "#0a66c2",
  tiktok: "#333333",
  instagram: "#e4405f",
  facebook: "#1877f2",
  liOrganic: "#0a66c2",
  ttOrganic: "#333333",
  twitter: "#1da1f2",
  content: "#ff5722",
  hours: "#f9ab00",
};

const emptyForm: any = {
  month: new Date().toISOString().slice(0, 7) + "-01",
  gaSessions: "", gaUsers: "", gaPageviews: "", gaBounceRate: "", gaAvgSessionDuration: "",
  gscImpressions: "", gscClicks: "", gscCtr: "", gscAvgPosition: "",
  seoKeywordsTop3: "", seoKeywordsTop10: "", seoKeywordsTop100: "", seoBacklinks: "", seoDomainRating: "",
  aeoVisibilityScore: "", aeoCitations: "", aeoBrandMentions: "",
  metaSpend: "", metaImpressions: "", metaClicks: "", metaConversions: "", metaCtr: "", metaCpc: "", metaRoas: "",
  googleAdsSpend: "", googleAdsImpressions: "", googleAdsClicks: "", googleAdsConversions: "", googleAdsCtr: "", googleAdsCpc: "", googleAdsRoas: "",
  linkedinAdsSpend: "", linkedinAdsImpressions: "", linkedinAdsClicks: "", linkedinAdsConversions: "", linkedinAdsCtr: "", linkedinAdsCpc: "",
  tiktokAdsSpend: "", tiktokAdsImpressions: "", tiktokAdsClicks: "", tiktokAdsConversions: "", tiktokAdsCtr: "", tiktokAdsCpc: "",
  igFollowers: "", igFollowing: "", igPosts: "", igReach: "", igEngagementRate: "",
  fbFollowers: "", fbPosts: "", fbReach: "", fbEngagementRate: "",
  liFollowers: "", liPosts: "", liImpressions: "", liEngagementRate: "",
  ttFollowers: "", ttVideos: "", ttViews: "", ttEngagementRate: "",
  twFollowers: "", twTweets: "", twImpressions: "", twEngagementRate: "",
  contentBlogPosts: "", contentSocialPosts: "", contentEmailsSent: "", contentVideosProduced: "", contentGraphicsCreated: "", contentLandingPages: "",
  hoursSeo: "", hoursContent: "", hoursPaidMedia: "", hoursSocial: "", hoursDesign: "", hoursMaintenance: "", hoursStrategy: "",
  notes: "",
};

// Helpers
function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[d.getMonth()] + " '" + String(d.getFullYear()).slice(2);
}

function getTotalSpend(m: any) {
  return (Number(m.metaSpend) || 0) + (Number(m.googleAdsSpend) || 0) + (Number(m.linkedinAdsSpend) || 0) + (Number(m.tiktokAdsSpend) || 0);
}

function getTotalHours(m: any) {
  return (Number(m.hoursSeo) || 0) + (Number(m.hoursContent) || 0) + (Number(m.hoursPaidMedia) || 0) + (Number(m.hoursSocial) || 0) + (Number(m.hoursDesign) || 0) + (Number(m.hoursMaintenance) || 0) + (Number(m.hoursStrategy) || 0);
}

function getTrend(current: number, previous: number) {
  if (!previous || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return { text: (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%", positive: pct >= 0 };
}

function getSparklineData(metrics: any[], field: string | ((m: any) => number)): number[] {
  return [...metrics].reverse().map(m => typeof field === "function" ? field(m) : Number(m[field]) || 0);
}

function getChartData(metrics: any[], field: string | ((m: any) => number)) {
  return [...metrics].reverse().map(m => ({
    label: getMonthLabel(m.month),
    value: typeof field === "function" ? field(m) : Number(m[field]) || 0,
  }));
}

const fmt = (n: any) => n === null || n === undefined ? "-" : Number(n).toLocaleString();
const fmtDec = (n: any, suffix = "") => n === null || n === undefined ? "-" : Number(n).toFixed(1) + suffix;
const fmtCur = (n: any) => n === null || n === undefined ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(() => new Set<Section>(["analytics", "hours"]));
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

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
        payload[key] = key === "notes" ? form[key] : (isNaN(parseFloat(form[key])) ? form[key] : parseFloat(form[key]));
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

  const latest = metrics[0];
  const prev = metrics[1];

  // Chart card wrapper
  const ChartCard = ({ title, children, style: extraStyle }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
      background: theme.colors.bgSecondary,
      borderRadius: 14,
      border: `1px solid ${theme.colors.borderLight}`,
      padding: 20,
      ...extraStyle,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );

  // Section header for form
  const SectionHeader = ({ title, section, color }: { title: string; section: Section; color: string }) => (
    <div
      onClick={() => toggleSection(section)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        cursor: "pointer",
        borderBottom: expandedSections.has(section) ? `1px solid ${theme.colors.borderLight}` : "none",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color }}>{title}</span>
      <span style={{
        color: theme.colors.textMuted,
        transform: expandedSections.has(section) ? "rotate(0deg)" : "rotate(-90deg)",
        transition: "transform 200ms ease",
        display: "inline-flex",
      }}>{icons.chevron}</span>
    </div>
  );

  // Form input
  const InputField = ({ label, field, type = "number", step }: { label: string; field: string; type?: string; step?: string }) => (
    <div>
      <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary }}>{label}</label>
      <input
        type={type}
        step={step}
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        placeholder="0"
        style={{
          width: "100%",
          padding: "8px 12px",
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 10,
          fontSize: 13,
          boxSizing: "border-box" as const,
          color: theme.colors.textPrimary,
          background: theme.colors.bgPrimary,
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
        onBlur={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
      />
    </div>
  );

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ height: 16, width: 120, background: theme.colors.bgSecondary, borderRadius: 6, marginBottom: 16 }} />
            <div style={{ height: 32, width: 260, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
            <div style={{ height: 16, width: 200, background: theme.colors.bgSecondary, borderRadius: 6 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ height: 110, background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>
            <div style={{ height: 260, background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }} />
            <div style={{ height: 260, background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }} />
          </div>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 64, background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}`, marginBottom: 10 }} />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28, ...anim(0.05) }}>
          <Link
            href={`/clients/${clientId}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              color: theme.colors.textMuted, textDecoration: "none", fontSize: 13, fontWeight: 500, marginBottom: 16,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.colors.textMuted)}
          >
            {icons.arrowLeft} Back to {clientName}
          </Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>
                Performance Metrics
              </h1>
              <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>Track KPIs for {clientName}</p>
            </div>
            <button
              onClick={() => { setShowForm(true); setForm(emptyForm); setEditingId(null); setExpandedSections(new Set<Section>(["analytics", "hours"])); }}
              style={{
                padding: "10px 22px", background: theme.gradients.primary, color: "white", border: "none",
                borderRadius: 10, cursor: "pointer", fontWeight: 500, fontSize: 13,
                boxShadow: theme.shadows.button, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}
            >
              {icons.plus} Add Metrics
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        {metrics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24, ...anim(0.1) }}>
            {[
              {
                icon: icons.analytics, iconBg: `${theme.colors.primary}15`, iconColor: theme.colors.primary,
                label: "Sessions", value: fmt(latest.gaSessions),
                sparkData: getSparklineData(metrics, "gaSessions"), sparkColor: theme.colors.primary,
                trend: prev ? getTrend(Number(latest.gaSessions) || 0, Number(prev.gaSessions) || 0) : null,
              },
              {
                icon: icons.search, iconBg: `${theme.colors.success}15`, iconColor: theme.colors.success,
                label: "GSC Clicks", value: fmt(latest.gscClicks),
                sparkData: getSparklineData(metrics, "gscClicks"), sparkColor: theme.colors.success,
                trend: prev ? getTrend(Number(latest.gscClicks) || 0, Number(prev.gscClicks) || 0) : null,
              },
              {
                icon: icons.dollar, iconBg: "#1877f215", iconColor: "#1877f2",
                label: "Total Ad Spend", value: fmtCur(getTotalSpend(latest)),
                sparkData: getSparklineData(metrics, getTotalSpend), sparkColor: "#1877f2",
                trend: prev ? getTrend(getTotalSpend(latest), getTotalSpend(prev)) : null,
              },
              {
                icon: icons.clock, iconBg: "#f9ab0015", iconColor: "#f9ab00",
                label: "Total Hours", value: fmtDec(getTotalHours(latest), "h"),
                sparkData: getSparklineData(metrics, getTotalHours), sparkColor: "#f9ab00",
                trend: prev ? getTrend(getTotalHours(latest), getTotalHours(prev)) : null,
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: theme.colors.bgSecondary, borderRadius: 14,
                  border: `1px solid ${theme.colors.borderLight}`, padding: "18px 20px",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", cursor: "default", position: "relative",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ position: "absolute", top: 16, right: 16 }}>
                  <Sparkline data={card.sparkData} color={card.sparkColor} width={64} height={20} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, background: card.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center", color: card.iconColor, flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: theme.colors.textMuted }}>{card.label}</span>
                  {card.trend && (
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: card.trend.positive ? theme.colors.success : theme.colors.error,
                      display: "flex", alignItems: "center", gap: 2,
                    }}>
                      {card.trend.positive ? icons.trendUp : icons.trendDown} {card.trend.text}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {metrics.length >= 2 && (
          <>
            {/* Row 1: Traffic + Ad Spend Donut */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16, ...anim(0.15) }}>
              <ChartCard title="Website Traffic">
                <MultiLineChart
                  datasets={[
                    { label: "Sessions", data: getChartData(metrics, "gaSessions"), color: theme.colors.primary },
                    { label: "Users", data: getChartData(metrics, "gaUsers"), color: "#d8ee91" },
                  ]}
                  height={220}
                />
              </ChartCard>
              <ChartCard title="Ad Spend Distribution">
                <DonutChart
                  data={[
                    { label: "Meta", value: Number(latest.metaSpend) || 0, color: "#1877f2" },
                    { label: "Google", value: Number(latest.googleAdsSpend) || 0, color: "#ea4335" },
                    { label: "LinkedIn", value: Number(latest.linkedinAdsSpend) || 0, color: "#0a66c2" },
                    { label: "TikTok", value: Number(latest.tiktokAdsSpend) || 0, color: "#333333" },
                  ].filter(d => d.value > 0)}
                  size={160}
                  thickness={28}
                  format="currency"
                />
              </ChartCard>
            </div>

            {/* Row 2: Hours + Social Followers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, ...anim(0.2) }}>
              <ChartCard title="Hours by Department">
                <BarChart
                  data={[
                    { label: "SEO", value: Number(latest.hoursSeo) || 0 },
                    { label: "Content", value: Number(latest.hoursContent) || 0 },
                    { label: "Paid", value: Number(latest.hoursPaidMedia) || 0 },
                    { label: "Social", value: Number(latest.hoursSocial) || 0 },
                    { label: "Design", value: Number(latest.hoursDesign) || 0 },
                    { label: "Maint.", value: Number(latest.hoursMaintenance) || 0 },
                    { label: "Strategy", value: Number(latest.hoursStrategy) || 0 },
                  ]}
                  color={theme.colors.primary}
                  height={200}
                />
              </ChartCard>
              <ChartCard title="Social Followers Growth">
                <MultiLineChart
                  datasets={[
                    { label: "Instagram", data: getChartData(metrics, "igFollowers"), color: "#e4405f" },
                    { label: "Facebook", data: getChartData(metrics, "fbFollowers"), color: "#1877f2" },
                    { label: "LinkedIn", data: getChartData(metrics, "liFollowers"), color: "#0a66c2" },
                    { label: "TikTok", data: getChartData(metrics, "ttFollowers"), color: "#333" },
                  ]}
                  height={200}
                />
              </ChartCard>
            </div>

            {/* Row 3: SEO Domain Rating + Content Deliverables */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24, ...anim(0.25) }}>
              <ChartCard title="SEO Domain Rating">
                <MetricsChart
                  data={getChartData(metrics, "seoDomainRating")}
                  color={theme.colors.success}
                  height={180}
                  format="number"
                />
              </ChartCard>
              <ChartCard title="Content Deliverables (Latest Month)">
                <BarChart
                  data={[
                    { label: "Blog", value: Number(latest.contentBlogPosts) || 0 },
                    { label: "Social", value: Number(latest.contentSocialPosts) || 0 },
                    { label: "Emails", value: Number(latest.contentEmailsSent) || 0 },
                    { label: "Videos", value: Number(latest.contentVideosProduced) || 0 },
                    { label: "Graphics", value: Number(latest.contentGraphicsCreated) || 0 },
                    { label: "Landing", value: Number(latest.contentLandingPages) || 0 },
                  ]}
                  color="#ff5722"
                  height={180}
                />
              </ChartCard>
            </div>
          </>
        )}

        {/* Metrics History */}
        <div style={{ ...anim(0.3) }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 12 }}>Metrics History</div>
          {metrics.length === 0 ? (
            <div style={{
              background: theme.colors.bgSecondary, borderRadius: 14,
              border: `1px solid ${theme.colors.borderLight}`, padding: 64, textAlign: "center",
            }}>
              <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>{icons.chart}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>No metrics recorded yet</div>
              <div style={{ fontSize: 14, color: theme.colors.textMuted }}>Add your first monthly metrics to start tracking performance.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {metrics.map((m) => {
                const isExpanded = expandedMonth === m.id;
                const monthLabel = new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                return (
                  <div key={m.id} style={{
                    background: theme.colors.bgSecondary, borderRadius: 14,
                    border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden",
                    transition: "all 0.15s ease",
                  }}>
                    {/* Row header */}
                    <div
                      onClick={() => setExpandedMonth(isExpanded ? null : m.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 20px", cursor: "pointer", transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.bgPrimary)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{
                          transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform 200ms ease", display: "inline-flex", color: theme.colors.textMuted,
                        }}>{icons.chevron}</span>
                        <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary }}>{monthLabel}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[
                            { label: "Sessions", value: fmt(m.gaSessions), color: theme.colors.primary },
                            { label: "Clicks", value: fmt(m.gscClicks), color: theme.colors.success },
                            { label: "Spend", value: fmtCur(getTotalSpend(m)), color: "#1877f2" },
                            { label: "Hours", value: fmtDec(getTotalHours(m), "h"), color: "#f9ab00" },
                          ].map((badge, i) => (
                            <span key={i} style={{
                              fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                              background: `${badge.color}10`, color: badge.color,
                            }}>
                              {badge.label}: {badge.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); editMetrics(m); }}
                          title="Edit"
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent",
                            color: theme.colors.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.infoBg; e.currentTarget.style.color = theme.colors.primary; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textMuted; }}
                        >{icons.edit}</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMetrics(m); }}
                          title="Delete"
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent",
                            color: theme.colors.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.errorBg; e.currentTarget.style.color = theme.colors.error; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textMuted; }}
                        >{icons.trash}</button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${theme.colors.borderLight}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 16 }}>
                          {[
                            { section: "Google Analytics", items: [["Sessions", fmt(m.gaSessions)], ["Users", fmt(m.gaUsers)], ["Pageviews", fmt(m.gaPageviews)], ["Bounce Rate", fmtDec(m.gaBounceRate, "%")]] },
                            { section: "Search Console", items: [["Clicks", fmt(m.gscClicks)], ["Impressions", fmt(m.gscImpressions)], ["CTR", fmtDec(m.gscCtr, "%")], ["Avg Position", fmtDec(m.gscAvgPosition)]] },
                            { section: "SEO", items: [["Top 3", fmt(m.seoKeywordsTop3)], ["Top 10", fmt(m.seoKeywordsTop10)], ["Backlinks", fmt(m.seoBacklinks)], ["DR", fmtDec(m.seoDomainRating)]] },
                            { section: "AEO", items: [["Visibility", fmtDec(m.aeoVisibilityScore)], ["Citations", fmt(m.aeoCitations)], ["Mentions", fmt(m.aeoBrandMentions)]] },
                          ].map((group, gi) => (
                            <div key={gi} style={{ background: theme.colors.bgPrimary, borderRadius: 10, padding: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 8 }}>{group.section}</div>
                              {group.items.map(([label, value], ii) => (
                                <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", color: theme.colors.textSecondary }}>
                                  <span>{label}</span>
                                  <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{value}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        {/* Social + Ads row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
                          {[
                            { section: "Meta Ads", items: [["Spend", fmtCur(m.metaSpend)], ["Clicks", fmt(m.metaClicks)], ["Conv.", fmt(m.metaConversions)], ["ROAS", fmtDec(m.metaRoas, "x")]] },
                            { section: "Google Ads", items: [["Spend", fmtCur(m.googleAdsSpend)], ["Clicks", fmt(m.googleAdsClicks)], ["Conv.", fmt(m.googleAdsConversions)], ["ROAS", fmtDec(m.googleAdsRoas, "x")]] },
                            { section: "Social (Organic)", items: [["IG", fmt(m.igFollowers)], ["FB", fmt(m.fbFollowers)], ["LI", fmt(m.liFollowers)], ["TT", fmt(m.ttFollowers)]] },
                            { section: "Content", items: [["Blog", fmt(m.contentBlogPosts)], ["Social", fmt(m.contentSocialPosts)], ["Videos", fmt(m.contentVideosProduced)], ["Graphics", fmt(m.contentGraphicsCreated)]] },
                          ].map((group, gi) => (
                            <div key={gi} style={{ background: theme.colors.bgPrimary, borderRadius: 10, padding: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 8 }}>{group.section}</div>
                              {group.items.map(([label, value], ii) => (
                                <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", color: theme.colors.textSecondary }}>
                                  <span>{label}</span>
                                  <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{value}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        {m.notes && (
                          <div style={{ marginTop: 12, padding: "10px 14px", background: theme.colors.bgTertiary, borderRadius: 10, fontSize: 13, color: theme.colors.textSecondary }}>
                            <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>Notes:</span> {m.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{
              background: theme.colors.bgSecondary, borderRadius: 16, padding: 32,
              maxWidth: 900, width: "95%", maxHeight: "90vh", overflowY: "auto", boxShadow: theme.shadows.lg,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, margin: 0, color: theme.colors.textPrimary }}>
                  {editingId ? "Edit Metrics" : "Add Monthly Metrics"}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "none", background: theme.colors.bgTertiary,
                    color: theme.colors.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.errorBg; e.currentTarget.style.color = theme.colors.error; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.bgTertiary; e.currentTarget.style.color = theme.colors.textMuted; }}
                >{icons.x}</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Month</label>
                  <input
                    type="month"
                    value={form.month.slice(0, 7)}
                    onChange={(e) => setForm({ ...form, month: e.target.value + "-01" })}
                    required
                    style={{
                      padding: "10px 14px", border: `1px solid ${theme.colors.borderLight}`, borderRadius: 10,
                      fontSize: 14, color: theme.colors.textPrimary, background: theme.colors.bgPrimary, outline: "none",
                    }}
                  />
                </div>

                {/* Form sections */}
                {([
                  { key: "analytics" as Section, title: "Google Analytics", fields: [
                    { label: "Sessions", field: "gaSessions" }, { label: "Users", field: "gaUsers" },
                    { label: "Pageviews", field: "gaPageviews" }, { label: "Bounce Rate %", field: "gaBounceRate", step: "0.01" },
                  ]},
                  { key: "seo" as Section, title: "Search Console + SEO", fields: [
                    { label: "Clicks", field: "gscClicks" }, { label: "Impressions", field: "gscImpressions" },
                    { label: "CTR %", field: "gscCtr", step: "0.01" }, { label: "Avg Position", field: "gscAvgPosition", step: "0.1" },
                    { label: "Keywords Top 3", field: "seoKeywordsTop3" }, { label: "Keywords Top 10", field: "seoKeywordsTop10" },
                    { label: "Backlinks", field: "seoBacklinks" }, { label: "Domain Rating", field: "seoDomainRating", step: "0.1" },
                  ]},
                  { key: "aeo" as Section, title: "AEO (AI Engine Optimization)", fields: [
                    { label: "Visibility Score", field: "aeoVisibilityScore", step: "0.01" },
                    { label: "Citations", field: "aeoCitations" }, { label: "Brand Mentions", field: "aeoBrandMentions" },
                  ]},
                  { key: "meta" as Section, title: "META Ads", fields: [
                    { label: "Spend ($)", field: "metaSpend", step: "0.01" }, { label: "Impressions", field: "metaImpressions" },
                    { label: "Clicks", field: "metaClicks" }, { label: "Conversions", field: "metaConversions" },
                    { label: "CTR %", field: "metaCtr", step: "0.01" }, { label: "CPC ($)", field: "metaCpc", step: "0.01" },
                    { label: "ROAS", field: "metaRoas", step: "0.01" },
                  ]},
                  { key: "google" as Section, title: "Google Ads", fields: [
                    { label: "Spend ($)", field: "googleAdsSpend", step: "0.01" }, { label: "Impressions", field: "googleAdsImpressions" },
                    { label: "Clicks", field: "googleAdsClicks" }, { label: "Conversions", field: "googleAdsConversions" },
                    { label: "CTR %", field: "googleAdsCtr", step: "0.01" }, { label: "CPC ($)", field: "googleAdsCpc", step: "0.01" },
                    { label: "ROAS", field: "googleAdsRoas", step: "0.01" },
                  ]},
                  { key: "linkedin" as Section, title: "LinkedIn Ads", fields: [
                    { label: "Spend ($)", field: "linkedinAdsSpend", step: "0.01" }, { label: "Impressions", field: "linkedinAdsImpressions" },
                    { label: "Clicks", field: "linkedinAdsClicks" }, { label: "Conversions", field: "linkedinAdsConversions" },
                    { label: "CTR %", field: "linkedinAdsCtr", step: "0.01" }, { label: "CPC ($)", field: "linkedinAdsCpc", step: "0.01" },
                  ]},
                  { key: "tiktok" as Section, title: "TikTok Ads", fields: [
                    { label: "Spend ($)", field: "tiktokAdsSpend", step: "0.01" }, { label: "Impressions", field: "tiktokAdsImpressions" },
                    { label: "Clicks", field: "tiktokAdsClicks" }, { label: "Conversions", field: "tiktokAdsConversions" },
                    { label: "CTR %", field: "tiktokAdsCtr", step: "0.01" }, { label: "CPC ($)", field: "tiktokAdsCpc", step: "0.01" },
                  ]},
                  { key: "instagram" as Section, title: "Instagram (Organic)", fields: [
                    { label: "Followers", field: "igFollowers" }, { label: "Following", field: "igFollowing" },
                    { label: "Posts", field: "igPosts" }, { label: "Reach", field: "igReach" },
                    { label: "Engagement %", field: "igEngagementRate", step: "0.01" },
                  ]},
                  { key: "facebook" as Section, title: "Facebook (Organic)", fields: [
                    { label: "Followers", field: "fbFollowers" }, { label: "Posts", field: "fbPosts" },
                    { label: "Reach", field: "fbReach" }, { label: "Engagement %", field: "fbEngagementRate", step: "0.01" },
                  ]},
                  { key: "liOrganic" as Section, title: "LinkedIn (Organic)", fields: [
                    { label: "Followers", field: "liFollowers" }, { label: "Posts", field: "liPosts" },
                    { label: "Impressions", field: "liImpressions" }, { label: "Engagement %", field: "liEngagementRate", step: "0.01" },
                  ]},
                  { key: "ttOrganic" as Section, title: "TikTok (Organic)", fields: [
                    { label: "Followers", field: "ttFollowers" }, { label: "Videos", field: "ttVideos" },
                    { label: "Views", field: "ttViews" }, { label: "Engagement %", field: "ttEngagementRate", step: "0.01" },
                  ]},
                  { key: "twitter" as Section, title: "Twitter / X", fields: [
                    { label: "Followers", field: "twFollowers" }, { label: "Tweets", field: "twTweets" },
                    { label: "Impressions", field: "twImpressions" }, { label: "Engagement %", field: "twEngagementRate", step: "0.01" },
                  ]},
                  { key: "content" as Section, title: "Content Deliverables", fields: [
                    { label: "Blog Posts", field: "contentBlogPosts" }, { label: "Social Posts", field: "contentSocialPosts" },
                    { label: "Emails Sent", field: "contentEmailsSent" }, { label: "Videos", field: "contentVideosProduced" },
                    { label: "Graphics", field: "contentGraphicsCreated" }, { label: "Landing Pages", field: "contentLandingPages" },
                  ]},
                  { key: "hours" as Section, title: "Hours Tracking", fields: [
                    { label: "SEO", field: "hoursSeo", step: "0.5" }, { label: "Content", field: "hoursContent", step: "0.5" },
                    { label: "Paid Media", field: "hoursPaidMedia", step: "0.5" }, { label: "Social", field: "hoursSocial", step: "0.5" },
                    { label: "Design", field: "hoursDesign", step: "0.5" }, { label: "Maintenance", field: "hoursMaintenance", step: "0.5" },
                    { label: "Strategy", field: "hoursStrategy", step: "0.5" },
                  ]},
                ] as { key: Section; title: string; fields: { label: string; field: string; step?: string }[] }[]).map(({ key, title, fields }) => (
                  <div key={key} style={{ marginBottom: 12, border: `1px solid ${theme.colors.borderLight}`, borderRadius: 12, padding: "4px 16px 4px" }}>
                    <SectionHeader title={title} section={key} color={sectionColors[key] || theme.colors.textPrimary} />
                    {expandedSections.has(key) && (
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(fields.length, 4)}, 1fr)`, gap: 10, padding: "12px 0" }}>
                        {fields.map(f => <InputField key={f.field} label={f.label} field={f.field} step={f.step} />)}
                      </div>
                    )}
                  </div>
                ))}

                {/* Notes */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Monthly highlights, observations, etc."
                    style={{
                      width: "100%", padding: "10px 14px", border: `1px solid ${theme.colors.borderLight}`,
                      borderRadius: 10, fontSize: 13, boxSizing: "border-box" as const, resize: "vertical" as const,
                      color: theme.colors.textPrimary, background: theme.colors.bgPrimary, outline: "none",
                      fontFamily: "inherit", transition: "border-color 0.15s",
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
                    onBlur={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
                  />
                </div>

                {/* Form buttons */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }}
                    style={{
                      padding: "10px 22px", background: theme.colors.bgPrimary, color: theme.colors.textSecondary,
                      border: `1px solid ${theme.colors.borderLight}`, borderRadius: 10, fontWeight: 500, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: "10px 22px",
                      background: saving ? theme.colors.bgTertiary : theme.gradients.primary,
                      color: saving ? theme.colors.textMuted : "white",
                      border: "none", borderRadius: 10, fontWeight: 500, fontSize: 13,
                      cursor: saving ? "not-allowed" : "pointer",
                      boxShadow: saving ? "none" : theme.shadows.button,
                    }}
                  >
                    {saving ? "Saving..." : editingId ? "Update Metrics" : "Save Metrics"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
