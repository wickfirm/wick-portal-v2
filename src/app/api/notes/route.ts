// src/app/api/notes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/notes - List notes with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const tag = searchParams.get("tag");
    const color = searchParams.get("color");
    const archived = searchParams.get("archived") === "true";
    const pinned = searchParams.get("pinned") === "true";
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      archivedAt: archived ? { not: null } : null,
    };

    // User can see: own notes + notes shared with them
    where.OR = [
      { createdBy: session.user.id },
      {
        shares: {
          some: {
            userId: session.user.id,
          },
        },
      },
    ];

    if (pinned) where.isPinned = true;
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;
    if (taskId) where.taskId = taskId;
    if (color) where.color = color;
    if (tag) where.tags = { has: tag };
    
    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            type: true,
            duration: true,
            thumbnail: true,
          },
        },
        shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            client: {
              select: { id: true, name: true },
            },
          },
        },
        reminders: {
          where: { isActive: true },
          orderBy: { remindAt: "asc" },
        },
        client: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
    });

    // Convert BigInt to Number for JSON serialization
    const serializedNotes = notes.map(note => ({
      ...note,
      attachments: note.attachments.map(att => ({
        ...att,
        size: Number(att.size),
      })),
    }));

    return NextResponse.json({ notes: serializedNotes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST /api/notes - Create note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      color,
      isPinned,
      clientId,
      projectId,
      taskId,
      tags,
    } = body;

    // Get user's agency
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { agencyId: true },
    });

    const note = await prisma.note.create({
      data: {
        title: title || null,
        content: content || "",
        color: color || "yellow",
        isPinned: isPinned || false,
        createdBy: session.user.id,
        agencyId: user?.agencyId,
        clientId: clientId || null,
        projectId: projectId || null,
        taskId: taskId || null,
        tags: tags || [],
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        shares: true,
        reminders: true,
      },
    });

    // Convert BigInt to Number for JSON serialization
    const serializedNote = {
      ...note,
      attachments: note.attachments.map(att => ({
        ...att,
        size: Number(att.size),
      })),
    };

    return NextResponse.json({ note: serializedNote });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
