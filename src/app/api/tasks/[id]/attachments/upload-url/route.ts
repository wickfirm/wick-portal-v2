import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateUploadUrl } from "@/lib/r2-client";

// Helper to get correct MIME type from file extension
function getMimeTypeFromExtension(filename: string): string | null {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    '3gp': 'video/3gpp',
    'm4v': 'video/x-m4v',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'zip': 'application/zip',
  };
  return ext ? mimeTypes[ext] || null : null;
}

// POST - Generate presigned URL for direct browser-to-R2 upload
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as any;
    const { filename, size, contentType } = await req.json();

    if (!filename) {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await prisma.clientTask.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Determine correct MIME type - prefer extension-based for videos
    const extensionMimeType = getMimeTypeFromExtension(filename);
    const isVideoByExtension = extensionMimeType?.startsWith('video/');
    const mimeType = isVideoByExtension
      ? extensionMimeType
      : (contentType || extensionMimeType || 'application/octet-stream');

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const r2Key = `task-attachments/${params.id}/${timestamp}-${safeName}`;

    // Generate presigned upload URL
    const uploadUrl = await generateUploadUrl({
      key: r2Key,
      contentType: mimeType,
      expiresIn: 3600, // 1 hour
    });

    // Create the attachment record in the database
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: params.id,
        filename: safeName,
        originalName: filename,
        mimeType: mimeType,
        size: BigInt(size || 0),
        r2Key: r2Key,
        uploadedBy: user.id,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await prisma.taskModification.create({
      data: {
        taskId: params.id,
        modifiedBy: user.id,
        changeType: "attachment_added",
        newValue: filename,
      },
    });

    return NextResponse.json({
      uploadUrl,
      attachmentId: attachment.id,
      r2Key,
      mimeType,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
