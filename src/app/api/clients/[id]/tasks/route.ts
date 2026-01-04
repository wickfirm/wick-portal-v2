import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.clientTask.findMany({
    where: { clientId: params.id },
    include: { 
      category: true,
      assignee: { select: { id: true, name: true, email: true } }
    },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    const lastTask = await prisma.clientTask.findFirst({
      where: { clientId: params.id, categoryId: data.categoryId || null },
      orderBy: { order: "desc" },
    });

    const task = await prisma.clientTask.create({
      data: {
        name: data.name,
        clientId: params.id,
        categoryId: data.categoryId || null,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority || "MEDIUM",
        status: data.status || "TODO",
        notes: data.notes || null,
        nextSteps: data.nextSteps || null,
        order: (lastTask?.order ?? 0) + 1,
      },
      include: { 
        category: true,
        assignee: { select: { id: true, name: true, email: true } }
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task", details: String(error) }, { status: 500 });
  }
}
