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
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    // If qualifying but no lead exists, create one
    if (status === 'QUALIFIED' && !conversation.lead) {
      // Try to extract basic info from messages
      const userMessages = conversation.messages
        .filter(m => m.role === 'USER')
        .map(m => m.content)
        .join(' ');
      
      // Extract email
      const emailMatch = userMessages.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      const email = emailMatch ? emailMatch[0] : 'unknown@pending.com';
      
      // Extract phone
      const phoneMatch = userMessages.match(/\+?\d{10,}/);
      const phone = phoneMatch ? phoneMatch[0] : null;

      await prisma.lead.create({
        data: {
          conversationId: conversation.id,
          agencyId: conversation.agencyId,
          name: 'Manual Qualification',
          email: email,
          phone: phone,
          qualificationScore: conversation.leadScore || 70,
          qualifiedAt: new Date(),
        }
      });
    }

    // If disqualifying, also update lead
    if (status === 'DISQUALIFIED' && conversation.lead) {
      await prisma.lead.update({
        where: { id: conversation.lead.id },
        data: { qualifiedAt: null }
      });
    }

    // If qualifying and lead exists, set qualifiedAt
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
