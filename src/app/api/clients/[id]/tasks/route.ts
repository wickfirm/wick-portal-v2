import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = params.id;
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  try {
    const where: any = { clientId };
    if (projectId) {
      where.projectId = projectId;
    }

    const tasks = await prisma.clientTask.findMany({
      where,
      include: {
        category: true,
        assignee: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ category: { name: "asc" } }, { order: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = params.id;

  try {
    const data = await req.json();

    // Get max order for this client
    const maxOrder = await prisma.clientTask.findFirst({
      where: { clientId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const task = await prisma.clientTask.create({
      data: {
        clientId,
        name: data.name,
        categoryId: data.categoryId || null,
        assigneeId: data.assigneeId || null,
        projectId: data.projectId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority || "MEDIUM",
        status: data.status || "PENDING",
        notes: data.notes || null,
        order: (maxOrder?.order ?? -1) + 1,
        ownerType: data.ownerType || "AGENCY",
      },
      include: {
        category: true,
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
