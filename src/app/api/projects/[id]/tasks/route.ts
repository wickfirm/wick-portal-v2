import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tasks = await prisma.clientTask.findMany({
      where: { projectId: params.id },
      include: {
        category: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        client: {
          select: {
            id: true,
            nickname: true,
            name: true,
            agencies: { include: { agency: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch project tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const user = session.user as any;

    // Get project to find clientId
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { clientId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const task = await prisma.clientTask.create({
      data: {
        name: data.name,
        clientId: project.clientId,
        projectId: params.id,
        categoryId: data.categoryId || null,
        status: data.status || "PENDING",
        priority: data.priority || "MEDIUM",
        ownerType: data.ownerType || "AGENCY",
        assigneeId: user.id, // Auto-assign to creator
        notes: data.notes || null,
        nextSteps: data.nextSteps || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        externalLink: data.externalLink || null,
        externalLinkLabel: data.externalLinkLabel || null,
        internalLink: data.internalLink || null,
        internalLinkLabel: data.internalLinkLabel || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        client: {
          select: {
            id: true,
            nickname: true,
            name: true,
            agencies: { include: { agency: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
