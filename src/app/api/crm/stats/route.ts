import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user with agency info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build agency filter
    // Platform admins (no agencyId) see Omnixia leads (agencyId = null)
    // Agency users see their agency's leads
    const agencyFilter = currentUser.agencyId
      ? { agencyId: currentUser.agencyId }
      : { agencyId: null };

    // Get WebsiteLead stats
    const [
      websiteLeadsTotal,
      websiteLeadsNew,
      websiteLeadsContacted,
      websiteLeadsQualified,
      websiteLeadsConverted,
      websiteLeadsThisWeek,
      websiteLeadsThisMonth,
    ] = await Promise.all([
      prisma.websiteLead.count({ where: agencyFilter }),
      prisma.websiteLead.count({ where: { ...agencyFilter, status: "NEW" } }),
      prisma.websiteLead.count({ where: { ...agencyFilter, status: "CONTACTED" } }),
      prisma.websiteLead.count({ where: { ...agencyFilter, status: "QUALIFIED" } }),
      prisma.websiteLead.count({ where: { ...agencyFilter, status: "CONVERTED" } }),
      prisma.websiteLead.count({
        where: {
          ...agencyFilter,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.websiteLead.count({
        where: {
          ...agencyFilter,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Get AI Leads stats (from Lead model)
    const aiLeadFilter = currentUser.agencyId
      ? { agencyId: currentUser.agencyId }
      : { agencyId: null };

    const [aiLeadsTotal, aiLeadsQualified] = await Promise.all([
      prisma.lead.count({ where: aiLeadFilter }),
      prisma.lead.count({
        where: {
          ...aiLeadFilter,
          qualificationScore: { gte: 70 },
        },
      }),
    ]);

    // Get Client prospects (status = LEAD)
    const clientFilter = currentUser.agencyId
      ? { agencies: { some: { agencyId: currentUser.agencyId } }, status: "LEAD" }
      : { status: "LEAD" };

    const clientProspects = await prisma.client.count({ where: clientFilter });

    // Get recent website leads
    const recentLeads = await prisma.websiteLead.findMany({
      where: agencyFilter,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        teamSize: true,
        status: true,
        source: true,
        createdAt: true,
      },
    });

    // Calculate conversion rate
    const conversionRate = websiteLeadsTotal > 0
      ? Math.round((websiteLeadsConverted / websiteLeadsTotal) * 100)
      : 0;

    // Get leads by source
    const leadsBySource = await prisma.websiteLead.groupBy({
      by: ["source"],
      where: agencyFilter,
      _count: { id: true },
    });

    // Get leads by status for pipeline
    const pipelineStats = [
      { stage: "New", count: websiteLeadsNew, color: "#3b82f6" },
      { stage: "Contacted", count: websiteLeadsContacted, color: "#f59e0b" },
      { stage: "Qualified", count: websiteLeadsQualified, color: "#8b5cf6" },
      { stage: "Converted", count: websiteLeadsConverted, color: "#22c55e" },
    ];

    return NextResponse.json({
      stats: {
        totalLeads: websiteLeadsTotal + aiLeadsTotal + clientProspects,
        websiteLeads: websiteLeadsTotal,
        aiLeads: aiLeadsTotal,
        clientProspects,
        newLeads: websiteLeadsNew,
        qualifiedLeads: websiteLeadsQualified + aiLeadsQualified,
        convertedLeads: websiteLeadsConverted,
        conversionRate,
        leadsThisWeek: websiteLeadsThisWeek,
        leadsThisMonth: websiteLeadsThisMonth,
      },
      pipelineStats,
      leadsBySource: leadsBySource.map((s) => ({
        source: s.source,
        count: s._count.id,
      })),
      recentLeads,
    });
  } catch (error) {
    console.error("CRM stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CRM stats" },
      { status: 500 }
    );
  }
}
