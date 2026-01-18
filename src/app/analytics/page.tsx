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

  // Get current user's agency for filtering
  const user = session.user as any;
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, agencyId: true, role: true },
  });

  if (!currentUser) redirect("/login");

  // Build client filter based on agency
  let clientFilter: any = {};
  
  if (currentUser.agencyId === null) {
    // External partners: only see clients they're assigned to
    clientFilter = {
      teamMembers: {
        some: { userId: currentUser.id }
      }
    };
  } else if (currentUser.role === "SUPER_ADMIN") {
    // SUPER_ADMIN: see all clients where their agency's team members are assigned
    const agencyUsers = await prisma.user.findMany({
      where: { agencyId: currentUser.agencyId },
      select: { id: true },
    });
    clientFilter = {
      teamMembers: {
        some: {
          userId: { in: agencyUsers.map(u => u.id) }
        }
      }
    };
  } else {
    // Regular users: only see clients they're assigned to
    clientFilter = {
      teamMembers: {
        some: { userId: currentUser.id }
      }
    };
  }

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
      where: clientFilter, // Apply agency filter
      select: { id: true, name: true, nickname: true, status: true },
      orderBy: { name: "asc" }
    }),
    prisma.project.count({
      where: {
        client: clientFilter
      }
    }),
    prisma.project.count({ 
      where: { 
        status: "COMPLETED",
        client: clientFilter
      } 
    }),
    prisma.project.count({ 
      where: { 
        status: "IN_PROGRESS",
        client: clientFilter
      } 
    }),
    prisma.clientTask.count({
      where: {
        client: clientFilter
      }
    }),
    prisma.clientTask.count({ 
      where: { 
        status: "COMPLETED",
        client: clientFilter
      } 
    }),
    prisma.client.groupBy({ 
      by: ["status"], 
      _count: { status: true },
      where: clientFilter
    }),
    prisma.project.groupBy({ 
      by: ["serviceType"], 
      _count: { serviceType: true },
      where: {
        client: clientFilter
      }
    }),
    prisma.project.groupBy({ 
      by: ["status"], 
      _count: { status: true },
      where: {
        client: clientFilter
      }
    }),
    prisma.clientMetrics.findMany({ 
      where: {
        client: clientFilter
      },
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
