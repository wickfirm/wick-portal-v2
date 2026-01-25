// /src/app/api/media/search/route.ts
// Search files across folders with filters

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    const folderId = searchParams.get('folderId');
    const fileType = searchParams.get('fileType'); // 'image', 'video', 'document', etc.
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true, clientId: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json(
        { error: 'User not associated with an agency' },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = {
      agencyId: user.agencyId,
      isDeleted: false,
    };

    // Search query - search in filename, originalName, description, and tags
    if (query.trim()) {
      where.OR = [
        { filename: { contains: query, mode: 'insensitive' } },
        { originalName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }, // Array contains
      ];
    }

    // Filter by client
    if (clientId) {
      where.clientId = clientId;
    } else if (user.role === 'MEMBER' && user.clientId) {
      // Client users can only see their own files
      where.clientId = user.clientId;
    }

    // Filter by folder
    if (folderId) {
      where.folderId = folderId;
    }

    // Filter by file type
    if (fileType) {
      const mimeTypePatterns: Record<string, string[]> = {
        image: ['image/'],
        video: ['video/'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats', 'text/'],
        archive: ['application/zip', 'application/x-rar', 'application/x-7z'],
      };

      const patterns = mimeTypePatterns[fileType];
      if (patterns) {
        where.OR = patterns.map(pattern => ({
          mimeType: { startsWith: pattern },
        }));
      }
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Get total count
    const totalCount = await prisma.mediaFile.count({ where });

    // Get files with folder information
    const files = await prisma.mediaFile.findMany({
      where,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
            clientId: true,
            projectId: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { uploadedAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Format response
    const formattedFiles = files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size.toString(),
      thumbnailUrl: file.thumbnailUrl,
      previewUrl: file.previewUrl,
      tags: file.tags,
      description: file.description,
      downloadCount: file.downloadCount,
      viewCount: file.viewCount,
      lastAccessedAt: file.lastAccessedAt,
      uploadedAt: file.uploadedAt,
      folder: file.folder,
      uploader: file.uploader,
    }));

    return NextResponse.json({
      files: formattedFiles,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + files.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Failed to search files:', error);
    return NextResponse.json(
      { error: 'Failed to search files' },
      { status: 500 }
    );
  }
}
