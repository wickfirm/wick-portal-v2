// /src/app/api/media/files/move/route.ts
// Move files between folders (bulk operation)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileIds, targetFolderId } = body;

    // Validate input
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'fileIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!targetFolderId) {
      return NextResponse.json(
        { error: 'targetFolderId is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json(
        { error: 'User not associated with an agency' },
        { status: 403 }
      );
    }

    // Get target folder and verify permissions
    const targetFolder = await prisma.mediaFolder.findUnique({
      where: { id: targetFolderId },
      include: {
        agency: true,
      },
    });

    if (!targetFolder) {
      return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
    }

    // Check permissions: user must belong to same agency
    if (targetFolder.agencyId !== user.agencyId) {
      return NextResponse.json(
        { error: 'Access denied to target folder' },
        { status: 403 }
      );
    }

    // Get all files to move
    const files = await prisma.mediaFile.findMany({
      where: {
        id: { in: fileIds },
        agencyId: user.agencyId, // Ensure user can only move files from their agency
        isDeleted: false, // Don't move deleted files
      },
    });

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No valid files found to move' },
        { status: 404 }
      );
    }

    // Check if any files are already in the target folder
    const alreadyInFolder = files.filter(f => f.folderId === targetFolderId);
    if (alreadyInFolder.length === files.length) {
      return NextResponse.json(
        { error: 'All files are already in the target folder' },
        { status: 400 }
      );
    }

    // Move files - update folderId and inherit client/project from target folder
    const movedFiles = await prisma.$transaction(
      files
        .filter(f => f.folderId !== targetFolderId)
        .map(file =>
          prisma.mediaFile.update({
            where: { id: file.id },
            data: {
              folderId: targetFolderId,
              clientId: targetFolder.clientId, // Inherit from target folder
            },
          })
        )
    );

    // Log activity for each moved file
    await prisma.mediaActivity.createMany({
      data: movedFiles.map(file => ({
        action: 'MOVE',
        userId: user.id,
        fileId: file.id,
        folderId: targetFolderId,
        agencyId: user.agencyId!, // Non-null assertion is safe here (checked above)
        metadata: {
          previousFolderId: files.find(f => f.id === file.id)?.folderId,
          targetFolderId,
        },
      })),
    });

    return NextResponse.json({
      success: true,
      movedCount: movedFiles.length,
      skippedCount: files.length - movedFiles.length,
      files: movedFiles.map(f => ({
        ...f,
        size: f.size.toString(),
      })),
    });
  } catch (error) {
    console.error('Failed to move files:', error);
    return NextResponse.json(
      { error: 'Failed to move files' },
      { status: 500 }
    );
  }
}
