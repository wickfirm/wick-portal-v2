// /src/app/api/media/folders/[folderId]/route.ts
// Get folder contents, update, delete folder

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Get folder with files and subfolders
export async function GET(
  request: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderId } = params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 403 });
    }

    // Get folder
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
      include: {
        client: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check permissions
    if (folder.agencyId !== user.agencyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (folder.clientId && user.role === 'MEMBER') {
      const hasAccess = await prisma.clientTeamMember.findFirst({
        where: { userId: user.id, clientId: folder.clientId },
      });
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get subfolders
    const subfolders = await prisma.mediaFolder.findMany({
      where: { parentId: folderId },
      include: {
        _count: {
          select: { files: true, subfolders: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get files
    const files = await prisma.mediaFile.findMany({
      where: {
        folderId,
        isDeleted: false,
      },
      include: {
        uploader: {
          select: { id: true, name: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({
      folder,
      subfolders,
      files: files.map(f => ({
        ...f,
        size: f.size.toString(), // Convert BigInt to string for JSON
      })),
    });
  } catch (error) {
    console.error('Failed to fetch folder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 }
    );
  }
}

// PATCH - Update folder
export async function PATCH(
  request: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderId } = params;
    const body = await request.json();
    const { name, description } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 403 });
    }

    // Get folder
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check permissions
    if (folder.agencyId !== user.agencyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only admins can rename folders
    if (user.role === 'MEMBER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update folder
    const updated = await prisma.mediaFolder.update({
      where: { id: folderId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json({ folder: updated });
  } catch (error) {
    console.error('Failed to update folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

// DELETE - Delete folder (must be empty)
export async function DELETE(
  request: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderId } = params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 403 });
    }

    // Get folder with counts
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: { files: true, subfolders: true },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check permissions
    if (folder.agencyId !== user.agencyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only admins can delete folders
    if (user.role === 'MEMBER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if folder is empty
    if (folder._count.files > 0 || folder._count.subfolders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete non-empty folder' },
        { status: 400 }
      );
    }

    // Delete folder
    await prisma.mediaFolder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
