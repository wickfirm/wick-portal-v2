import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const clientId = searchParams.get("clientId");

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (clientId) where.clientId = clientId;

  const tasks = await prisma.clientTask.findMany({
    where,
    include: { category: true, client: true },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    if (!data.clientId || !data.name) {
      return NextResponse.json({ error: "clientId and name are required" }, { status: 400 });
    }

    if (!data.projectId) {
      return NextResponse.json({ error: "projectId is required. All tasks must belong to a project." }, { status: 400 });
    }

    // Get current user to auto-assign task
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { id: true },
    });

    const lastTask = await prisma.clientTask.findFirst({
      where: { clientId: data.clientId, categoryId: data.categoryId },
      orderBy: { order: "desc" },
    });

    const task = await prisma.clientTask.create({
      data: {
        name: data.name,
        clientId: data.clientId,
        projectId: data.projectId,
        categoryId: data.categoryId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority || "MEDIUM",
        status: data.status || "TODO",
        internalNotes: data.notes || null,
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
