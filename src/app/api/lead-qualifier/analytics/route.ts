// /src/app/api/lead-qualifier/analytics/route.ts
// Analytics data for lead qualifier

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

    // Total conversations
    const totalConversations = await prisma.conversation.count({
      where: agencyFilter,
    });

    // Qualified leads
    const qualifiedLeads = await prisma.conversation.count({
      where: {
        ...agencyFilter,
        status: 'QUALIFIED',
      },
    });

    // Conversion rate
    const conversionRate = totalConversations > 0 
      ? Math.round((qualifiedLeads / totalConversations) * 100) 
      : 0;

    // Average lead score
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

    // Average messages per conversation
    const msgResult = await prisma.conversationAnalytics.aggregate({
      where: agencyFilter,
      _avg: {
        messagesExchanged: true,
      },
    });
    const avgMessagesPerConversation = Math.round(msgResult._avg.messagesExchanged || 0);

    // Status breakdown
    const statusCounts = await prisma.conversation.groupBy({
      by: ['status'],
      where: agencyFilter,
      _count: true,
    });

    const statusBreakdown = {
      ACTIVE: 0,
      QUALIFIED: 0,
      DISQUALIFIED: 0,
      BOOKED: 0,
    };

    statusCounts.forEach(item => {
      if (item.status in statusBreakdown) {
        statusBreakdown[item.status as keyof typeof statusBreakdown] = item._count;
      }
    });

    return NextResponse.json({
      totalConversations,
      qualifiedLeads,
      conversionRate,
      avgLeadScore,
      avgMessagesPerConversation,
      statusBreakdown,
      recentActivity: [], // TODO: Implement daily breakdown
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
