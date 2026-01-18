// /src/app/api/lead-qualifier/conversations/route.ts
// Get all conversations (with multi-tenant isolation)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getScopedPrisma } from "@/lib/prisma-scoped";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get scoped Prisma client (automatically filters by agencyId)
    const db = await getScopedPrisma();

    const conversations = await db.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
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
        messages: {
          select: {
            id: true,
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
        messagesCount: conv.messages.length,
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
