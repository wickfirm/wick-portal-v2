// src/app/api/notes/[id]/attachments/[attachmentId]/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateDownloadUrl } from "@/lib/r2-client";

// GET /api/notes/[id]/attachments/[attachmentId]/download - Get download URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get attachment
    const attachment = await prisma.noteAttachment.findUnique({
      where: { id: params.attachmentId },
      include: {
        note: true,
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Check access
    const note = attachment.note;
    const hasAccess =
      note.createdBy === session.user.id ||
      (await prisma.noteShare.findFirst({
        where: {
          noteId: note.id,
          userId: session.user.id,
        },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate download URL
    const downloadUrl = await generateDownloadUrl({
      key: attachment.r2Key,
      expiresIn: 3600,
      downloadFilename: attachment.originalName,
    });

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
