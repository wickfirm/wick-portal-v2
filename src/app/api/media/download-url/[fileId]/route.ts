// /src/app/api/media/download-url/[fileId]/route.ts
// Generate presigned download URL and log access

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateDownloadUrl } from '@/lib/r2-client';

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = params;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        agencyId: true,
        role: true,
      },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 403 });
    }

    // Get file
    const file = await prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if file is deleted
    if (file.isDeleted) {
      return NextResponse.json({ error: 'File has been deleted' }, { status: 410 });
    }

    // Check permissions
    if (file.agencyId !== user.agencyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check client-level permissions
    if (file.clientId && user.role === 'MEMBER') {
      const clientAssignment = await prisma.clientTeamMember.findFirst({
        where: {
          userId: user.id,
          clientId: file.clientId,
        },
      });

      if (!clientAssignment) {
        return NextResponse.json({ error: 'Access denied to this file' }, { status: 403 });
      }
    }

    // Generate download URL
    const downloadUrl = await generateDownloadUrl({
      key: file.r2Key,
      expiresIn: 3600, // 1 hour
      downloadFilename: file.originalName,
    });

    // Update file stats
    await prisma.mediaFile.update({
      where: { id: fileId },
      data: {
        downloadCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Log activity
    await prisma.mediaActivity.create({
      data: {
        action: 'DOWNLOAD',
        userId: user.id,
        fileId: file.id,
        folderId: file.folderId,
        agencyId: file.agencyId,
      },
    });

    return NextResponse.json({
      downloadUrl,
      filename: file.originalName,
      size: file.size.toString(),
      mimeType: file.mimeType,
    });
  } catch (error) {
    console.error('Failed to generate download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
