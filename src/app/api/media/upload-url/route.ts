// /src/app/api/media/upload-url/route.ts
// Generate presigned URL for direct browser-to-R2 upload

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateUploadUrl, generateR2Key } from '@/lib/r2-client';

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  // Videos
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/mpeg',
  'video/webm',
  // Documents
  'application/pdf',
  'application/zip',
  'application/x-rar-compressed',
  // Raw images
  'image/x-canon-cr2',
  'image/x-nikon-nef',
  'image/x-adobe-dng',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB per file

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { folderId, filename, contentType, size } = body;

    // Validate required fields
    if (!folderId || !filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: folderId, filename, contentType' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `File type ${contentType} not allowed` },
        { status: 400 }
      );
    }

    // Validate file size
    if (size && size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size ${size} exceeds maximum of ${MAX_FILE_SIZE} bytes` },
        { status: 400 }
      );
    }

    // Get current user with agency
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        agency: true,
      },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 403 });
    }

    // Get folder and verify permissions
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
      include: {
        agency: true,
        client: true,
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check permissions: user must belong to same agency
    if (folder.agencyId !== user.agencyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check client-level permissions if folder is client-specific
    if (folder.clientId && user.role === 'MEMBER') {
      // Check if user is assigned to this client
      const clientAssignment = await prisma.clientTeamMember.findFirst({
        where: {
          userId: user.id,
          clientId: folder.clientId,
        },
      });

      if (!clientAssignment) {
        return NextResponse.json({ error: 'Access denied to this client folder' }, { status: 403 });
      }
    }

    // Generate unique file ID
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate R2 key
    const r2Key = generateR2Key({
      agencySlug: folder.agency.slug,
      clientId: folder.clientId || undefined,
      folderId: folder.id,
      filename,
      uuid: fileId,
    });

    // Generate presigned upload URL
    const uploadUrl = await generateUploadUrl({
      key: r2Key,
      contentType,
      expiresIn: 3600, // 1 hour
    });

    // Create pending file record in database
    const mediaFile = await prisma.mediaFile.create({
      data: {
        id: fileId,
        filename,
        originalName: filename,
        mimeType: contentType,
        size: BigInt(size || 0),
        r2Key,
        r2Bucket: process.env.R2_BUCKET_NAME || 'omnixia-media',
        folderId: folder.id,
        agencyId: folder.agencyId,
        clientId: folder.clientId,
        uploadedBy: user.id,
        tags: [],
      },
    });

    // Log activity
    await prisma.mediaActivity.create({
      data: {
        action: 'UPLOAD',
        userId: user.id,
        fileId: mediaFile.id,
        folderId: folder.id,
        agencyId: folder.agencyId,
      },
    });

    return NextResponse.json({
      uploadUrl,
      fileId: mediaFile.id,
      r2Key,
    });
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
