// /src/app/api/lead-qualifier/leads/[id]/route.ts
// Individual lead management - update, delete, assign

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET single lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { timestamp: 'asc' }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Failed to fetch lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PATCH - Update lead
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
    const {
      name,
      email,
      company,
      phone,
      budgetRange,
      authority,
      need,
      timeline,
      industry,
      qualificationScore,
      assignedToId,
    } = body;

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(company !== undefined && { company }),
        ...(phone !== undefined && { phone }),
        ...(budgetRange !== undefined && { budgetRange }),
        ...(authority !== undefined && { authority }),
        ...(need !== undefined && { need }),
        ...(timeline !== undefined && { timeline }),
        ...(industry !== undefined && { industry }),
        ...(qualificationScore !== undefined && { qualificationScore }),
        ...(assignedToId !== undefined && { assignedToId }),
      },
      include: {
        conversation: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      }
    });

    // If qualification score changed, update conversation
    if (qualificationScore !== undefined && updatedLead.conversationId) {
      await prisma.conversation.update({
        where: { id: updatedLead.conversationId },
        data: { leadScore: qualificationScore }
      });
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Failed to update lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE - Delete lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the lead first to update conversation status
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      select: { conversationId: true }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Delete the lead
    await prisma.lead.delete({
      where: { id: params.id }
    });

    // Update conversation status back to ACTIVE if it was qualified
    if (lead.conversationId) {
      await prisma.conversation.update({
        where: { id: lead.conversationId },
        data: {
          status: 'ACTIVE',
          leadScore: null,
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    console.error('Failed to delete lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
