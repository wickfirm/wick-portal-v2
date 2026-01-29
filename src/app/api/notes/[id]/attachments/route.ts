// src/app/api/notes/[id]/attachments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateUploadUrl, generateR2Key } from "@/lib/r2-client";

const ALLOWED_TYPES = [
  // Images
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  // Audio
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/m4a",
  // Video
  "video/mp4", "video/quicktime", "video/webm",
  // Documents
  "application/pdf", "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

// POST /api/notes/[id]/attachments - Generate upload URL
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filename, contentType, size } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `File type ${contentType} not allowed` },
        { status: 400 }
      );
    }

    if (size && size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_SIZE} bytes)` },
        { status: 400 }
      );
    }

    // Check note exists and user has access
    const note = await prisma.note.findUnique({
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

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const canEdit =
      note.createdBy === session.user.id || note.shares.length > 0;

    if (!canEdit) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user agency
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { agency: true },
    });

    if (!user?.agency) {
      return NextResponse.json({ error: "No agency found" }, { status: 400 });
    }

    // Generate unique ID
    const fileId = `attach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate R2 key
    const r2Key = generateR2Key({
      agencySlug: user.agency.slug,
      folderId: `notes/${params.id}`,
      filename,
      uuid: fileId,
    });

    // Generate upload URL
    const uploadUrl = await generateUploadUrl({
      key: r2Key,
      contentType,
      expiresIn: 3600,
    });

    // Determine attachment type
    let type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "OTHER" = "OTHER";
    if (contentType.startsWith("image/")) type = "IMAGE";
    else if (contentType.startsWith("audio/")) type = "AUDIO";
    else if (contentType.startsWith("video/")) type = "VIDEO";
    else if (contentType.includes("pdf") || contentType.includes("document"))
      type = "DOCUMENT";

    // Create attachment record
    const attachment = await prisma.noteAttachment.create({
      data: {
        id: fileId,
        noteId: params.id,
        filename,
        originalName: filename,
        mimeType: contentType,
        size: BigInt(size || 0),
        r2Key,
        r2Bucket: process.env.R2_BUCKET_NAME || "omnixia-media",
        type,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json({
      uploadUrl,
      attachmentId: attachment.id,
      r2Key,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

// GET /api/notes/[id]/attachments - List attachments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attachments = await prisma.noteAttachment.findMany({
      where: { noteId: params.id },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}
