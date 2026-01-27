import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/daily/tasks/[id]
// Update daily task (mark completed, defer, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  try {
    const dailyTask = await prisma.dailyTask.findUnique({
      where: { id: params.id },
    });

    if (!dailyTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Can only update own tasks unless admin
    if (dailyTask.userId !== userId && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const updateData: any = {};

    if (data.completed !== undefined) {
      updateData.completedAt = data.completed ? new Date() : null;
    }

    if (data.deferredTo !== undefined) {
      updateData.deferredTo = data.deferredTo ? new Date(data.deferredTo) : null;
    }

    const updated = await prisma.dailyTask.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update daily task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
