import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import TeamMemberView from "./team-member-view";

export const dynamic = "force-dynamic";

export default async function TeamMemberPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const currentUser = session.user as any;
  const dbUser = await prisma.user.findUnique({
    where: { email: currentUser.email },
  });

  if (!dbUser) redirect("/login");

  // Fetch team member with all related data
  const member = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      agency: true,
      clientAssignments: {
        include: {
          client: true,
        },
      },
      projectAssignments: {
        include: {
          project: {
            include: {
              client: {
                select: { id: true, name: true, nickname: true }
              }
            }
          }
        }
      },
      assignedTasks: {
        include: {
          client: true,
          project: true,
        },
        orderBy: { createdAt: "desc" },
      },
      timeEntries: {
        include: {
          client: true,
          project: true,
          task: true,
        },
        orderBy: { date: "desc" },
        take: 50,
      },
    },
  });

  if (!member) {
    redirect("/team");
  }

  // Serialize data for client component
  const serializedMember = {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    hourlyRate: member.hourlyRate ? Number(member.hourlyRate) : null,
    billRate: member.billRate ? Number(member.billRate) : null,
    agency: member.agency,
    clientAssignments: member.clientAssignments.map(ca => ({
      id: ca.id,
      client: {
        id: ca.client.id,
        name: ca.client.name,
        nickname: ca.client.nickname,
      },
    })),
    assignedTasks: member.assignedTasks.map(task => ({
      id: task.id,
      name: task.name,
      status: task.status,
      priority: task.priority,
      client: {
        id: task.client.id,
        name: task.client.name,
        nickname: task.client.nickname,
      },
      project: task.project ? {
        id: task.project.id,
        name: task.project.name,
        serviceType: task.project.serviceType,
        clientId: task.project.clientId,
      } : null,
    })),
    timeEntries: member.timeEntries.map(entry => ({
      id: entry.id,
      date: entry.date.toISOString(),
      duration: entry.duration,
      client: {
        id: entry.client.id,
        name: entry.client.name,
        nickname: entry.client.nickname,
      },
      project: {
        id: entry.project.id,
        name: entry.project.name,
      },
      task: {
        id: entry.task.id,
        name: entry.task.name,
      },
    })),
    projectAssignments: member.projectAssignments.map(pa => ({
      id: pa.id,
      project: {
        id: pa.project.id,
        name: pa.project.name,
        serviceType: pa.project.serviceType,
        client: pa.project.client,
      }
    })),
  };

  return <TeamMemberView member={serializedMember} currentUserRole={dbUser.role} canEdit={["ADMIN", "SUPER_ADMIN"].includes(dbUser.role)} />;
}
