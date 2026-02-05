import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateDownloadUrl } from "@/lib/r2-client";

// GET - Get download URL for a comment attachment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const attachment = await prisma.taskCommentAttachment.findUnique({
      where: { id: params.attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Generate presigned download URL
    const downloadUrl = await generateDownloadUrl({
      key: attachment.r2Key,
      expiresIn: 3600, // 1 hour
      downloadFilename: attachment.originalName,
    });

    return NextResponse.json({
      downloadUrl,
      filename: attachment.originalName,
      size: Number(attachment.size),
      mimeType: attachment.mimeType,
    });
  } catch (error) {
    console.error("Error getting attachment URL:", error);
    return NextResponse.json(
      { error: "Failed to get attachment URL" },
      { status: 500 }
    );
  }
}
