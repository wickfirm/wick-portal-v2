import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get current active timer for logged-in user
export async function GET() {
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

    const activeTimer = await prisma.activeTimer.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!activeTimer) {
      return NextResponse.json({ timer: null });
    }

    // Fetch related data separately
    const [client, project, task] = await Promise.all([
      prisma.client.findUnique({
        where: { id: activeTimer.clientId },
        select: { id: true, name: true, nickname: true },
      }),
      prisma.project.findUnique({
        where: { id: activeTimer.projectId },
        select: { id: true, name: true },
      }),
      prisma.clientTask.findUnique({
        where: { id: activeTimer.taskId },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({
      timer: {
        ...activeTimer,
        client,
        project,
        task,
      },
    });
  } catch (error) {
    console.error("Error fetching timer:", error);
    return NextResponse.json({ error: "Failed to fetch timer" }, { status: 500 });
  }
}

// POST - Start a new timer
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

    // Check if user already has an active timer
    const existingTimer = await prisma.activeTimer.findUnique({
      where: { userId: user.id },
    });

    if (existingTimer) {
      return NextResponse.json(
        { error: "You already have an active timer. Stop it first." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { clientId, projectId, taskId, description } = body;

    // Validate required fields
    if (!clientId || !projectId || !taskId) {
      return NextResponse.json(
        { error: "Client, project, and task are required" },
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

    const newTimer = await prisma.activeTimer.create({
      data: {
        userId: user.id,
        clientId,
        projectId,
        taskId,
        description: description || null,
        startedAt: new Date(),
      },
    });

    // Fetch related data for response
    const [client, project, taskData] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true, nickname: true },
      }),
      prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true },
      }),
      prisma.clientTask.findUnique({
        where: { id: taskId },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({
      timer: {
        ...newTimer,
        client,
        project,
        task: taskData,
      },
    });
  } catch (error) {
    console.error("Error starting timer:", error);
    return NextResponse.json({ error: "Failed to start timer" }, { status: 500 });
  }
}

// DELETE - Stop current timer and create time entry
export async function DELETE(request: Request) {
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

    const activeTimer = await prisma.activeTimer.findUnique({
      where: { userId: user.id },
    });

    if (!activeTimer) {
      return NextResponse.json({ error: "No active timer found" }, { status: 404 });
    }

    // Calculate duration in seconds
    const now = new Date();
    const duration = Math.floor((now.getTime() - activeTimer.startedAt.getTime()) / 1000);

    // Get optional description from request body
    let description = activeTimer.description;
    try {
      const body = await request.json();
      if (body.description !== undefined) {
        description = body.description;
      }
    } catch {
      // No body provided, use existing description
    }

    // Create time entry and delete active timer in a transaction
    const [timeEntry] = await prisma.$transaction([
      prisma.timeEntry.create({
        data: {
          userId: user.id,
          clientId: activeTimer.clientId,
          projectId: activeTimer.projectId,
          taskId: activeTimer.taskId,
          date: activeTimer.startedAt,
          duration,
          description,
          billable: true,
        },
        include: {
          client: { select: { id: true, name: true, nickname: true } },
          project: { select: { id: true, name: true } },
          task: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.activeTimer.delete({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Error stopping timer:", error);
    return NextResponse.json({ error: "Failed to stop timer" }, { status: 500 });
  }
}
