// /src/app/api/media/folders/route.ts
// List and create folders

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List all folders for the user's agency
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const parentId = searchParams.get('parentId');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      agencyId: user.agencyId,
    };

    // Filter by client if specified
    if (clientId) {
      where.clientId = clientId;
      
      // Check client access for non-admin users
      if (user.role === 'MEMBER') {
        const hasAccess = await prisma.clientTeamMember.findFirst({
          where: { userId: user.id, clientId },
        });
        if (!hasAccess) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    }

    // Filter by parent folder
    if (parentId) {
      where.parentId = parentId;
    } else if (parentId === null) {
      where.parentId = null; // Root folders only
    }

    const folders = await prisma.mediaFolder.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            files: true,
            subfolders: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST - Create new folder
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, clientId, projectId, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
      include: { agency: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: 'User not associated with an agency' }, { status: 403 });
    }

    // Check client access if creating in client folder
    if (clientId && user.role === 'MEMBER') {
      const hasAccess = await prisma.clientTeamMember.findFirst({
        where: { userId: user.id, clientId },
      });
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this client' }, { status: 403 });
      }
    }

    // Build folder path
    let path = '/';
    if (parentId) {
      const parent = await prisma.mediaFolder.findUnique({
        where: { id: parentId },
        select: { path: true, agencyId: true },
      });
      
      if (!parent || parent.agencyId !== user.agencyId) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }
      
      path = `${parent.path}/${name}`;
    } else if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { name: true },
      });
      path = `/client-${client?.name || clientId}/${name}`;
    } else {
      path = `/${name}`;
    }

    // Create folder
    const folder = await prisma.mediaFolder.create({
      data: {
        name,
        description,
        path,
        agencyId: user.agencyId,
        clientId,
        projectId,
        parentId,
        createdBy: user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Failed to create folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
