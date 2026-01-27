"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type ProjectProfitability = {
  project: {
    id: string;
    name: string;
    budget: number;
    client: {
      id: string;
      name: string;
      nickname: string | null;
    };
  };
  hours: {
    total: number;
  };
  costs: {
    labor: number;
    expenses: number;
    total: number;
  };
  revenue: {
    labor: number;
    expenses: number;
    total: number;
  };
  profit: {
    amount: number;
    margin: number;
  };
  budget: {
    allocated: number;
    used: number;
    utilization: number;
    remaining: number;
  };
};

export default function FinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [profitability, setProfitability] = useState<Record<string, ProjectProfitability>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status]);

  async function loadData() {
    setLoading(true);
    try {
      // Load all projects
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      // Load profitability for each project
      const profitabilityPromises = projectsData.map(async (project: any) => {
        const res = await fetch(`/api/finance/project-profitability/${project.id}`);
        const data = await res.json();
        return { projectId: project.id, data };
      });

      const profitabilityResults = await Promise.all(profitabilityPromises);
      const profitabilityMap: Record<string, ProjectProfitability> = {};
      profitabilityResults.forEach((result) => {
        profitabilityMap[result.projectId] = result.data;
      });

      setProfitability(profitabilityMap);
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
            Loading...
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  // Calculate totals
  const totals = Object.values(profitability).reduce(
    (acc, p) => ({
      revenue: acc.revenue + p.revenue.total,
      cost: acc.cost + p.costs.total,
      profit: acc.profit + p.profit.amount,
      hours: acc.hours + p.hours.total,
    }),
    { revenue: 0, cost: 0, profit: 0, hours: 0 }
  );

  const overallMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  // Sort projects by profitability
  const sortedProjects = [...projects].sort((a, b) => {
    const profitA = profitability[a.id]?.profit.amount || 0;
    const profitB = profitability[b.id]?.profit.amount || 0;
    return profitB - profitA;
  });

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Finance Dashboard
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Monitor profitability, costs, and budget utilization
          </p>
        </div>

        {/* Overview Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: 24, 
          marginBottom: 32 
        }}>
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
              Total Revenue
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: theme.colors.success }}>
              ${totals.revenue.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
              Total Costs
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: theme.colors.error }}>
              ${totals.cost.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
              Net Profit
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: totals.profit >= 0 ? theme.colors.success : theme.colors.error }}>
              ${totals.profit.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 24,
          }}>
            <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
              Profit Margin
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: overallMargin >= 20 ? theme.colors.success : theme.colors.warning }}>
              {overallMargin.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: theme.borderRadius.lg,
          overflow: "hidden",
        }}>
          <div style={{ padding: 24, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
              Project Profitability
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: theme.colors.bgTertiary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Project
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Client
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Hours
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Revenue
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Costs
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Profit
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Margin
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Budget Used
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((project) => {
                  const data = profitability[project.id];
                  if (!data) return null;

                  return (
                    <tr key={project.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>
                        {project.name}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.textSecondary }}>
                        {data.project.client.nickname || data.project.client.name}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.textSecondary, textAlign: "right" }}>
                        {data.hours.total.toFixed(1)}h
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.success, textAlign: "right", fontWeight: 500 }}>
                        ${data.revenue.total.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.error, textAlign: "right", fontWeight: 500 }}>
                        ${data.costs.total.toLocaleString()}
                      </td>
                      <td style={{ 
                        padding: "12px 16px", 
                        fontSize: 14, 
                        textAlign: "right", 
                        fontWeight: 600,
                        color: data.profit.amount >= 0 ? theme.colors.success : theme.colors.error 
                      }}>
                        ${data.profit.amount.toLocaleString()}
                      </td>
                      <td style={{ 
                        padding: "12px 16px", 
                        fontSize: 14, 
                        textAlign: "right",
                        color: data.profit.margin >= 20 ? theme.colors.success : data.profit.margin >= 10 ? theme.colors.warning : theme.colors.error
                      }}>
                        {data.profit.margin.toFixed(1)}%
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: theme.colors.textSecondary, textAlign: "right" }}>
                        {data.budget.utilization.toFixed(0)}%
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <Link
                          href={`/finance/projects/${project.id}`}
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            background: theme.colors.primary,
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
