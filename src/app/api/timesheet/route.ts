import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function getWeekDates(dateInWeek: Date) {
  const date = new Date(dateInWeek);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d);
  }
  
  return weekDates;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get("week");
    const userIdParam = searchParams.get("userId");

    const dbUser = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agencyId: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetDate = weekParam ? new Date(weekParam) : new Date();
    const weekDates = getWeekDates(targetDate);
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];

    const canViewOthers = ["SUPER_ADMIN", "ADMIN"].includes(dbUser.role);
    const viewUserId = canViewOthers && userIdParam ? userIdParam : dbUser.id;

    // Get team members if user can view others
    let teamMembers: any[] = [];
    if (canViewOthers && dbUser.agencyId) {
      teamMembers = await prisma.user.findMany({
        where: { 
          isActive: true, 
          role: { not: "CLIENT" },
          agencyId: dbUser.agencyId,
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
    }

    // Get view user details
    const viewUser = viewUserId === dbUser.id 
      ? dbUser 
      : await prisma.user.findUnique({
          where: { id: viewUserId },
          select: { id: true, name: true, email: true, role: true, agencyId: true },
        });

    // Fetch time entries for the week
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: viewUserId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      select: {
        id: true,
        date: true,
        duration: true, // Duration in seconds
        description: true,
        billable: true,
        source: true,
        createdAt: true,
        projectId: true,
        taskId: true,
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true,
                nickname: true,
              },
            },
          },
        },
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    // Fetch clients based on role
    let clientFilter: any = { status: { in: ["ACTIVE", "ONBOARDING"] } };
    
    if (dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN") {
      // ADMINs see all clients in their agency
      if (dbUser.agencyId) {
        const agencyTeamMembers = await prisma.user.findMany({
          where: { agencyId: dbUser.agencyId },
          select: { id: true },
        });
        const teamMemberIds = agencyTeamMembers.map(u => u.id);
        
        clientFilter.teamMembers = {
          some: {
            userId: { in: teamMemberIds }
          }
        };
      }
    } else if (dbUser.role === "MEMBER") {
      // MEMBERs see only their assigned clients
      const assignments = await prisma.clientTeamMember.findMany({
        where: { userId: dbUser.id },
        select: { clientId: true },
      });
      const clientIds = assignments.map(a => a.clientId);
      clientFilter.id = { in: clientIds };
    }

    const clients = await prisma.client.findMany({
      where: clientFilter,
      select: { id: true, name: true, nickname: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      timeEntries,
      clients,
      weekDates: weekDates.map(d => d.toISOString()),
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      viewUser,
      teamMembers,
      canViewOthers,
    });
  } catch (error) {
    console.error("Error fetching timesheet data:", error);
    return NextResponse.json(
      { error: "Failed to fetch timesheet data" },
      { status: 500 }
    );
  }
}
