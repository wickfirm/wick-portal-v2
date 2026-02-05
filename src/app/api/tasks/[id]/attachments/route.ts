import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Use Cloudflare R2 - NOT Amazon S3
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "omnixia-media";

// GET - Fetch attachments for a task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId: params.id },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
        mediaFile: {
          select: { id: true, thumbnailUrl: true, previewUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

// POST - Upload attachment to task
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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mediaFileId = formData.get("mediaFileId") as string | null;

    // Verify task exists
    const task = await prisma.clientTask.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If linking existing media file
    if (mediaFileId) {
      const mediaFile = await prisma.mediaFile.findUnique({
        where: { id: mediaFileId },
      });

      if (!mediaFile) {
        return NextResponse.json({ error: "Media file not found" }, { status: 404 });
      }

      const attachment = await prisma.taskAttachment.create({
        data: {
          taskId: params.id,
          mediaFileId: mediaFileId,
          filename: mediaFile.filename,
          originalName: mediaFile.originalName,
          mimeType: mediaFile.mimeType,
          size: mediaFile.size,
          r2Key: mediaFile.r2Key,
          uploadedBy: user.id,
        },
        include: {
          uploader: {
            select: { id: true, name: true, email: true },
          },
          mediaFile: {
            select: { id: true, thumbnailUrl: true, previewUrl: true },
          },
        },
      });

      // Log activity
      await prisma.taskModification.create({
        data: {
          taskId: params.id,
          modifiedBy: user.id,
          changeType: "attachment_added",
          newValue: mediaFile.originalName,
        },
      });

      return NextResponse.json(attachment, { status: 201 });
    }

    // Upload new file
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const r2Key = `task-attachments/${params.id}/${timestamp}-${safeName}`;

    // Upload to R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: r2Key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: params.id,
        filename: safeName,
        originalName: file.name,
        mimeType: file.type,
        size: BigInt(file.size),
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
        newValue: file.name,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

// DELETE - Remove attachment from task
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID required" }, { status: 400 });
    }

    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Only uploader or admins can delete
    if (attachment.uploadedBy !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Delete from R2 if it's not linked to a media file
    if (!attachment.mediaFileId) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: attachment.r2Key,
          })
        );
      } catch (r2Error) {
        console.error("Error deleting from R2:", r2Error);
      }
    }

    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });

    // Log activity
    await prisma.taskModification.create({
      data: {
        taskId: attachment.taskId,
        modifiedBy: user.id,
        changeType: "attachment_removed",
        oldValue: attachment.originalName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
