import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ClientDetailTabs from "./client-detail-tabs";

export const dynamic = "force-dynamic";

export default async function ClientViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  if (user.role !== "SUPER_ADMIN") {
    const hasAccess = await prisma.clientTeamMember.findFirst({
      where: { clientId: params.id, userId: user.id },
    });
    if (!hasAccess) {
      redirect("/clients");
    }
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      projects: { 
        include: { 
          stages: true,
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
        }, 
        orderBy: { createdAt: "desc" } 
      },
      onboardingItems: { orderBy: { order: "asc" } },
      resources: { orderBy: { order: "asc" } },
      agencies: {
        include: { agency: true }
      },
      teamMembers: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { assignedAt: "asc" },
      },
    },
  });

  if (!client) {
    return <div style={{ padding: 48, textAlign: "center" }}>Client not found</div>;
  }

  const onboardingForClient = client.onboardingItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    serviceType: item.serviceType,
    itemType: item.itemType || "CHECKBOX",
    order: item.order,
    isRequired: item.isRequired || false,
    isCompleted: item.isCompleted,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
    completedBy: item.completedBy,
    inputValue: item.inputValue,
    notes: item.notes,
    resourceUrl: item.resourceUrl,
    resourceLabel: item.resourceLabel,
  }));

  const resourcesForClient = client.resources.map(resource => ({
    id: resource.id,
    name: resource.name,
    url: resource.url,
    type: resource.type,
    order: resource.order,
  }));

  const teamForClient = client.teamMembers.map(tm => ({
    id: tm.id,
    userId: tm.userId,
    name: tm.user.name,
    email: tm.user.email,
    role: tm.user.role,
  }));

  const projectsForClient = client.projects.map(project => {
    const completed = project.stages.filter(s => s.isCompleted).length;
    const total = project.stages.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      serviceType: project.serviceType,
      startDate: project.startDate?.toISOString() || null,
      endDate: project.endDate?.toISOString() || null,
      budget: project.budget ? Number(project.budget) : null,
      completionPercentage: pct,
      totalTasks: project.tasks.length,
      completedTasks: project.tasks.filter(t => t.status === "COMPLETED").length,
    };
  });

  const canManageTeam = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canAddProjects = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canSeeBudget = user.role === "SUPER_ADMIN";

  return (
    <ClientDetailTabs
      client={{
        id: client.id,
        name: client.name,
        nickname: client.nickname,
        status: client.status,
        industry: client.industry,
        website: client.website,
        primaryContact: client.primaryContact,
        primaryEmail: client.primaryEmail,
        monthlyRetainer: client.monthlyRetainer ? Number(client.monthlyRetainer) : null,
        createdAt: client.createdAt.toISOString(),
        agencies: client.agencies.map(ca => ca.agency),
      }}
      onboarding={onboardingForClient}
      resources={resourcesForClient}
      team={teamForClient}
      projects={projectsForClient}
      userRole={user.role}
      canManageTeam={canManageTeam}
      canAddProjects={canAddProjects}
      canSeeBudget={canSeeBudget}
    />
  );
}
