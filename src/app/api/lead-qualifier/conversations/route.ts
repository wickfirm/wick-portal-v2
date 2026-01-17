// /src/app/api/lead-qualifier/conversations/route.ts
// Get all conversations

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
