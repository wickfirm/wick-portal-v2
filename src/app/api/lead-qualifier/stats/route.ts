// /src/app/api/lead-qualifier/stats/route.ts
// Stats endpoint for lead qualifier dashboard

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
    // Get user's agency
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { agencyId: true },
    });

    const agencyFilter = user?.agencyId ? { agencyId: user.agencyId } : {};

    // Get total conversations
    const totalConversations = await prisma.conversation.count({
      where: agencyFilter,
    });

    // Get qualified leads
    const qualifiedLeads = await prisma.conversation.count({
      where: {
        ...agencyFilter,
        status: 'QUALIFIED',
      },
    });

    // Calculate conversion rate
    const conversionRate = totalConversations > 0 
      ? Math.round((qualifiedLeads / totalConversations) * 100) 
      : 0;

    // Get average lead score
    const avgResult = await prisma.conversation.aggregate({
      where: {
        ...agencyFilter,
        leadScore: { not: null },
      },
      _avg: {
        leadScore: true,
      },
    });
    const avgLeadScore = Math.round(avgResult._avg.leadScore || 0);

    // Get recent conversations with message count
    const recentConversations = await prisma.conversation.findMany({
      where: agencyFilter,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      totalConversations,
      qualifiedLeads,
      conversionRate,
      avgLeadScore,
      recentConversations: recentConversations.map(conv => ({
        id: conv.id,
        visitorId: conv.visitorId,
        status: conv.status,
        leadScore: conv.leadScore,
        messagesCount: conv._count.messages,
        createdAt: conv.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
