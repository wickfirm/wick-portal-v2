import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST - Bulk delete time entries
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { entryIds } = body;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { error: "entryIds must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(user.role || "");

    // Verify all entries exist and belong to the requesting user (unless admin)
    if (!isAdmin) {
      const entries = await prisma.timeEntry.findMany({
        where: { id: { in: entryIds } },
        select: { id: true, userId: true },
      });

      if (entries.length !== entryIds.length) {
        return NextResponse.json(
          { error: "One or more time entries not found" },
          { status: 404 }
        );
      }

      const unauthorized = entries.filter((entry) => entry.userId !== user.id);
      if (unauthorized.length > 0) {
        return NextResponse.json(
          { error: "Access denied: you can only delete your own time entries" },
          { status: 403 }
        );
      }
    }

    // Delete all entries in a transaction
    const result = await prisma.$transaction(
      entryIds.map((id: string) =>
        prisma.timeEntry.delete({ where: { id } })
      )
    );

    return NextResponse.json({ deleted: result.length });
  } catch (error) {
    console.error("Error bulk deleting time entries:", error);
    return NextResponse.json(
      { error: "Failed to bulk delete time entries" },
      { status: 500 }
    );
  }
}

// PUT - Bulk update time entries
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "entries must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each entry has an id and at least one field to update
    for (const entry of entries) {
      if (!entry.id) {
        return NextResponse.json(
          { error: "Each entry must have an id" },
          { status: 400 }
        );
      }
      if (entry.duration === undefined && entry.description === undefined) {
        return NextResponse.json(
          { error: "Each entry must have at least one field to update (duration or description)" },
          { status: 400 }
        );
      }
    }

    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(user.role || "");
    const entryIds = entries.map((e: { id: string }) => e.id);

    // Verify all entries exist and belong to the requesting user (unless admin)
    if (!isAdmin) {
      const existingEntries = await prisma.timeEntry.findMany({
        where: { id: { in: entryIds } },
        select: { id: true, userId: true },
      });

      if (existingEntries.length !== entryIds.length) {
        return NextResponse.json(
          { error: "One or more time entries not found" },
          { status: 404 }
        );
      }

      const unauthorized = existingEntries.filter((entry) => entry.userId !== user.id);
      if (unauthorized.length > 0) {
        return NextResponse.json(
          { error: "Access denied: you can only update your own time entries" },
          { status: 403 }
        );
      }
    }

    // Update all entries in a transaction
    const result = await prisma.$transaction(
      entries.map((entry: { id: string; duration?: number; description?: string }) =>
        prisma.timeEntry.update({
          where: { id: entry.id },
          data: {
            ...(entry.duration !== undefined && { duration: Math.round(entry.duration) }),
            ...(entry.description !== undefined && { description: entry.description }),
          },
        })
      )
    );

    return NextResponse.json({ updated: result.length });
  } catch (error) {
    console.error("Error bulk updating time entries:", error);
    return NextResponse.json(
      { error: "Failed to bulk update time entries" },
      { status: 500 }
    );
  }
}
