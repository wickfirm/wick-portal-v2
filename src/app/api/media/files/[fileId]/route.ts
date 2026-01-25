// /src/app/api/media/files/[fileId]/route.ts
// Update file metadata, soft delete, restore

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { deleteFile as deleteFromR2 } from '@/lib/r2-client';

// PATCH - Update file metadata
export async function PATCH(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = params;
    const body = await request.json();
    const { description, tags } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
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

    // Check permissions
    if (file.agencyId !== user.agencyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update file
    const updated = await prisma.mediaFile.update({
      where: { id: fileId },
      data: {
        description: description !== undefined ? description : undefined,
        tags: tags || undefined,
      },
    });

    return NextResponse.json({
      file: {
        ...updated,
        size: updated.size.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to update file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete file
export async function DELETE(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
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

    // Check permissions
    if (file.agencyId !== user.agencyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (permanent) {
      // Only admins can permanently delete
      if (user.role === 'MEMBER') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      // Delete from R2
      await deleteFromR2(file.r2Key);

      // Delete from database
      await prisma.mediaFile.delete({
        where: { id: fileId },
      });

      // Log activity
      await prisma.mediaActivity.create({
        data: {
          action: 'DELETE',
          userId: user.id,
          folderId: file.folderId,
          agencyId: file.agencyId,
          metadata: {
            filename: file.originalName,
            permanent: true,
          },
        },
      });
    } else {
      // Soft delete
      await prisma.mediaFile.update({
        where: { id: fileId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      });

      // Log activity
      await prisma.mediaActivity.create({
        data: {
          action: 'DELETE',
          userId: user.id,
          fileId: file.id,
          folderId: file.folderId,
          agencyId: file.agencyId,
          metadata: {
            filename: file.originalName,
            permanent: false,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
