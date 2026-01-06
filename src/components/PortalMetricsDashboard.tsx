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
  metaSpend: any;
  googleAdsSpend: any;
  linkedinAdsSpend: any;
  tiktokAdsSpend: any;
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
  var fmtDec = function(n: any) { return n === null || n === undefined ? "-" : Number(n).toFixed(2); };
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

  var sessionsData = filteredMetrics.map(function(m) {
    return {
      label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
      value: Number(m.gaSessions) || 0,
    };
  });

  var clicksData = filteredMetrics.map(function(m) {
    return {
      label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
      value: Number(m.gscClicks) || 0,
    };
  });

  var adSpendData = filteredMetrics.slice(-6).map(function(m) {
    return {
      label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
      value: (Number(m.metaSpend) || 0) + (Number(m.googleAdsSpend) || 0),
    };
  });

  var trafficDatasets = [
    {
      label: "Sessions",
      color: theme.colors.info,
      data: sessionsData,
    },
    {
      label: "Users",
      color: theme.colors.success,
      data: filteredMetrics.map(function(m) {
        return {
          label: new Date(m.month).toLocaleDateString("en-US", { month: "short" }),
          value: Number(m.gaUsers) || 0,
        };
      }),
    },
  ];

  // Sparkline data (last 6 data points)
  var sessionsSparkline = filteredMetrics.slice(-6).map(function(m) { return Number(m.gaSessions) || 0; });
  var clicksSparkline = filteredMetrics.slice(-6).map(function(m) { return Number(m.gscClicks) || 0; });
  var positionSparkline = filteredMetrics.slice(-6).map(function(m) { return Number(m.gscAvgPosition) || 0; });

  // Donut chart data for ad spend breakdown
  var latestMetaSpend = Number(latest?.metaSpend) || 0;
  var latestGoogleSpend = Number(latest?.googleAdsSpend) || 0;
  var latestLinkedinSpend = Number(latest?.linkedinAdsSpend) || 0;
  var latestTiktokSpend = Number(latest?.tiktokAdsSpend) || 0;

  var adSpendBreakdown = [
    { label: "Meta", value: latestMetaSpend, color: "#1877F2" },
    { label: "Google", value: latestGoogleSpend, color: "#EA4335" },
    { label: "LinkedIn", value: latestLinkedinSpend, color: "#0A66C2" },
    { label: "TikTok", value: latestTiktokSpend, color: "#000000" },
  ].filter(function(d) { return d.value > 0; });

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

      {/* Summary Cards with Sparklines */}
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
          <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>Total Ad Spend</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>
            {fmtCur(latestMetaSpend + latestGoogleSpend + latestLinkedinSpend + latestTiktokSpend)}
          </div>
          <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
            {adSpendBreakdown.length} platform{adSpendBreakdown.length !== 1 ? "s" : ""} active
          </div>
        </div>

        <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Avg Position</div>
            <Sparkline data={positionSparkline} color={theme.colors.warning} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{fmtDec(latest?.gscAvgPosition)}</div>
          {getChange(previous?.gscAvgPosition, latest?.gscAvgPosition) !== null && (
            <div style={{ fontSize: 12, color: getChange(previous?.gscAvgPosition, latest?.gscAvgPosition)! >= 0 ? theme.colors.success : theme.colors.error, marginTop: 4 }}>
              {getChange(previous?.gscAvgPosition, latest?.gscAvgPosition)! >= 0 ? "+" : ""}{getChange(previous?.gscAvgPosition, latest?.gscAvgPosition)}% improvement
            </div>
          )}
        </div>
      </div>

      {/* Line Charts */}
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

      {/* Traffic Overview */}
      <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Traffic Overview</h3>
        <MultiLineChart datasets={trafficDatasets} height={220} />
      </div>

      {/* Ad Spend Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Ad Spend by Month</h3>
          <BarChart data={adSpendData} color={theme.colors.primary} height={180} format="currency" />
        </div>
        <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px 0" }}>Ad Spend by Platform</h3>
          {adSpendBreakdown.length > 0 ? (
            <DonutChart data={adSpendBreakdown} size={160} thickness={28} format="currency" />
          ) : (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
              No ad spend data
            </div>
          )}
        </div>
      </div>

      {/* Data Tables */}
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
  );
}
