import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";
import AdminAnalyticsDashboard from "@/components/AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [
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
  ] = await Promise.all([
    prisma.client.findMany({ 
      select: { id: true, name: true, nickname: true, status: true },
      orderBy: { name: "asc" }
    }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.clientTask.count(),
    prisma.clientTask.count({ where: { status: "COMPLETED" } }),
    prisma.client.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.project.groupBy({ by: ["serviceType"], _count: { serviceType: true } }),
    prisma.project.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.clientMetrics.findMany({ 
      orderBy: { month: "asc" },
      include: { client: { select: { id: true, name: true, nickname: true } } }
    }),
  ]);

  const serializedMetrics = allMetrics.map(function(m) {
    return { 
      ...m, 
      month: m.month.toISOString(),
      clientName: m.client.nickname || m.client.name,
    };
  });

  const serializedClients = clients.map(function(c) {
    return {
      id: c.id,
      name: c.nickname || c.name,
      status: c.status,
    };
  });

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <AdminAnalyticsDashboard
          clients={serializedClients}
          totalProjects={totalProjects}
          completedProjects={completedProjects}
          inProgressProjects={inProgressProjects}
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          clientsByStatus={clientsByStatus}
          projectsByType={projectsByType}
          projectsByStatus={projectsByStatus}
          allMetrics={serializedMetrics}
        />
      </main>
    </div>
  );
}
