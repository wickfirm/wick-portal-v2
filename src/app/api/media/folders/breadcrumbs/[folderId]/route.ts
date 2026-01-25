// /src/app/api/media/folders/breadcrumbs/[folderId]/route.ts
// Get breadcrumb trail for a folder

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

async function getFolderBreadcrumbs(folderId: string): Promise<BreadcrumbItem[]> {
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentFolder = await prisma.mediaFolder.findUnique({
    where: { id: folderId },
    select: {
      id: true,
      name: true,
      path: true,
      parentId: true,
    },
  });

  while (currentFolder) {
    breadcrumbs.unshift({
      id: currentFolder.id,
      name: currentFolder.name,
      path: currentFolder.path,
    });

    if (currentFolder.parentId) {
      currentFolder = await prisma.mediaFolder.findUnique({
        where: { id: currentFolder.parentId },
        select: {
          id: true,
          name: true,
          path: true,
          parentId: true,
        },
      });
    } else {
      currentFolder = null;
    }
  }

  return breadcrumbs;
}

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
      select: { id: true, agencyId: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json(
        { error: 'User not associated with an agency' },
        { status: 403 }
      );
    }

    // Get folder and verify permissions
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.agencyId !== user.agencyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get breadcrumb trail
    const breadcrumbs = await getFolderBreadcrumbs(folderId);

    return NextResponse.json({
      breadcrumbs,
    });
  } catch (error) {
    console.error('Failed to get breadcrumbs:', error);
    return NextResponse.json(
      { error: 'Failed to get breadcrumbs' },
      { status: 500 }
    );
  }
}
