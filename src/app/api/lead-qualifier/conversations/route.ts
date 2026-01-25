// /src/app/api/lead-qualifier/conversations/route.ts
// Get all conversations (with multi-tenant isolation) + Create from widget

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's agency from session (instead of tenant context)
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { agencyId: true },
    });

    const agencyFilter = user?.agencyId ? { agencyId: user.agencyId } : {};

    const conversations = await prisma.conversation.findMany({
      where: agencyFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
        lead: {
          select: {
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        visitorId: conv.visitorId,
        channel: conv.channel,
        status: conv.status,
        leadScore: conv.leadScore,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        messagesCount: conv._count.messages,
        lead: conv.lead,
        assignedTo: conv.assignedTo,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST handler for widget messages (public - no auth required)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agencyId, visitorId, conversationId, message, channel, sourceUrl, utmParams } = body;

    // Validate required fields
    if (!agencyId || !visitorId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        agencyId,
        visitorId,
        status: 'ACTIVE'
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          agencyId,
          visitorId,
          channel: channel || 'website',
          sourceUrl,
          utmParams: utmParams || undefined,
          status: 'ACTIVE'
        }
      });
    }

    // Create user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        agencyId
      }
    });

    // Get AI settings for this agency
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { agencyId }
    });

    // Generate AI response using Claude
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Get conversation history
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' }
    });

    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: aiConfig?.systemPrompt || 'You are a helpful AI assistant for lead qualification. Ask relevant questions to understand the visitor\'s needs and qualify them as a lead.',
      messages: conversationHistory
    });

    const assistantMessage = response.content[0].text;

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
        agencyId
      }
    });

    // Calculate lead score if conversation has enough messages
    if (messages.length >= 4) {
      // Simple scoring logic - can be enhanced
      const userMessages = messages.filter(m => m.role === 'user');
      const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
      const hasEmail = userMessages.some(m => m.content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/));
      const hasPhone = userMessages.some(m => m.content.match(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/));
      
      let score = 30; // Base score
      if (avgLength > 50) score += 20;
      if (hasEmail) score += 25;
      if (hasPhone) score += 25;
      
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { leadScore: Math.min(score, 100) }
      });
    }

    return NextResponse.json({
      response: assistantMessage,
      conversationId: conversation.id
    });

  } catch (error) {
    console.error("Failed to process message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
