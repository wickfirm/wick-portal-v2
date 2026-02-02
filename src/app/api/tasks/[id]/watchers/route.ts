/**
 * Task Watchers API
 * GET: List watchers for a task + isWatching flag for current user
 * POST: Toggle watch/unwatch for current user
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  try {
    const watchers = await prisma.taskWatcher.findMany({
      where: { taskId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { watchedAt: "desc" },
    });

    const isWatching = watchers.some((w) => w.userId === user.id);

    return NextResponse.json({
      watchers: watchers.map((w) => ({
        id: w.id,
        userId: w.user.id,
        name: w.user.name,
        email: w.user.email,
        watchedAt: w.watchedAt,
      })),
      isWatching,
      count: watchers.length,
    });
  } catch (error) {
    console.error("Error fetching watchers:", error);
    return NextResponse.json({ error: "Failed to fetch watchers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  try {
    // Check if already watching
    const existing = await prisma.taskWatcher.findUnique({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId: params.id,
        },
      },
    });

    if (existing) {
      // Unwatch
      await prisma.taskWatcher.delete({ where: { id: existing.id } });
      return NextResponse.json({ watching: false });
    } else {
      // Watch
      await prisma.taskWatcher.create({
        data: {
          userId: user.id,
          taskId: params.id,
        },
      });
      return NextResponse.json({ watching: true });
    }
  } catch (error) {
    console.error("Error toggling watch:", error);
    return NextResponse.json({ error: "Failed to toggle watch" }, { status: 500 });
  }
}
