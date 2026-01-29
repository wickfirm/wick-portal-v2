// src/app/api/notes/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/notes/[id] - Get single note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            client: { select: { id: true, name: true } },
          },
        },
        reminders: {
          where: { isActive: true },
        },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions
    const canAccess =
      note.createdBy === session.user.id ||
      note.shares.some((share) => share.userId === session.user.id);

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

// PUT /api/notes/[id] - Update note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check permissions
    const existingNote = await prisma.note.findUnique({
      where: { id: params.id },
      include: {
        shares: {
          where: {
            userId: session.user.id,
            canEdit: true,
          },
        },
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const canEdit =
      existingNote.createdBy === session.user.id ||
      existingNote.shares.length > 0;

    if (!canEdit) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.clientId !== undefined) updateData.clientId = body.clientId || null;
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null;
    if (body.taskId !== undefined) updateData.taskId = body.taskId || null;

    const note = await prisma.note.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        attachments: true,
        shares: true,
        reminders: true,
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await prisma.note.findUnique({
      where: { id: params.id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only creator can delete
    if (note.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.note.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
