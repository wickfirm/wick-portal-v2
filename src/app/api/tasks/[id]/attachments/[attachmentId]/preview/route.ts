import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateStreamUrl } from "@/lib/r2-client";

// GET - Redirect to presigned URL for attachment preview
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: params.attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Generate presigned stream URL for inline viewing
    const streamUrl = await generateStreamUrl({
      key: attachment.r2Key,
      expiresIn: 3600, // 1 hour
    });

    // Redirect to the presigned URL
    return NextResponse.redirect(streamUrl);
  } catch (error) {
    console.error("Error getting attachment preview:", error);
    return NextResponse.json(
      { error: "Failed to get attachment preview" },
      { status: 500 }
    );
  }
}
