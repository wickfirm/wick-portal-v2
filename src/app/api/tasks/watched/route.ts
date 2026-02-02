/**
 * My Watched Tasks API
 * GET: Returns all task IDs the current user is watching
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  try {
    const watched = await prisma.taskWatcher.findMany({
      where: { userId: user.id },
      select: { taskId: true },
    });

    return NextResponse.json({
      taskIds: watched.map((w) => w.taskId),
    });
  } catch (error) {
    console.error("Error fetching watched tasks:", error);
    return NextResponse.json({ error: "Failed to fetch watched tasks" }, { status: 500 });
  }
}
