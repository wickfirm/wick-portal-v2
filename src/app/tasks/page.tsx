import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getProjectFilterForUser } from "@/lib/project-assignments";
import Header from "@/components/Header";
import TasksList from "./tasks-list";
import { theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  const user = session.user as any;

  // Get current user details
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { 
      id: true, 
      role: true, 
      agencyId: true,
      name: true,
    },
  });

  if (!currentUser) redirect("/login");

  // Build task filter based on role  
  // Get accessible client IDs
  let clientIds: string[] = [];
  
  if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
    // Get all clients for agency
    const agencyClients = await prisma.client.findMany({
      where: {
        teamMembers: {
          some: {
            user: {
              agencyId: currentUser.agencyId
            }
          }
        }
      },
      select: { id: true }
    });
    clientIds = agencyClients.map(c => c.id);
  } else {
    // Get assigned clients for member
    const assignments = await prisma.clientTeamMember.findMany({
      where: { userId: currentUser.id },
      select: { clientId: true },
    });
    clientIds = assignments.map(a => a.clientId);
  }

  let taskFilter: any = {
    clientId: { in: clientIds }
  };

  // For MEMBERS, only show tasks assigned to them
  if (currentUser.role === "MEMBER") {
    taskFilter.assigneeId = currentUser.id;
  }

  // Fetch all tasks with minimal fields for list view
  const tasks = await prisma.clientTask.findMany({
    where: taskFilter,
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
      dueDate: true,
      projectId: true,
      client: {
        select: {
          id: true,
          name: true,
        }
      },
      assignee: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: [
      { status: "asc" },
      { priority: "desc" },
      { dueDate: "asc" },
    ],
  });

  // Get filter options
  const [clients, projects, teamMembers] = await Promise.all([
    // Get accessible clients
    prisma.client.findMany({
      where: {
        id: { in: clientIds }
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    // Get all projects for accessible clients  
    prisma.project.findMany({
      where: {
        clientId: { in: clientIds }
      },
      select: {
        id: true,
        name: true,
        clientId: true,
      },
      orderBy: { name: "asc" },
    }),
    // Get team members (only for ADMIN/SUPER_ADMIN)
    currentUser.role !== "MEMBER" 
      ? prisma.user.findMany({
          where: {
            agencyId: currentUser.agencyId,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
          orderBy: { name: "asc" },
        })
      : [],
  ]);

  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
    overdue: tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < today && 
      t.status !== "COMPLETED"
    ).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Tasks
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Manage and track all your tasks
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Total Tasks</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.info, marginBottom: 4 }}>
              {stats.inProgress}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>In Progress</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.success, marginBottom: 4 }}>
              {stats.completed}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Completed</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.error, marginBottom: 4 }}>
              {stats.overdue}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Overdue</div>
          </div>
        </div>

        {/* Tasks List Component */}
        <TasksList 
          initialTasks={tasks}
          clients={clients}
          projects={projects}
          teamMembers={teamMembers}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
        />
      </main>
    </div>
  );
}
