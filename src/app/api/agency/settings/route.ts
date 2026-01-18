import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    const agency = await prisma.agency.findUnique({
      where: { id: tenant.agencyId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    return NextResponse.json(agency);
  } catch (error) {
    console.error('Error fetching agency settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenant = await requireTenant();
    const body = await request.json();

    const { name, logo, primaryColor } = body;

    const updated = await prisma.agency.update({
      where: { id: tenant.agencyId },
      data: {
        name,
        logo,
        primaryColor,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating agency settings:', error);
    return NextResponse.json(
      { error: 'Failed to update agency settings' },
      { status: 500 }
    );
  }
}
