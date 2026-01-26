import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where: any = { clientId: params.id };
  if (projectId) where.projectId = projectId;

  try {
    const tasks = await prisma.clientTask.findMany({
      where,
      include: { 
        category: true,
        assignee: { select: { name: true, email: true } },
        client: { 
          select: { 
            nickname: true, 
            name: true, 
            agencies: { include: { agency: true } } 
          } 
        },
      },
      orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
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

  try {
    const data = await req.json();
    
    // Get current user to auto-assign task
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { id: true },
    });

    const lastTask = await prisma.clientTask.findFirst({
      where: { clientId: params.id, categoryId: data.categoryId },
      orderBy: { order: "desc" },
    });

    const task = await prisma.clientTask.create({
      data: {
        name: data.name,
        clientId: params.id,
        projectId: data.projectId || null,
        categoryId: data.categoryId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority || "MEDIUM",
        status: data.status || "PENDING",
        notes: data.notes || null,
        nextSteps: data.nextSteps || null,
        externalLink: data.externalLink || null,
        externalLinkLabel: data.externalLinkLabel || null,
        internalLink: data.internalLink || null,
        internalLinkLabel: data.internalLinkLabel || null,
        ownerType: data.ownerType || "AGENCY",
        assigneeId: currentUser?.id || null, // Auto-assign to creator
        order: (lastTask?.order ?? 0) + 1,
      },
      include: { category: true, assignee: { select: { name: true, email: true } } },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
