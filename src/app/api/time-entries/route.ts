import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List time entries with filters
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const weekOf = searchParams.get("weekOf"); // ISO date string for week start

    // Build where clause
    const where: any = {};

    // Role-based access control
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      // Can see all entries, optionally filter by user
      if (userId) {
        where.userId = userId;
      }
    } else {
      // Regular users can only see their own entries
      where.userId = user.id;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    // Date filtering
    if (weekOf) {
      // Get week start (Monday) and end (Sunday)
      const weekStart = new Date(weekOf);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      where.date = {
        gte: weekStart,
        lte: weekEnd,
      };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, nickname: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ timeEntries });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }
}

// POST - Create a manual time entry
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { clientId, projectId, taskId, date, duration, description, billable } = body;

    // Validate required fields
    if (!clientId || !projectId || !taskId || !date || duration === undefined) {
      return NextResponse.json(
        { error: "Client, project, task, date, and duration are required" },
        { status: 400 }
      );
    }

    // Verify the task belongs to the project and client
    const task = await prisma.clientTask.findFirst({
      where: {
        id: taskId,
        projectId: projectId,
        clientId: clientId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Invalid task, project, or client combination" },
        { status: 400 }
      );
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: user.id,
        clientId,
        projectId,
        taskId,
        date: new Date(date),
        duration: Math.round(duration), // Duration in seconds
        description: description || null,
        billable: billable !== false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, nickname: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}
