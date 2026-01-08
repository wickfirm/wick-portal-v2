import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Get a single time entry
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, nickname: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    if (!timeEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    // Check access - users can only see their own entries unless admin
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && timeEntry.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Error fetching time entry:", error);
    return NextResponse.json({ error: "Failed to fetch time entry" }, { status: 500 });
  }
}

// PUT - Update a time entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    // Check access - users can only edit their own entries unless admin
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && existingEntry.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, projectId, taskId, date, duration, description, billable } = body;

    // If changing task, verify it belongs to the client
    if (taskId && taskId !== existingEntry.taskId) {
      const task = await prisma.clientTask.findFirst({
        where: {
          id: taskId,
          clientId: clientId || existingEntry.clientId,
        },
      });

      if (!task) {
        return NextResponse.json(
          { error: "Invalid task or client combination" },
          { status: 400 }
        );
      }
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        ...(clientId && { clientId }),
        ...(projectId && { projectId }),
        ...(taskId && { taskId }),
        ...(date && { date: new Date(date) }),
        ...(duration !== undefined && { duration: Math.round(duration) }),
        ...(description !== undefined && { description }),
        ...(billable !== undefined && { billable }),
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
    console.error("Error updating time entry:", error);
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 500 });
  }
}

// DELETE - Delete a time entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    // Check access - users can only delete their own entries unless admin
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && existingEntry.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.timeEntry.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json({ error: "Failed to delete time entry" }, { status: 500 });
  }
}
