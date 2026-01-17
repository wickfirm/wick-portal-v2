// /src/app/api/lead-qualifier/conversations/[id]/status/route.ts
// Update conversation status (ACTIVE, QUALIFIED, DISQUALIFIED, BOOKED)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['ACTIVE', 'QUALIFIED', 'DISQUALIFIED', 'BOOKED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Update conversation status
    const conversation = await prisma.conversation.update({
      where: { id: params.id },
      data: { status },
      include: {
        lead: true,
      }
    });

    // If disqualifying, also update lead
    if (status === 'DISQUALIFIED' && conversation.lead) {
      await prisma.lead.update({
        where: { id: conversation.lead.id },
        data: { qualifiedAt: null }
      });
    }

    // If qualifying, set qualifiedAt
    if (status === 'QUALIFIED' && conversation.lead) {
      await prisma.lead.update({
        where: { id: conversation.lead.id },
        data: { qualifiedAt: conversation.lead.qualifiedAt || new Date() }
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Failed to update conversation status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
