// /src/app/api/ai/chat/route.ts
// Main API endpoint for AI lead qualification conversations

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage } from '@/lib/ai/claude';
import { buildSystemPrompt, extractLeadData } from '@/lib/ai/buildSystemPrompt';
import { getRecommendation } from '@/lib/ai/calculateLeadScore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, message, agencyId } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation;
    let aiConfig;
    let agencyName = 'The Agency';

    if (conversationId) {
      // Existing conversation
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          },
          agency: true
        }
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      // Get AI config for this conversation's agency
      if (conversation.agencyId) {
        aiConfig = await prisma.aIConfiguration.findFirst({
          where: { agencyId: conversation.agencyId }
        });
        agencyName = conversation.agency?.name || 'The Agency';
      } else {
        // Find config without agency
        aiConfig = await prisma.aIConfiguration.findFirst({
          where: { agencyId: null }
        });
      }
    } else {
      // New conversation - find AI config
      if (agencyId) {
        const agency = await prisma.agency.findUnique({
          where: { id: agencyId }
        });
        
        if (!agency) {
          return NextResponse.json(
            { error: 'Agency not found' },
            { status: 404 }
          );
        }

        aiConfig = await prisma.aIConfiguration.findFirst({
          where: { agencyId }
        });
        agencyName = agency.name;
      } else {
        // No agencyId provided - find any available config
        aiConfig = await prisma.aIConfiguration.findFirst({
          orderBy: { createdAt: 'desc' }
        });

        // If config has an agency, get the name
        if (aiConfig?.agencyId) {
          const agency = await prisma.agency.findUnique({
            where: { id: aiConfig.agencyId }
          });
          agencyName = agency?.name || 'The Agency';
        }
      }

      if (!aiConfig) {
        return NextResponse.json(
          { error: 'No AI configuration found. Please configure the AI settings first.' },
          { status: 404 }
        );
      }

      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          agencyId: aiConfig.agencyId || null,
          visitorId: crypto.randomUUID(),
          channel: 'website',
          status: 'ACTIVE',
        },
        include: {
          messages: true,
          agency: true
        }
      });
    }

    if (!aiConfig) {
      // Try to find any config as fallback
      aiConfig = await prisma.aIConfiguration.findFirst();
      
      if (!aiConfig) {
        return NextResponse.json(
          { error: 'AI configuration not found' },
          { status: 404 }
        );
      }
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      }
    });

    // Build conversation history for Claude
    const conversationHistory = [
      ...conversation.messages.map(m => ({
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: m.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Build system prompt
    const systemPrompt = buildSystemPrompt(aiConfig, agencyName);

    // Get response from Claude
    const response = await sendMessage({
      systemPrompt,
      messages: conversationHistory,
    });

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: response.message,
        aiConfigVersion: aiConfig.activeVersion,
      }
    });

    // Extract lead data and check if qualification is complete
    const allMessages = [
      ...conversation.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'USER', content: message },
      { role: 'ASSISTANT', content: response.message }
    ];
    
    const leadData = extractLeadData(allMessages);

    // If qualification is complete, create or update lead
    if (leadData.qualificationComplete && leadData.leadScore) {
      const recommendation = getRecommendation(
        leadData.leadScore,
        aiConfig.qualificationThreshold
      );

      // Check if lead already exists for this conversation
      const existingLead = await prisma.lead.findUnique({
        where: { conversationId: conversation.id }
      });

      if (existingLead) {
        // Update existing lead with any new info
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            name: leadData.name || existingLead.name,
            email: leadData.email || existingLead.email,
            company: leadData.company || existingLead.company,
            phone: leadData.phone || existingLead.phone,
            budgetRange: leadData.budgetRange,
            authority: leadData.authority,
            need: leadData.need,
            timeline: leadData.timeline,
            qualificationScore: leadData.leadScore,
          }
        });
      } else {
        // Create new lead if qualified or warm - even without email initially
        if (recommendation === 'qualified' || recommendation === 'warm') {
          await prisma.lead.create({
            data: {
              conversationId: conversation.id,
              agencyId: conversation.agencyId,
              name: leadData.name || 'Unknown',
              email: leadData.email || 'pending@collection.com', // Placeholder if not yet provided
              company: leadData.company,
              phone: leadData.phone,
              budgetRange: leadData.budgetRange,
              authority: leadData.authority,
              need: leadData.need,
              timeline: leadData.timeline,
              qualificationScore: leadData.leadScore,
              qualifiedAt: recommendation === 'qualified' ? new Date() : null,
            }
          });
        }
      }

      // Update conversation status
      const newStatus = 
        recommendation === 'qualified' ? 'QUALIFIED' :
        recommendation === 'cold' ? 'DISQUALIFIED' :
        'ACTIVE';

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: newStatus,
          leadScore: leadData.leadScore,
        }
      });

      // Update analytics
      await prisma.conversationAnalytics.upsert({
        where: { conversationId: conversation.id },
        update: {
          messagesExchanged: allMessages.length,
          qualificationCompleted: true,
        },
        create: {
          conversationId: conversation.id,
          agencyId: conversation.agencyId,
          messagesExchanged: allMessages.length,
          qualificationCompleted: true,
        }
      });
    } else {
      // Just update message count
      await prisma.conversationAnalytics.upsert({
        where: { conversationId: conversation.id },
        update: {
          messagesExchanged: allMessages.length,
        },
        create: {
          conversationId: conversation.id,
          agencyId: conversation.agencyId,
          messagesExchanged: allMessages.length,
          qualificationCompleted: false,
        }
      });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      message: response.message,
      leadScore: leadData.leadScore,
      qualificationComplete: leadData.qualificationComplete,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
