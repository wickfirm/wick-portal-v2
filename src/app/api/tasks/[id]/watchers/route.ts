"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tasks/[id]/watchers - Get watchers for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    const watchers = await prisma.taskWatcher.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(watchers);
  } catch (error) {
    console.error("Error fetching watchers:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchers" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/watchers - Add current user as watcher
export async function POST(
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

    // Check if already watching
    const existing = await prisma.taskWatcher.findFirst({
      where: {
        taskId,
        userId: user.id,
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already watching" });
    }

    // Add watcher
    const watcher = await prisma.taskWatcher.create({
      data: {
        taskId,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(watcher, { status: 201 });
  } catch (error) {
    console.error("Error adding watcher:", error);
    return NextResponse.json(
      { error: "Failed to add watcher" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/watchers - Remove current user as watcher
export async function DELETE(
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

    await prisma.taskWatcher.deleteMany({
      where: {
        taskId,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Stopped watching" });
  } catch (error) {
    console.error("Error removing watcher:", error);
    return NextResponse.json(
      { error: "Failed to remove watcher" },
      { status: 500 }
    );
  }
}
