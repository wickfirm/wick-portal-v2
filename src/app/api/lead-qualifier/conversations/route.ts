// /src/app/api/lead-qualifier/conversations/route.ts
// Get all conversations (with multi-tenant isolation)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get tenant context
    const tenant = await requireTenant();

    const conversations = await prisma.conversation.findMany({
      where: {
        agencyId: tenant.agencyId,
      },
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
