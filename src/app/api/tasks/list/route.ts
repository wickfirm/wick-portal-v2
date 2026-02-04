import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
        categoryId: true,
        internalNotes: true,
        nextSteps: true,
        ownerType: true,
        externalLink: true,
        externalLinkLabel: true,
        internalLink: true,
        internalLinkLabel: true,
        assigneeId: true,
        order: true,
        pinned: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        },
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
        { pinned: "desc" },
        { createdAt: "desc" },
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

    return NextResponse.json({
      tasks,
      clients,
      projects,
      teamMembers,
      stats,
      currentUser: {
        id: currentUser.id,
        role: currentUser.role,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
