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
        sessions: 0, clicks: 0, users: 0, pageviews: 0,
        impressions: 0, ctr: 0, ctrCount: 0, avgPosition: 0, avgPositionCount: 0,
        bounceRate: 0, bounceRateCount: 0,
        metaSpend: 0, googleSpend: 0, linkedinSpend: 0, tiktokSpend: 0,
        keywordsTop3: 0, keywordsTop10: 0, keywordsTop100: 0,
        backlinks: 0, domainRating: 0, domainRatingCount: 0,
        aeoVisibility: 0, aeoVisibilityCount: 0, citations: 0, brandMentions: 0,
        igFollowers: 0, fbFollowers: 0, liFollowers: 0, ttFollowers: 0, twFollowers: 0,
        igEngagement: 0, fbEngagement: 0, liEngagement: 0, ttEngagement: 0, twEngagement: 0,
        blogPosts: 0, socialPosts: 0, emails: 0, videos: 0, graphics: 0, landingPages: 0,
        hoursSeo: 0, hoursContent: 0, hoursPaidMedia: 0, hoursSocial: 0, hoursDesign: 0, hoursMaintenance: 0, hoursStrategy: 0,
        count: 0
      };
    }
    var mm = metricsByMonth[monthKey];
    mm.sessions += Number(m.gaSessions) || 0;
    mm.clicks += Number(m.gscClicks) || 0;
    mm.users += Number(m.gaUsers) || 0;
    mm.pageviews += Number(m.gaPageviews) || 0;
    mm.impressions += Number(m.gscImpressions) || 0;
    if (m.gscCtr) { mm.ctr += Number(m.gscCtr); mm.ctrCount++; }
    if (m.gscAvgPosition) { mm.avgPosition += Number(m.gscAvgPosition); mm.avgPositionCount++; }
    if (m.gaBounceRate) { mm.bounceRate += Number(m.gaBounceRate); mm.bounceRateCount++; }
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
    mm.igEngagement = Number(m.igEngagementRate) || mm.igEngagement;
    mm.fbEngagement = Number(m.fbEngagementRate) || mm.fbEngagement;
    mm.liEngagement = Number(m.liEngagementRate) || mm.liEngagement;
    mm.ttEngagement = Number(m.ttEngagementRate) || mm.ttEngagement;
    mm.twEngagement = Number(m.twEngagementRate) || mm.twEngagement;
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

  // Get latest and previous month data
  var latestMonth = filteredMonths[filteredMonths.length - 1];
  var previousMonth = filteredMonths[filteredMonths.length - 2];
  var latestMM = latestMonth ? metricsByMonth[latestMonth] : null;
  var previousMM = previousMonth ? metricsByMonth[previousMonth] : null;

  var getChange = function(current: any, prev: any) {
    if (!current || !prev) return null;
    var curr = Number(current) || 0;
    var p = Number(prev) || 0;
    if (p === 0) return null;
    return Math.round(((curr - p) / p) * 100);
  };

  var fmtDec = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toFixed(1); };
  var fmtPct = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toFixed(2) + "%"; };

  // Traffic Data
  var sessionsData = filteredMonths.map(function(k) {
    return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].sessions };
  });

  var clicksData = filteredMonths.map(function(k) {
    return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].clicks };
  });

  var trafficDatasets = [
    { label: "Sessions", color: theme.colors.info, data: sessionsData },
    { label: selectedClient === "all" ? "Clicks" : "Users", color: theme.colors.success, data: selectedClient === "all" ? clicksData : filteredMonths.map(function(k) {
      return { label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }), value: metricsByMonth[k].users };
    })},
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

  var latestSocialFollowers = latestMM ? [
    { label: "Instagram", value: latestMM.igFollowers, color: "#E4405F", engagement: latestMM.igEngagement },
    { label: "Facebook", value: latestMM.fbFollowers, color: "#1877F2", engagement: latestMM.fbEngagement },
    { label: "LinkedIn", value: latestMM.liFollowers, color: "#0A66C2", engagement: latestMM.liEngagement },
    { label: "TikTok", value: latestMM.ttFollowers, color: "#000000", engagement: latestMM.ttEngagement },
    { label: "Twitter", value: latestMM.twFollowers, color: "#1DA1F2", engagement: latestMM.twEngagement },
  ].filter(function(d) { return d.value > 0; }) : [];

  // Content Data
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

  // Hours by client (for "All Clients" view)
  var hoursByClient: { clientId: string; clientName: string; hours: number }[] = [];
  if (selectedClient === "all") {
    var clientHoursMap: Record<string, number> = {};
    filteredByClient.forEach(function(m) {
      var monthKey = new Date(m.month).toISOString().slice(0, 7);
      if (filteredMonths.indexOf(monthKey) === -1) return;
      if (!clientHoursMap[m.clientId]) clientHoursMap[m.clientId] = 0;
      clientHoursMap[m.clientId] += (Number(m.hoursSeo) || 0) + (Number(m.hoursContent) || 0) + (Number(m.hoursPaidMedia) || 0) + (Number(m.hoursSocial) || 0) + (Number(m.hoursDesign) || 0) + (Number(m.hoursMaintenance) || 0) + (Number(m.hoursStrategy) || 0);
    });
    clients.forEach(function(c) {
      if (clientHoursMap[c.id] && clientHoursMap[c.id] > 0) {
        hoursByClient.push({ clientId: c.id, clientName: c.name, hours: clientHoursMap[c.id] });
      }
    });
    hoursByClient.sort(function(a, b) { return b.hours - a.hours; });
  }

  // Totals
  var totalSessions = filteredMonths.reduce(function(sum, k) { return sum + metricsByMonth[k].sessions; }, 0);
  var totalClicks = filteredMonths.reduce(function(sum, k) { return sum + metricsByMonth[k].clicks; }, 0);
  var totalSpend = totalMetaSpend + totalGoogleSpend + totalLinkedinSpend + totalTiktokSpend;

  // Sparklines
  var sessionsSparkline = filteredMonths.slice(-6).map(function(k) { return metricsByMonth[k]?.sessions || 0; });
  var clicksSparkline = filteredMonths.slice(-6).map(function(k) { return metricsByMonth[k]?.clicks || 0; });
  var domainRatingSparkline = filteredMonths.slice(-6).map(function(k) { 
    var mm = metricsByMonth[k]; 
    return mm && mm.domainRatingCount > 0 ? mm.domainRating / mm.domainRatingCount : 0; 
  });
  var aeoSparkline = filteredMonths.slice(-6).map(function(k) { 
    var mm = metricsByMonth[k]; 
    return mm && mm.aeoVisibilityCount > 0 ? mm.aeoVisibility / mm.aeoVisibilityCount : 0; 
  });

  // Check if sections have data
  var hasSeoData = filteredMonths.some(function(k) { return metricsByMonth[k].keywordsTop3 > 0 || metricsByMonth[k].keywordsTop10 > 0 || metricsByMonth[k].backlinks > 0; });
  var hasAeoData = filteredMonths.some(function(k) { return metricsByMonth[k].aeoVisibility > 0 || metricsByMonth[k].citations > 0; });
  var hasSocialData = filteredMonths.some(function(k) { return metricsByMonth[k].igFollowers > 0 || metricsByMonth[k].fbFollowers > 0 || metricsByMonth[k].liFollowers > 0; });
  var hasAdSpendData = adSpendBreakdown.length > 0;
  var hasContentData = contentData.length > 0;
  var hasHoursData = totalHoursData.length > 0 || hoursByClient.length > 0;
  var hasTrafficData = totalSessions > 0 || totalClicks > 0;

  // Latest values for single client view
  var latestDomainRating = latestMM && latestMM.domainRatingCount > 0 ? latestMM.domainRating / latestMM.domainRatingCount : 0;
  var latestAeoVisibility = latestMM && latestMM.aeoVisibilityCount > 0 ? latestMM.aeoVisibility / latestMM.aeoVisibilityCount : 0;
  var latestBacklinks = latestMM ? latestMM.backlinks : 0;
  var previousDomainRating = previousMM && previousMM.domainRatingCount > 0 ? previousMM.domainRating / previousMM.domainRatingCount : 0;
  var previousAeoVisibility = previousMM && previousMM.aeoVisibilityCount > 0 ? previousMM.aeoVisibility / previousMM.aeoVisibilityCount : 0;

  var projectStatusData = projectsByStatus.map(function(item) {
    return { label: item.status.replace("_", " ").slice(0, 8), value: item._count.status };
  });

  var completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  var taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  var activeClients = clients.filter(function(c) { return c.status === "ACTIVE"; }).length;
  var totalClientsCount = clients.length;

  // Colors for client hours
  var clientColors = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16", "#6366F1"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>Analytics</h1>
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
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.primary }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalClientsCount}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Clients</div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>{activeClients} active</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.infoBg, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.info }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalProjects}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Projects</div>
            <div style={{ fontSize: 12, color: theme.colors.info, marginTop: 4 }}>{inProgressProjects} in progress</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.success }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{completionRate}%</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Project Completion</div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>{completedProjects} completed</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.warningBg, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.warning }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{taskCompletionRate}%</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Task Completion</div>
            <div style={{ fontSize: 12, color: theme.colors.warning, marginTop: 4 }}>{completedTasks}/{totalTasks} tasks</div>
          </div>
        </div>
      )}

      {/* Single Client Summary Cards */}
      {selectedClient !== "all" && filteredMonths.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Sessions</div>
              <Sparkline data={sessionsSparkline} color={theme.colors.info} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{(latestMM?.sessions || 0).toLocaleString()}</div>
            {getChange(latestMM?.sessions, previousMM?.sessions) !== null && (
              <div style={{ fontSize: 12, color: getChange(latestMM?.sessions, previousMM?.sessions)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
                {getChange(latestMM?.sessions, previousMM?.sessions)! >= 0 ? "+" : ""}{getChange(latestMM?.sessions, previousMM?.sessions)}% vs last month
              </div>
            )}
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Organic Clicks</div>
              <Sparkline data={clicksSparkline} color={theme.colors.success} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{(latestMM?.clicks || 0).toLocaleString()}</div>
            {getChange(latestMM?.clicks, previousMM?.clicks) !== null && (
              <div style={{ fontSize: 12, color: getChange(latestMM?.clicks, previousMM?.clicks)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
                {getChange(latestMM?.clicks, previousMM?.clicks)! >= 0 ? "+" : ""}{getChange(latestMM?.clicks, previousMM?.clicks)}% vs last month
              </div>
            )}
          </div>

          {hasSeoData && (
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Domain Rating</div>
                <Sparkline data={domainRatingSparkline} color={theme.colors.warning} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmtDec(latestDomainRating)}</div>
              {getChange(latestDomainRating, previousDomainRating) !== null && (
                <div style={{ fontSize: 12, color: getChange(latestDomainRating, previousDomainRating)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
                  {getChange(latestDomainRating, previousDomainRating)! >= 0 ? "+" : ""}{getChange(latestDomainRating, previousDomainRating)}% vs last month
                </div>
              )}
            </div>
          )}

          {hasAeoData && (
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>AEO Visibility</div>
                <Sparkline data={aeoSparkline} color={"#F59E0B"} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmtDec(latestAeoVisibility)}%</div>
              {getChange(latestAeoVisibility, previousAeoVisibility) !== null && (
                <div style={{ fontSize: 12, color: getChange(latestAeoVisibility, previousAeoVisibility)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
                  {getChange(latestAeoVisibility, previousAeoVisibility)! >= 0 ? "+" : ""}{getChange(latestAeoVisibility, previousAeoVisibility)}% vs last month
                </div>
              )}
            </div>
          )}

          {!hasSeoData && !hasAeoData && (
            <>
              <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>Total Ad Spend</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.primary }}>${totalSpend.toLocaleString()}</div>
              </div>
              <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>Total Hours</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalHours.toFixed(1)}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* No Data State */}
      {filteredMonths.length === 0 ? (
        <div style={{ background: theme.colors.bgSecondary, padding: 64, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, textAlign: "center" }}>
          <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No metrics data</div>
          <div style={{ color: theme.colors.textSecondary }}>{selectedClient === "all" ? "No metrics have been recorded yet." : "No metrics recorded for " + selectedClientName + "."}</div>
        </div>
      ) : (
        <>
          {/* Aggregated Metrics - All Clients */}
          {selectedClient === "all" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Total Sessions (All Clients)</div>
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
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>Total Ad Spend Managed</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.primary }}>${totalSpend.toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Website Traffic Section */}
          {hasTrafficData && (
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
          )}

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
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Domain Rating & Backlinks</h3>
                  {selectedClient !== "all" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div style={{ background: theme.colors.bgTertiary, padding: 16, borderRadius: theme.borderRadius.md, textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.warning }}>{fmtDec(latestDomainRating)}</div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Domain Rating</div>
                      </div>
                      <div style={{ background: theme.colors.bgTertiary, padding: 16, borderRadius: theme.borderRadius.md, textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.info }}>{latestBacklinks.toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Backlinks</div>
                      </div>
                    </div>
                  )}
                  <MetricsChart data={backlinksData} color={theme.colors.info} height={selectedClient !== "all" ? 120 : 200} />
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
          {hasAdSpendData && (
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
              <div style={{ display: "grid", gridTemplateColumns: selectedClient !== "all" ? "1fr 1fr" : "1fr", gap: 24 }}>
                <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Follower Growth</h3>
                  <MultiLineChart datasets={socialFollowersDatasets} height={200} />
                </div>
                {selectedClient !== "all" ? null : null}
                {selectedClient !== "all" && latestSocialFollowers.length > 0 && (
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
                )}
              </div>
            </div>
          )}

          {/* Content & Hours Section */}
          {hasHoursData && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>Content & Time Allocation</h2>
              
              {/* All Clients - Hours by Client */}
              {selectedClient === "all" && hoursByClient.length > 0 && (
                <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px 0" }}>Hours by Client</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <DonutChart 
                      data={hoursByClient.map(function(c, i) {
                        return { label: c.clientName, value: c.hours, color: clientColors[i % clientColors.length] };
                      })} 
                      size={180} 
                      thickness={32} 
                      format="number" 
                    />
                  </div>
                </div>
              )}

              {/* Single Client - Content + Hours */}
              {selectedClient !== "all" && (
                <div style={{ display: "grid", gridTemplateColumns: hasContentData && hasHoursData ? "1fr 1fr" : "1fr", gap: 24 }}>
                  {hasContentData && (
                    <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Content Deliverables (This Month)</h3>
                      <BarChart data={contentData} color={theme.colors.info} height={180} />
                    </div>
                  )}
                  {totalHoursData.length > 0 && (
                    <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px 0" }}>Hours by Service ({totalHours.toFixed(1)}h total)</h3>
                      <DonutChart data={totalHoursData} size={160} thickness={28} format="number" />
                    </div>
                  )}
                </div>
              )}
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

          {/* Detailed Data Tables - Single Client Only */}
          {selectedClient !== "all" && (
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
                        {filteredMonths.slice(-6).reverse().map(function(monthKey) {
                          var mm = metricsByMonth[monthKey];
                          var bounceRate = mm.bounceRateCount > 0 ? mm.bounceRate / mm.bounceRateCount : 0;
                          return (
                            <tr key={monthKey} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                              <td style={{ padding: 12, fontWeight: 500, fontSize: 13 }}>{new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                              <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{mm.sessions.toLocaleString()}</td>
                              <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{mm.users.toLocaleString()}</td>
                              <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmtPct(bounceRate)}</td>
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
                        {filteredMonths.slice(-6).reverse().map(function(monthKey) {
                          var mm = metricsByMonth[monthKey];
                          var ctr = mm.ctrCount > 0 ? mm.ctr / mm.ctrCount : 0;
                          return (
                            <tr key={monthKey} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                              <td style={{ padding: 12, fontWeight: 500, fontSize: 13 }}>{new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                              <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{mm.clicks.toLocaleString()}</td>
                              <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{mm.impressions.toLocaleString()}</td>
                              <td style={{ padding: 12, textAlign: "right", fontSize: 13 }}>{fmtPct(ctr)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
