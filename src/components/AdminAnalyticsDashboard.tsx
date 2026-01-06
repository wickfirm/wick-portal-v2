"use client";

import { useState } from "react";
import { theme } from "@/lib/theme";
import MetricsChart, { BarChart, MultiLineChart, DonutChart, Sparkline, DateRangeToggle } from "@/components/MetricsChart";

interface Client {
  id: string;
  name: string;
  status: string;
}

interface AdminAnalyticsDashboardProps {
  clients: Client[];
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  totalTasks: number;
  completedTasks: number;
  clientsByStatus: { status: string; _count: { status: number } }[];
  projectsByType: { serviceType: string; _count: { serviceType: number } }[];
  projectsByStatus: { status: string; _count: { status: number } }[];
  allMetrics: any[];
}

export default function AdminAnalyticsDashboard({
  clients,
  totalProjects,
  completedProjects,
  inProgressProjects,
  totalTasks,
  completedTasks,
  clientsByStatus,
  projectsByType,
  projectsByStatus,
  allMetrics,
}: AdminAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState("12");
  const [selectedClient, setSelectedClient] = useState("all");

  // Filter metrics by client
  var filteredByClient = selectedClient === "all" 
    ? allMetrics 
    : allMetrics.filter(function(m) { return m.clientId === selectedClient; });

  var selectedClientName = selectedClient === "all" 
    ? "All Clients" 
    : clients.find(function(c) { return c.id === selectedClient; })?.name || "Selected Client";

  // Group metrics by month
  var metricsByMonth: Record<string, any> = {};
  
  filteredByClient.forEach(function(m) {
    var monthKey = new Date(m.month).toISOString().slice(0, 7);
    if (!metricsByMonth[monthKey]) {
      metricsByMonth[monthKey] = {
        sessions: 0, clicks: 0, users: 0,
        metaSpend: 0, googleSpend: 0, linkedinSpend: 0, tiktokSpend: 0,
        keywordsTop3: 0, keywordsTop10: 0, keywordsTop100: 0,
        backlinks: 0, domainRating: 0, domainRatingCount: 0,
        aeoVisibility: 0, aeoVisibilityCount: 0, citations: 0, brandMentions: 0,
        igFollowers: 0, fbFollowers: 0, liFollowers: 0, ttFollowers: 0, twFollowers: 0,
        blogPosts: 0, socialPosts: 0, emails: 0, videos: 0, graphics: 0, landingPages: 0,
        hoursSeo: 0, hoursContent: 0, hoursPaidMedia: 0, hoursSocial: 0, hoursDesign: 0, hoursMaintenance: 0, hoursStrategy: 0,
        count: 0
      };
    }
    var mm = metricsByMonth[monthKey];
    mm.sessions += Number(m.gaSessions) || 0;
    mm.clicks += Number(m.gscClicks) || 0;
    mm.users += Number(m.gaUsers) || 0;
    mm.metaSpend += Number(m.metaSpend) || 0;
    mm.googleSpend += Number(m.googleAdsSpend) || 0;
    mm.linkedinSpend += Number(m.linkedinAdsSpend) || 0;
    mm.tiktokSpend += Number(m.tiktokAdsSpend) || 0;
    mm.keywordsTop3 += Number(m.seoKeywordsTop3) || 0;
    mm.keywordsTop10 += Number(m.seoKeywordsTop10) || 0;
    mm.keywordsTop100 += Number(m.seoKeywordsTop100) || 0;
    mm.backlinks += Number(m.seoBacklinks) || 0;
    if (m.seoDomainRating) { mm.domainRating += Number(m.seoDomainRating); mm.domainRatingCount++; }
    if (m.aeoVisibilityScore) { mm.aeoVisibility += Number(m.aeoVisibilityScore); mm.aeoVisibilityCount++; }
    mm.citations += Number(m.aeoCitations) || 0;
    mm.brandMentions += Number(m.aeoBrandMentions) || 0;
    mm.igFollowers = Math.max(mm.igFollowers, Number(m.igFollowers) || 0);
    mm.fbFollowers = Math.max(mm.fbFollowers, Number(m.fbFollowers) || 0);
    mm.liFollowers = Math.max(mm.liFollowers, Number(m.liFollowers) || 0);
    mm.ttFollowers = Math.max(mm.ttFollowers, Number(m.ttFollowers) || 0);
    mm.twFollowers = Math.max(mm.twFollowers, Number(m.twFollowers) || 0);
    mm.blogPosts += Number(m.contentBlogPosts) || 0;
    mm.socialPosts += Number(m.contentSocialPosts) || 0;
    mm.emails += Number(m.contentEmailsSent) || 0;
    mm.videos += Number(m.contentVideosProduced) || 0;
    mm.graphics += Number(m.contentGraphicsCreated) || 0;
    mm.landingPages += Number(m.contentLandingPages) || 0;
    mm.hoursSeo += Number(m.hoursSeo) || 0;
    mm.hoursContent += Number(m.hoursContent) || 0;
    mm.hoursPaidMedia += Number(m.hoursPaidMedia) || 0;
    mm.hoursSocial += Number(m.hoursSocial) || 0;
    mm.hoursDesign += Number(m.hoursDesign) || 0;
    mm.hoursMaintenance += Number(m.hoursMaintenance) || 0;
    mm.hoursStrategy += Number(m.hoursStrategy) || 0;
    mm.count += 1;
  });

  var allMonths = Object.keys(metricsByMonth).sort();
  var filteredMonths = allMonths;
  if (dateRange !== "all") {
    var monthsToShow = parseInt(dateRange);
    filteredMonths = allMonths.slice(-monthsToShow);
  }

  // Traffic Data
  var sessionsData = filteredMonths.map(function(k) {
    return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].sessions };
  });

  var clicksData = filteredMonths.map(function(k) {
    return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].clicks };
  });

  var trafficDatasets = [
    { label: "Sessions", color: theme.colors.info, data: sessionsData },
    { label: "Clicks", color: theme.colors.success, data: clicksData },
  ];

  // SEO Data
  var seoKeywordsDatasets = [
    { label: "Top 3", color: "#10B981", data: filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].keywordsTop3 };
    })},
    { label: "Top 10", color: "#3B82F6", data: filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].keywordsTop10 };
    })},
    { label: "Top 100", color: "#8B5CF6", data: filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].keywordsTop100 };
    })},
  ];

  var backlinksData = filteredMonths.map(function(k) {
    return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].backlinks };
  });

  // AEO Data
  var aeoVisibilityData = filteredMonths.map(function(k) {
    var mm = metricsByMonth[k];
    return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: mm.aeoVisibilityCount > 0 ? mm.aeoVisibility / mm.aeoVisibilityCount : 0 };
  });

  var aeoDatasets = [
    { label: "Citations", color: "#F59E0B", data: filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].citations };
    })},
    { label: "Brand Mentions", color: "#EC4899", data: filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].brandMentions };
    })},
  ];

  // Ad Spend Data
  var spendData = filteredMonths.slice(-6).map(function(k) {
    var mm = metricsByMonth[k];
    return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: mm.metaSpend + mm.googleSpend + mm.linkedinSpend + mm.tiktokSpend };
  });

  var totalMetaSpend = filteredMonths.reduce(function(sum, k) { return sum + metricsByMonth[k].metaSpend; }, 0);
  var totalGoogleSpend = filteredMonths.reduce(function(sum, k) { return sum + metricsByMonth[k].googleSpend; }, 0);
  var totalLinkedinSpend = filteredMonths.reduce(function(sum, k) { return sum + metricsByMonth[k].linkedinSpend; }, 0);
  var totalTiktokSpend = filteredMonths.reduce(function(sum, k) { return sum + metricsByMonth[k].tiktokSpend; }, 0);

  var adSpendBreakdown = [
    { label: "Meta", value: totalMetaSpend, color: "#1877F2" },
    { label: "Google", value: totalGoogleSpend, color: "#EA4335" },
    { label: "LinkedIn", value: totalLinkedinSpend, color: "#0A66C2" },
    { label: "TikTok", value: totalTiktokSpend, color: "#000000" },
  ].filter(function(d) { return d.value > 0; });

  // Social Media Data
  var socialFollowersDatasets = [
    { label: "Instagram", color: "#E4405F", data: filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].igFollowers };
    })},
    { label: "Facebook", color: "#1877F2", data: filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].fbFollowers };
    })},
    { label: "LinkedIn", color: "#0A66C2", data: filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].liFollowers };
    })},
  ];

  // Content Data
  var latestMonth = filteredMonths[filteredMonths.length - 1];
  var latestMM = latestMonth ? metricsByMonth[latestMonth] : null;
  
  var contentData = latestMM ? [
    { label: "Blog", value: latestMM.blogPosts, color: "#10B981" },
    { label: "Social", value: latestMM.socialPosts, color: "#3B82F6" },
    { label: "Emails", value: latestMM.emails, color: "#F59E0B" },
    { label: "Videos", value: latestMM.videos, color: "#EF4444" },
    { label: "Graphics", value: latestMM.graphics, color: "#8B5CF6" },
    { label: "Pages", value: latestMM.landingPages, color: "#EC4899" },
  ].filter(function(d) { return d.value > 0; }) : [];

  // Hours Data
  var totalHoursData = latestMM ? [
    { label: "SEO", value: latestMM.hoursSeo, color: "#10B981" },
    { label: "Content", value: latestMM.hoursContent, color: "#3B82F6" },
    { label: "Paid Media", value: latestMM.hoursPaidMedia, color: "#F59E0B" },
    { label: "Social", value: latestMM.hoursSocial, color: "#EC4899" },
    { label: "Design", value: latestMM.hoursDesign, color: "#8B5CF6" },
    { label: "Maintenance", value: latestMM.hoursMaintenance, color: "#6B7280" },
    { label: "Strategy", value: latestMM.hoursStrategy, color: "#EF4444" },
  ].filter(function(d) { return d.value > 0; }) : [];

  var totalHours = totalHoursData.reduce(function(sum, d) { return sum + d.value; }, 0);

  // Totals
  var totalSessions = filteredMonths.reduce(function(sum, k) { return sum + metricsByMonth[k].sessions; }, 0);
  var totalClicks = filteredMonths.reduce(function(sum, k) { return sum + metricsByMonth[k].clicks; }, 0);
  var totalSpend = totalMetaSpend + totalGoogleSpend + totalLinkedinSpend + totalTiktokSpend;

  // Sparklines
  var sessionsSparkline = filteredMonths.slice(-6).map(function(k) { return metricsByMonth[k]?.sessions || 0; });
  var clicksSparkline = filteredMonths.slice(-6).map(function(k) { return metricsByMonth[k]?.clicks || 0; });

  // Check if sections have data
  var hasSeoData = filteredMonths.some(function(k) { return metricsByMonth[k].keywordsTop3 > 0 || metricsByMonth[k].keywordsTop10 > 0; });
  var hasAeoData = filteredMonths.some(function(k) { return metricsByMonth[k].aeoVisibility > 0 || metricsByMonth[k].citations > 0; });
  var hasSocialData = filteredMonths.some(function(k) { return metricsByMonth[k].igFollowers > 0 || metricsByMonth[k].fbFollowers > 0; });
  var hasContentData = contentData.length > 0;
  var hasHoursData = totalHoursData.length > 0;

  var projectStatusData = projectsByStatus.map(function(item) {
    return { label: item.status.replace("_", " ").slice(0, 8), value: item._count.status };
  });

  var completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  var taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  var activeClients = clients.filter(function(c) { return c.status === "ACTIVE"; }).length;
  var totalClientsCount = clients.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Analytics</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
            {selectedClient === "all" ? "Overview of your agency performance across all clients" : "Performance metrics for " + selectedClientName}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedClient}
            onChange={function(e) { setSelectedClient(e.target.value); }}
            style={{ padding: "8px 12px", fontSize: 13, fontWeight: 500, border: "1px solid " + theme.colors.borderLight, borderRadius: theme.borderRadius.md, background: theme.colors.bgSecondary, color: theme.colors.textPrimary, cursor: "pointer", minWidth: 180 }}
          >
            <option value="all">All Clients</option>
            {clients.map(function(client) { return <option key={client.id} value={client.id}>{client.name}</option>; })}
          </select>
          <DateRangeToggle value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Agency Stats - only for "all clients" */}
      {selectedClient === "all" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.primary, fontWeight: 600 }}>C</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalClientsCount}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Clients</div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>{activeClients} active</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.infoBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.info, fontWeight: 600 }}>P</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalProjects}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Projects</div>
            <div style={{ fontSize: 12, color: theme.colors.info, marginTop: 4 }}>{inProgressProjects} in progress</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.success, fontWeight: 600 }}>%</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{completionRate}%</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Project Completion</div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>{completedProjects} completed</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.warningBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.warning, fontWeight: 600 }}>T</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{taskCompletionRate}%</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Task Completion</div>
            <div style={{ fontSize: 12, color: theme.colors.warning, marginTop: 4 }}>{completedTasks}/{totalTasks} tasks</div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {filteredMonths.length === 0 ? (
        <div style={{ background: theme.colors.bgSecondary, padding: 64, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>M</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No metrics data</div>
          <div style={{ color: theme.colors.textSecondary }}>{selectedClient === "all" ? "No metrics have been recorded yet." : "No metrics recorded for " + selectedClientName + "."}</div>
        </div>
      ) : (
        <>
          {/* Aggregated Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{selectedClient === "all" ? "Total Sessions (All Clients)" : "Total Sessions"}</div>
                <Sparkline data={sessionsSparkline} color={theme.colors.info} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.info }}>{totalSessions.toLocaleString()}</div>
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Total Organic Clicks</div>
                <Sparkline data={clicksSparkline} color={theme.colors.success} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.success }}>{totalClicks.toLocaleString()}</div>
            </div>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>{selectedClient === "all" ? "Total Ad Spend Managed" : "Total Ad Spend"}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.primary }}>${totalSpend.toLocaleString()}</div>
            </div>
          </div>

          {/* Traffic Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Website Traffic</h2>
            {sessionsData.length > 1 && (
              <>
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
              </>
            )}
          </div>

          {/* SEO Section */}
          {hasSeoData && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>SEO Performance</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Keyword Rankings</h3>
                  <MultiLineChart datasets={seoKeywordsDatasets} height={200} />
                </div>
                <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Backlinks Growth</h3>
                  <MetricsChart data={backlinksData} color={theme.colors.info} height={200} />
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

          {/* Paid Media Section */}
          {adSpendBreakdown.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Paid Media</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Ad Spend by Month</h3>
                  <BarChart data={spendData} color={theme.colors.primary} height={180} format="currency" />
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
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Follower Growth</h3>
                <MultiLineChart datasets={socialFollowersDatasets} height={220} />
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
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Content Deliverables (Latest Month)</h3>
                    <BarChart data={contentData} color={theme.colors.info} height={180} />
                  </div>
                )}
                {hasHoursData && (
                  <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px 0" }}>Hours by Service ({totalHours.toFixed(1)}h total)</h3>
                    <DonutChart data={totalHoursData} size={160} thickness={28} format="number" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Breakdowns - only for "all clients" */}
          {selectedClient === "all" && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Agency Overview</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Clients by Status</h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    {clientsByStatus.map(function(item) {
                      var percentage = totalClientsCount > 0 ? Math.round((item._count.status / totalClientsCount) * 100) : 0;
                      var statusColor = item.status === "ACTIVE" ? theme.colors.success : item.status === "ONBOARDING" ? theme.colors.info : theme.colors.textMuted;
                      return (
                        <div key={item.status}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>{item.status}</span>
                            <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textSecondary }}>{item._count.status} ({percentage}%)</span>
                          </div>
                          <div style={{ height: 8, background: theme.colors.bgTertiary, borderRadius: 4 }}>
                            <div style={{ height: "100%", width: percentage + "%", background: statusColor, borderRadius: 4 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Projects by Status</h3>
                  {projectStatusData.length > 0 ? (
                    <BarChart data={projectStatusData} color={theme.colors.info} height={160} />
                  ) : (
                    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>No projects yet</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
