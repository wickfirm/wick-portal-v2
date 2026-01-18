"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type AnalyticsData = {
  userGrowth: Array<{
    date: string;
    count: number;
    agency: string;
  }>;
  agencyStats: Array<{
    agencyName: string;
    totalUsers: number;
    activeUsers: number;
    totalClients: number;
    totalProjects: number;
  }>;
};

export default function PlatformAdminAnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUser = session?.user as any;

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== "PLATFORM_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchAnalytics();
  }, [currentUser, router]);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/platform-admin/analytics");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>
          Loading...
        </div>
      </div>
    );
  }

  if (currentUser?.role !== "PLATFORM_ADMIN" || !analytics) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}>
              📈
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
                Platform Analytics
              </h1>
              <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
                Cross-tenant metrics and insights
              </p>
            </div>
          </div>
        </div>

        {/* Agency Performance */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Tenant Performance</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.colors.borderLight}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Tenant
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Total Users
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Active Users
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Clients
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Projects
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Activity Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.agencyStats.map((agency, idx) => {
                  const activityRate = agency.totalUsers > 0 
                    ? Math.round((agency.activeUsers / agency.totalUsers) * 100)
                    : 0;
                  
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                      <td style={{ padding: "16px", fontSize: 14, fontWeight: 500 }}>
                        {agency.agencyName}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontSize: 14 }}>
                        {agency.totalUsers}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontSize: 14, color: theme.colors.success }}>
                        {agency.activeUsers}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontSize: 14 }}>
                        {agency.totalClients}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontSize: 14 }}>
                        {agency.totalProjects}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                          <div style={{
                            width: 60,
                            height: 8,
                            background: theme.colors.bgTertiary,
                            borderRadius: 4,
                            overflow: "hidden",
                          }}>
                            <div style={{
                              width: `${activityRate}%`,
                              height: "100%",
                              background: activityRate > 70 ? theme.colors.success :
                                activityRate > 40 ? theme.colors.warning :
                                theme.colors.error,
                              borderRadius: 4,
                            }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>
                            {activityRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Growth */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Recent User Growth</h2>
          {analytics.userGrowth.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
              No recent user activity
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {analytics.userGrowth.slice(0, 10).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    background: theme.colors.bgPrimary,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: theme.colors.success,
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {item.agency}
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 12px",
                    background: theme.colors.successBg,
                    color: theme.colors.success,
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    +{item.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
