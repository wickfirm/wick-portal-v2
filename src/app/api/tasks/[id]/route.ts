"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tasks/[id] - Get a single task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const taskId = params.id;

    const task = await prisma.clientTask.findUnique({
      where: { id: taskId },
      include: {
        category: {
          select: { id: true, name: true },
        },
        client: {
          select: { id: true, name: true, nickname: true },
        },
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const taskId = params.id;
    const body = await request.json();

    // Verify task exists
    const existingTask = await prisma.clientTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    const allowedFields = [
      "name",
      "status",
      "priority",
      "dueDate",
      "internalNotes",
      "nextSteps",
      "externalLink",
      "externalLinkLabel",
      "internalLink",
      "internalLinkLabel",
      "ownerType",
      "pinned",
      "assigneeId",
      "categoryId",
      "projectId",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "dueDate") {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else if (field === "assigneeId" || field === "categoryId" || field === "projectId") {
          updateData[field] = body[field] || null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Track modifications for activity log
    const modifications: { field: string; oldValue: any; newValue: any }[] = [];
    for (const [key, value] of Object.entries(updateData)) {
      const oldValue = (existingTask as any)[key];
      if (oldValue !== value) {
        modifications.push({
          field: key,
          oldValue: oldValue?.toString() || null,
          newValue: value?.toString() || null,
        });
      }
    }

    // Update the task
    const updatedTask = await prisma.clientTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true },
        },
        client: {
          select: { id: true, name: true, nickname: true },
        },
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log modifications
    if (modifications.length > 0) {
      await prisma.taskModification.createMany({
        data: modifications.map((mod) => ({
          taskId,
          userId: user.id,
          fieldChanged: mod.field,
          oldValue: mod.oldValue,
          newValue: mod.newValue,
        })),
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
