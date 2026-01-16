import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AgencyView from "./agency-view";

export const dynamic = "force-dynamic";

export default async function AgencyPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const currentUser = session.user as any;
  const dbUser = await prisma.user.findUnique({
    where: { email: currentUser.email },
  });

  if (!dbUser) redirect("/login");

  // Fetch agency with all related data
  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          clientAssignments: {
            include: {
              client: true,
            },
          },
          assignedTasks: {
            where: {
              status: {
                in: ["IN_PROGRESS", "TODO", "PENDING", "ONGOING"],
              },
            },
          },
          timeEntries: {
            where: {
              date: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          },
        },
      },
    },
  });

  if (!agency) {
    redirect("/agencies");
  }

  // Get all unique clients from agency members
  const clientsMap = new Map();
  agency.users.forEach(user => {
    user.clientAssignments.forEach(ca => {
      if (!clientsMap.has(ca.client.id)) {
        clientsMap.set(ca.client.id, {
          ...ca.client,
          memberCount: 0,
        });
      }
      clientsMap.get(ca.client.id).memberCount++;
    });
  });

  // Calculate stats
  const totalMembers = agency.users.length;
  const activeMembers = agency.users.filter(u => u.isActive).length;
  const totalActiveTasks = agency.users.reduce((sum, u) => sum + u.assignedTasks.length, 0);
  const totalMonthSeconds = agency.users.reduce(
    (sum, u) => sum + u.timeEntries.reduce((s, e) => s + e.duration, 0), 
    0
  );

  // Serialize data for client component
  const serializedAgency = {
    id: agency.id,
    name: agency.name,
    description: agency.description,
    createdAt: agency.createdAt.toISOString(),
    stats: {
      totalMembers,
      activeMembers,
      totalActiveTasks,
      totalMonthSeconds,
      totalClients: clientsMap.size,
    },
    users: agency.users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hourlyRate: user.hourlyRate ? Number(user.hourlyRate) : null,
      billRate: user.billRate ? Number(user.billRate) : null,
      activeTasks: user.assignedTasks.length,
      monthSeconds: user.timeEntries.reduce((s, e) => s + e.duration, 0),
      clients: user.clientAssignments.map(ca => ({
        id: ca.client.id,
        name: ca.client.name,
        nickname: ca.client.nickname,
      })),
    })),
    clients: Array.from(clientsMap.values()),
  };

  return <AgencyView agency={serializedAgency} />;
}
