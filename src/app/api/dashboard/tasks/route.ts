import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getProjectFilterForUser } from "@/lib/project-assignments";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, role: true, id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get PROJECT filter
    const projectFilter = await getProjectFilterForUser(
      currentUser.id,
      currentUser.role,
      currentUser.agencyId
    );

    // Get accessible client IDs for tasks
    let clientIds: string[] = [];
    
    if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
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
      const assignments = await prisma.clientTeamMember.findMany({
        where: { userId: currentUser.id },
        select: { clientId: true },
      });
      clientIds = assignments.map(a => a.clientId);
    }

    // Fetch tasks
    const allTasks = await prisma.clientTask.findMany({
      where: { 
        status: { not: "COMPLETED" },
        clientId: { in: clientIds }
      },
      select: {
        id: true,
        name: true,
        dueDate: true,
        priority: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Categorize tasks
    const overdueTasks = allTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < today
    );
    
    const dueTodayTasks = allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) >= today && 
      new Date(task.dueDate) < tomorrow
    );

    const taskSummary = {
      total: allTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
    };

    return NextResponse.json({
      overdueTasks: overdueTasks.slice(0, 5),
      dueTodayTasks: dueTodayTasks.slice(0, 5),
      taskSummary,
    });
  } catch (error) {
    console.error("[DASHBOARD TASKS ERROR]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
