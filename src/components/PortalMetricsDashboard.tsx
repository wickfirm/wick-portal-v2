"use client";

import { useState } from "react";
import { theme } from "@/lib/theme";
import MetricsChart, { BarChart, MultiLineChart, DonutChart, Sparkline, DateRangeToggle } from "@/components/MetricsChart";

interface Metric {
  id: string;
  month: Date | string;
  gaSessions: number | null;
  gaUsers: number | null;
  gaPageviews: number | null;
  gaBounceRate: any;
  gscImpressions: number | null;
  gscClicks: number | null;
  gscCtr: any;
  gscAvgPosition: any;
  // SEO
  seoKeywordsTop3: number | null;
  seoKeywordsTop10: number | null;
  seoKeywordsTop100: number | null;
  seoBacklinks: number | null;
  seoDomainRating: any;
  // AEO
  aeoVisibilityScore: any;
  aeoCitations: number | null;
  aeoBrandMentions: number | null;
  // Ads
  metaSpend: any;
  googleAdsSpend: any;
  linkedinAdsSpend: any;
  tiktokAdsSpend: any;
  // Social
  igFollowers: number | null;
  fbFollowers: number | null;
  liFollowers: number | null;
  ttFollowers: number | null;
  twFollowers: number | null;
  igEngagementRate: any;
  fbEngagementRate: any;
  liEngagementRate: any;
  ttEngagementRate: any;
  twEngagementRate: any;
  // Content
  contentBlogPosts: number | null;
  contentSocialPosts: number | null;
  contentEmailsSent: number | null;
  contentVideosProduced: number | null;
  contentGraphicsCreated: number | null;
  contentLandingPages: number | null;
  // Hours
  hoursSeo: any;
  hoursContent: any;
  hoursPaidMedia: any;
  hoursSocial: any;
  hoursDesign: any;
  hoursMaintenance: any;
  hoursStrategy: any;
}

interface PortalMetricsDashboardProps {
  metrics: Metric[];
}

export default function PortalMetricsDashboard({ metrics }: PortalMetricsDashboardProps) {
  const [dateRange, setDateRange] = useState("12");

  var filteredMetrics = metrics;
  if (dateRange !== "all") {
    var monthsToShow = parseInt(dateRange);
    filteredMetrics = metrics.slice(-monthsToShow);
  }

  var fmt = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toLocaleString(); };
  var fmtDec = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toFixed(1); };
  var fmtPct = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toFixed(2) + "%"; };
  var fmtCur = function(n: any) { return n === null || n === undefined ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  var latest = filteredMetrics[filteredMetrics.length - 1];
  var previous = filteredMetrics[filteredMetrics.length - 2];

  var getChange = function(current: any, prev: any) {
    if (!current || !prev) return null;
    var curr = Number(current) || 0;
    var p = Number(prev) || 0;
    if (p === 0) return null;
    return Math.round(((curr - p) / p) * 100);
  };

  // Traffic Data
  var sessionsData = filteredMetrics.map(function(m) {
    return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.gaSessions) || 0 };
  });

  var clicksData = filteredMetrics.map(function(m) {
    return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.gscClicks) || 0 };
  });

  var trafficDatasets = [
    { label: "Sessions", color: theme.colors.info, data: sessionsData },
    { label: "Users", color: theme.colors.success, data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.gaUsers) || 0 };
    })},
  ];

  // SEO Data
  var seoKeywordsDatasets = [
    { label: "Top 3", color: "#10B981", data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.seoKeywordsTop3) || 0 };
    })},
    { label: "Top 10", color: "#3B82F6", data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.seoKeywordsTop10) || 0 };
    })},
    { label: "Top 100", color: "#8B5CF6", data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.seoKeywordsTop100) || 0 };
    })},
  ];

  var domainRatingData = filteredMetrics.map(function(m) {
    return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.seoDomainRating) || 0 };
  });

  var backlinksData = filteredMetrics.map(function(m) {
    return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.seoBacklinks) || 0 };
  });

  // AEO Data
  var aeoVisibilityData = filteredMetrics.map(function(m) {
    return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.aeoVisibilityScore) || 0 };
  });

  var aeoDatasets = [
    { label: "Citations", color: "#F59E0B", data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.aeoCitations) || 0 };
    })},
    { label: "Brand Mentions", color: "#EC4899", data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.aeoBrandMentions) || 0 };
    })},
  ];

  // Ad Spend Data
  var adSpendData = filteredMetrics.slice(-6).map(function(m) {
    return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: (Number(m.metaSpend) || 0) + (Number(m.googleAdsSpend) || 0) + (Number(m.linkedinAdsSpend) || 0) + (Number(m.tiktokAdsSpend) || 0) };
  });

  var latestMetaSpend = Number(latest?.metaSpend) || 0;
  var latestGoogleSpend = Number(latest?.googleAdsSpend) || 0;
  var latestLinkedinSpend = Number(latest?.linkedinAdsSpend) || 0;
  var latestTiktokSpend = Number(latest?.tiktokAdsSpend) || 0;
  var totalAdSpend = latestMetaSpend + latestGoogleSpend + latestLinkedinSpend + latestTiktokSpend;

  var adSpendBreakdown = [
    { label: "Meta", value: latestMetaSpend, color: "#1877F2" },
    { label: "Google", value: latestGoogleSpend, color: "#EA4335" },
    { label: "LinkedIn", value: latestLinkedinSpend, color: "#0A66C2" },
    { label: "TikTok", value: latestTiktokSpend, color: "#000000" },
  ].filter(function(d) { return d.value > 0; });

  // Social Media Data
  var socialFollowersDatasets = [
    { label: "Instagram", color: "#E4405F", data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.igFollowers) || 0 };
    })},
    { label: "Facebook", color: "#1877F2", data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.fbFollowers) || 0 };
    })},
    { label: "LinkedIn", color: "#0A66C2", data: filteredMetrics.map(function(m) {
      return { label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }), value: Number(m.liFollowers) || 0 };
    })},
  ];

  var latestSocialFollowers = [
    { label: "Instagram", value: Number(latest?.igFollowers) || 0, color: "#E4405F", engagement: Number(latest?.igEngagementRate) || 0 },
    { label: "Facebook", value: Number(latest?.fbFollowers) || 0, color: "#1877F2", engagement: Number(latest?.fbEngagementRate) || 0 },
    { label: "LinkedIn", value: Number(latest?.liFollowers) || 0, color: "#0A66C2", engagement: Number(latest?.liEngagementRate) || 0 },
    { label: "TikTok", value: Number(latest?.ttFollowers) || 0, color: "#000000", engagement: Number(latest?.ttEngagementRate) || 0 },
    { label: "Twitter", value: Number(latest?.twFollowers) || 0, color: "#1DA1F2", engagement: Number(latest?.twEngagementRate) || 0 },
  ].filter(function(d) { return d.value > 0; });

  // Content Data
  var latestContent = {
    blogPosts: Number(latest?.contentBlogPosts) || 0,
    socialPosts: Number(latest?.contentSocialPosts) || 0,
    emails: Number(latest?.contentEmailsSent) || 0,
    videos: Number(latest?.contentVideosProduced) || 0,
    graphics: Number(latest?.contentGraphicsCreated) || 0,
    landingPages: Number(latest?.contentLandingPages) || 0,
  };

  var contentData = [
    { label: "Blog", value: latestContent.blogPosts, color: "#10B981" },
    { label: "Social", value: latestContent.socialPosts, color: "#3B82F6" },
    { label: "Emails", value: latestContent.emails, color: "#F59E0B" },
    { label: "Videos", value: latestContent.videos, color: "#EF4444" },
    { label: "Graphics", value: latestContent.graphics, color: "#8B5CF6" },
    { label: "Pages", value: latestContent.landingPages, color: "#EC4899" },
  ].filter(function(d) { return d.value > 0; });

  // Hours Data
  var latestHours = {
    seo: Number(latest?.hoursSeo) || 0,
    content: Number(latest?.hoursContent) || 0,
    paidMedia: Number(latest?.hoursPaidMedia) || 0,
    social: Number(latest?.hoursSocial) || 0,
    design: Number(latest?.hoursDesign) || 0,
    maintenance: Number(latest?.hoursMaintenance) || 0,
    strategy: Number(latest?.hoursStrategy) || 0,
  };
  var totalHours = latestHours.seo + latestHours.content + latestHours.paidMedia + latestHours.social + latestHours.design + latestHours.maintenance + latestHours.strategy;

  var hoursData = [
    { label: "SEO", value: latestHours.seo, color: "#10B981" },
    { label: "Content", value: latestHours.content, color: "#3B82F6" },
    { label: "Paid Media", value: latestHours.paidMedia, color: "#F59E0B" },
    { label: "Social", value: latestHours.social, color: "#EC4899" },
    { label: "Design", value: latestHours.design, color: "#8B5CF6" },
    { label: "Maintenance", value: latestHours.maintenance, color: "#6B7280" },
    { label: "Strategy", value: latestHours.strategy, color: "#EF4444" },
  ].filter(function(d) { return d.value > 0; });

  // Sparklines
  var sessionsSparkline = filteredMetrics.slice(-6).map(function(m) { return Number(m.gaSessions) || 0; });
  var clicksSparkline = filteredMetrics.slice(-6).map(function(m) { return Number(m.gscClicks) || 0; });
  var domainRatingSparkline = filteredMetrics.slice(-6).map(function(m) { return Number(m.seoDomainRating) || 0; });
  var aeoSparkline = filteredMetrics.slice(-6).map(function(m) { return Number(m.aeoVisibilityScore) || 0; });

  // Check if sections have data
  var hasSeoData = filteredMetrics.some(function(m) { return m.seoKeywordsTop3 || m.seoKeywordsTop10 || m.seoDomainRating; });
  var hasAeoData = filteredMetrics.some(function(m) { return m.aeoVisibilityScore || m.aeoCitations; });
  var hasSocialData = latestSocialFollowers.length > 0;
  var hasContentData = contentData.length > 0;
  var hasHoursData = hoursData.length > 0;

  return (
    <div>
      {/* Header with Date Range Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Performance Metrics</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>Track your digital marketing performance.</p>
        </div>
        <DateRangeToggle value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Sessions</div>
            <Sparkline data={sessionsSparkline} color={theme.colors.info} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmt(latest?.gaSessions)}</div>
          {getChange(latest?.gaSessions, previous?.gaSessions) !== null && (
            <div style={{ fontSize: 12, color: getChange(latest?.gaSessions, previous?.gaSessions)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
              {getChange(latest?.gaSessions, previous?.gaSessions)! >= 0 ? "+" : ""}{getChange(latest?.gaSessions, previous?.gaSessions)}% vs last month
            </div>
          )}
        </div>

        <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Organic Clicks</div>
            <Sparkline data={clicksSparkline} color={theme.colors.success} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmt(latest?.gscClicks)}</div>
          {getChange(latest?.gscClicks, previous?.gscClicks) !== null && (
            <div style={{ fontSize: 12, color: getChange(latest?.gscClicks, previous?.gscClicks)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
              {getChange(latest?.gscClicks, previous?.gscClicks)! >= 0 ? "+" : ""}{getChange(latest?.gscClicks, previous?.gscClicks)}% vs last month
            </div>
          )}
        </div>

        <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Domain Rating</div>
            <Sparkline data={domainRatingSparkline} color={theme.colors.warning} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmtDec(latest?.seoDomainRating)}</div>
          {getChange(latest?.seoDomainRating, previous?.seoDomainRating) !== null && (
            <div style={{ fontSize: 12, color: getChange(latest?.seoDomainRating, previous?.seoDomainRating)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
              {getChange(latest?.seoDomainRating, previous?.seoDomainRating)! >= 0 ? "+" : ""}{getChange(latest?.seoDomainRating, previous?.seoDomainRating)}% vs last month
            </div>
          )}
        </div>

        <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>AEO Visibility</div>
            <Sparkline data={aeoSparkline} color={"#F59E0B"} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmtDec(latest?.aeoVisibilityScore)}%</div>
          {getChange(latest?.aeoVisibilityScore, previous?.aeoVisibilityScore) !== null && (
            <div style={{ fontSize: 12, color: getChange(latest?.aeoVisibilityScore, previous?.aeoVisibilityScore)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
              {getChange(latest?.aeoVisibilityScore, previous?.aeoVisibilityScore)! >= 0 ? "+" : ""}{getChange(latest?.aeoVisibilityScore, previous?.aeoVisibilityScore)}% vs last month
            </div>
          )}
        </div>
      </div>

      {/* Traffic Section */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Website Traffic</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Sessions Trend</h3>
            <MetricsChart data={sessionsData} color={theme.colors.info} height={180} />
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Organic Clicks Trend</h3>
            <MetricsChart data={clicksData} color={theme.colors.success} height={180} />
          </div>
        </div>
        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Traffic Overview</h3>
          <MultiLineChart datasets={trafficDatasets} height={220} />
        </div>
      </div>

      {/* SEO Section */}
      {hasSeoData && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>SEO Performance</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Keyword Rankings</h3>
              <MultiLineChart datasets={seoKeywordsDatasets} height={200} />
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Domain Rating & Backlinks</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: theme.colors.bgTertiary, padding: 16, borderRadius: theme.borderRadius.md, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.warning }}>{fmtDec(latest?.seoDomainRating)}</div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Domain Rating</div>
                </div>
                <div style={{ background: theme.colors.bgTertiary, padding: 16, borderRadius: theme.borderRadius.md, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.info }}>{fmt(latest?.seoBacklinks)}</div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Backlinks</div>
                </div>
              </div>
              <MetricsChart data={backlinksData} color={theme.colors.info} height={120} />
            </div>
          </div>
        </div>
      )}

      {/* AEO Section */}
      {hasAeoData && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>AI Engine Optimization (AEO)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Visibility Score Trend</h3>
              <MetricsChart data={aeoVisibilityData} color={"#F59E0B"} height={180} format="percent" />
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Citations & Brand Mentions</h3>
              <MultiLineChart datasets={aeoDatasets} height={180} />
            </div>
          </div>
        </div>
      )}

      {/* Ad Spend Section */}
      {totalAdSpend > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Paid Media</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Ad Spend by Month</h3>
              <BarChart data={adSpendData} color={theme.colors.primary} height={180} format="currency" />
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px 0" }}>Ad Spend by Platform</h3>
              <DonutChart data={adSpendBreakdown} size={160} thickness={28} format="currency" />
            </div>
          </div>
        </div>
      )}

      {/* Social Media Section */}
      {hasSocialData && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Social Media</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Follower Growth</h3>
              <MultiLineChart datasets={socialFollowersDatasets} height={200} />
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Current Followers & Engagement</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {latestSocialFollowers.map(function(platform) {
                  return (
                    <div key={platform.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: theme.colors.bgTertiary, borderRadius: theme.borderRadius.md }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: platform.color }} />
                        <span style={{ fontWeight: 500 }}>{platform.label}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600 }}>{platform.value.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{platform.engagement.toFixed(1)}% eng.</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content & Hours Section */}
      {(hasContentData || hasHoursData) && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Content & Time Allocation</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {hasContentData && (
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Content Deliverables (This Month)</h3>
                <BarChart data={contentData} color={theme.colors.info} height={180} />
              </div>
            )}
            {hasHoursData && (
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px 0" }}>Hours by Service ({totalHours.toFixed(1)}h total)</h3>
                <DonutChart data={hoursData} size={160} thickness={28} format="number" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Detailed Data</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Google Analytics</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgPrimary }}>
                    <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Month</th>
                    <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Sessions</th>
                    <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Users</th>
                    <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Bounce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMetrics.slice(-6).reverse().map(function(m) {
                    return (
                      <tr key={m.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                        <td style={{ padding: 12, fontWeight: 500, fontSize: 13 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                        <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmt(m.gaSessions)}</td>
                        <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmt(m.gaUsers)}</td>
                        <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmtPct(m.gaBounceRate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Search Console</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgPrimary }}>
                    <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Month</th>
                    <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Clicks</th>
                    <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>Impr.</th>
                    <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 11, color: theme.colors.textSecondary }}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMetrics.slice(-6).reverse().map(function(m) {
                    return (
                      <tr key={m.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                        <td style={{ padding: 12, fontWeight: 500, fontSize: 13 }}>{new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                        <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmt(m.gscClicks)}</td>
                        <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmt(m.gscImpressions)}</td>
                        <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmtPct(m.gscCtr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
