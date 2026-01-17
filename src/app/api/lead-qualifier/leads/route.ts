// /src/app/api/lead-qualifier/leads/route.ts
// Get all leads

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

    const leads = await prisma.lead.findMany({
      where: agencyFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        conversation: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      leads: leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        budgetRange: lead.budgetRange,
        authority: lead.authority,
        need: lead.need,
        timeline: lead.timeline,
        qualificationScore: lead.qualificationScore,
        createdAt: lead.createdAt.toISOString(),
        qualifiedAt: lead.qualifiedAt?.toISOString() || null,
        conversation: lead.conversation,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
