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

  // Get selected client name for display
  var selectedClientName = selectedClient === "all" 
    ? "All Clients" 
    : clients.find(function(c) { return c.id === selectedClient; })?.name || "Selected Client";

  // Group metrics by month
  var metricsByMonth: Record<string, { sessions: number; clicks: number; metaSpend: number; googleSpend: number; linkedinSpend: number; tiktokSpend: number; count: number }> = {};
  
  filteredByClient.forEach(function(m) {
    var monthKey = new Date(m.month).toISOString().slice(0, 7);
    if (!metricsByMonth[monthKey]) {
      metricsByMonth[monthKey] = { sessions: 0, clicks: 0, metaSpend: 0, googleSpend: 0, linkedinSpend: 0, tiktokSpend: 0, count: 0 };
    }
    metricsByMonth[monthKey].sessions += Number(m.gaSessions) || 0;
    metricsByMonth[monthKey].clicks += Number(m.gscClicks) || 0;
    metricsByMonth[monthKey].metaSpend += Number(m.metaSpend) || 0;
    metricsByMonth[monthKey].googleSpend += Number(m.googleAdsSpend) || 0;
    metricsByMonth[monthKey].linkedinSpend += Number(m.linkedinAdsSpend) || 0;
    metricsByMonth[monthKey].tiktokSpend += Number(m.tiktokAdsSpend) || 0;
    metricsByMonth[monthKey].count += 1;
  });

  var allMonths = Object.keys(metricsByMonth).sort();
  var filteredMonths = allMonths;
  if (dateRange !== "all") {
    var monthsToShow = parseInt(dateRange);
    filteredMonths = allMonths.slice(-monthsToShow);
  }

  var sessionsData = filteredMonths.map(function(monthKey) {
    return {
      label: new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short" }),
      value: metricsByMonth[monthKey].sessions,
    };
  });

  var clicksData = filteredMonths.map(function(monthKey) {
    return {
      label: new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short" }),
      value: metricsByMonth[monthKey].clicks,
    };
  });

  var spendData = filteredMonths.slice(-6).map(function(monthKey) {
    return {
      label: new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short" }),
      value: metricsByMonth[monthKey].metaSpend + metricsByMonth[monthKey].googleSpend,
    };
  });

  var trafficDatasets = [
    { label: "Sessions", color: theme.colors.info, data: sessionsData },
    { label: "Clicks", color: theme.colors.success, data: clicksData },
  ];

  var projectStatusData = projectsByStatus.map(function(item) {
    return {
      label: item.status.replace("_", " ").slice(0, 8),
      value: item._count.status,
    };
  });

  var completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  var taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  var totalSessions = filteredMonths.reduce(function(sum, key) { return sum + metricsByMonth[key].sessions; }, 0);
  var totalClicks = filteredMonths.reduce(function(sum, key) { return sum + metricsByMonth[key].clicks; }, 0);
  var totalSpend = filteredMonths.reduce(function(sum, key) {
    return sum + metricsByMonth[key].metaSpend + metricsByMonth[key].googleSpend + metricsByMonth[key].linkedinSpend + metricsByMonth[key].tiktokSpend;
  }, 0);

  // Sparklines
  var sessionsSparkline = filteredMonths.slice(-6).map(function(k) { return metricsByMonth[k]?.sessions || 0; });
  var clicksSparkline = filteredMonths.slice(-6).map(function(k) { return metricsByMonth[k]?.clicks || 0; });

  // Total ad spend by platform for donut
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

  // Count clients with metrics
  var activeClients = clients.filter(function(c) { return c.status === "ACTIVE"; }).length;
  var totalClients = clients.length;

  return (
    <div>
      {/* Header with Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Analytics</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
            {selectedClient === "all" 
              ? "Overview of your agency performance across all clients"
              : "Performance metrics for " + selectedClientName
            }
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Client Filter */}
          <select
            value={selectedClient}
            onChange={function(e) { setSelectedClient(e.target.value); }}
            style={{
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid " + theme.colors.borderLight,
              borderRadius: theme.borderRadius.md,
              background: theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
              cursor: "pointer",
              minWidth: 180,
            }}
          >
            <option value="all">All Clients</option>
            {clients.map(function(client) {
              return (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              );
            })}
          </select>
          
          {/* Date Range Toggle */}
          <DateRangeToggle value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Key Metrics - only show for "all clients" view */}
      {selectedClient === "all" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.primary, fontWeight: 600 }}>
                C
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalClients}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Clients</div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>{activeClients} active</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.infoBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.info, fontWeight: 600 }}>
                P
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{totalProjects}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Projects</div>
            <div style={{ fontSize: 12, color: theme.colors.info, marginTop: 4 }}>{inProgressProjects} in progress</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.success, fontWeight: 600 }}>
                %
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{completionRate}%</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Project Completion</div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>{completedProjects} completed</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.colors.warningBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.colors.warning, fontWeight: 600 }}>
                T
              </div>
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
          <div style={{ color: theme.colors.textSecondary }}>
            {selectedClient === "all" 
              ? "No metrics have been recorded yet."
              : "No metrics recorded for " + selectedClientName + "."
            }
          </div>
        </div>
      ) : (
        <>
          {/* Aggregated Metrics with Sparklines */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                  {selectedClient === "all" ? "Total Sessions (All Clients)" : "Total Sessions"}
                </div>
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
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>
                {selectedClient === "all" ? "Total Ad Spend Managed" : "Total Ad Spend"}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.primary }}>${totalSpend.toLocaleString()}</div>
            </div>
          </div>

          {/* Traffic Charts */}
          {sessionsData.length > 1 && (
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
          )}

          {/* Traffic Overview */}
          {sessionsData.length > 1 && (
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Traffic Overview</h3>
              <MultiLineChart datasets={trafficDatasets} height={220} />
            </div>
          )}

          {/* Ad Spend Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {spendData.length > 0 && spendData.some(function(d) { return d.value > 0; }) && (
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>Ad Spend by Month</h3>
                <BarChart data={spendData} color={theme.colors.primary} height={180} format="currency" />
              </div>
            )}
            {adSpendBreakdown.length > 0 && (
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px 0" }}>Ad Spend by Platform</h3>
                <DonutChart data={adSpendBreakdown} size={160} thickness={28} format="currency" />
              </div>
            )}
          </div>

          {/* Status Breakdowns - only show for "all clients" view */}
          {selectedClient === "all" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Clients by Status</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {clientsByStatus.map(function(item) {
                    var percentage = totalClients > 0 ? Math.round((item._count.status / totalClients) * 100) : 0;
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
                  <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
                    No projects yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects by Service Type - only show for "all clients" view */}
          {selectedClient === "all" && (
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Projects by Service Type</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {projectsByType.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>No projects yet</div>
                ) : (
                  projectsByType.map(function(item) {
                    var percentage = totalProjects > 0 ? Math.round((item._count.serviceType / totalProjects) * 100) : 0;
                    return (
                      <div key={item.serviceType}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>{item.serviceType.replace(/_/g, " ")}</span>
                          <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textSecondary }}>{item._count.serviceType} ({percentage}%)</span>
                        </div>
                        <div style={{ height: 8, background: theme.colors.bgTertiary, borderRadius: 4 }}>
                          <div style={{ height: "100%", width: percentage + "%", background: "linear-gradient(90deg, " + theme.colors.info + ", " + theme.colors.success + ")", borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
