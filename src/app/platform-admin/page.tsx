"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type DashboardStats = {
  totalAgencies: number;
  activeAgencies: number;
  totalUsers: number;
  activeUsers: number;
  recentSignups: Array<{
    email: string;
    name: string;
    agency: string;
    createdAt: string;
  }>;
  agencyBreakdown: Array<{
    agencyName: string;
    userCount: number;
    activeCount: number;
  }>;
};

export default function PlatformAdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUser = session?.user as any;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== "PLATFORM_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchStats();
  }, [currentUser, router]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/platform-admin/dashboard");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
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

  if (currentUser?.role !== "PLATFORM_ADMIN" || !stats) {
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
              📊
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
                Platform Overview
              </h1>
              <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
                Omnixia platform metrics and insights
              </p>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Total Tenants
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: theme.colors.primary }}>
              {stats.totalAgencies}
            </div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>
              {stats.activeAgencies} active
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Total Users
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: theme.colors.info }}>
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4 }}>
              {stats.activeUsers} active
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Avg Users/Tenant
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: theme.colors.warning }}>
              {Math.round(stats.totalUsers / stats.totalAgencies)}
            </div>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
              per tenant
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Recent Signups
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: theme.colors.success }}>
              {stats.recentSignups.length}
            </div>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
              last 7 days
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Recent Signups */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            padding: 24,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent Signups</h2>
            {stats.recentSignups.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
                No recent signups
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {stats.recentSignups.map((signup, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 16,
                      background: theme.colors.bgPrimary,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: theme.gradients.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 600,
                      }}>
                        {signup.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{signup.name}</div>
                        <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                          {signup.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                        {signup.agency}
                      </div>
                      <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                        {new Date(signup.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agency Breakdown */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            padding: 24,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Users by Tenant</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {stats.agencyBreakdown.map((agency, idx) => (
                <div key={idx}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {agency.agencyName}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.primary }}>
                      {agency.userCount}
                    </div>
                  </div>
                  <div style={{
                    height: 8,
                    background: theme.colors.bgTertiary,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(agency.userCount / stats.totalUsers) * 100}%`,
                      background: theme.gradients.primary,
                      borderRadius: 4,
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
                    {agency.activeCount} active • {Math.round((agency.userCount / stats.totalUsers) * 100)}% of total
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}>
          <Link
            href="/platform-admin/agencies"
            style={{
              background: theme.colors.bgSecondary,
              padding: 24,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: theme.colors.infoBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}>
              🏢
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary }}>
                Manage Tenants
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                View and edit tenants
              </div>
            </div>
          </Link>

          <Link
            href="/platform-admin/users"
            style={{
              background: theme.colors.bgSecondary,
              padding: 24,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: theme.colors.successBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary }}>
                View All Users
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                Browse all platform users
              </div>
            </div>
          </Link>

          <Link
            href="/platform-admin/analytics"
            style={{
              background: theme.colors.bgSecondary,
              padding: 24,
              borderRadius: 12,
              border: `1px solid ${theme.colors.borderLight}`,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: theme.colors.warningBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}>
              📈
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary }}>
                Analytics
              </div>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                Platform-wide metrics
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
