import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/proposals - List all proposals
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, role: true, id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build filter based on role
    let filter: any = {};
    if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
      if (currentUser.agencyId) {
        filter.agencyId = currentUser.agencyId;
      }
    } else if (currentUser.role === "MEMBER") {
      filter.createdBy = currentUser.id;
    }

    const proposals = await prisma.proposal.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        projectType: true,
        status: true,
        currency: true,
        total: true,
        startupPrice: true,
        ongoingPrice: true,
        viewCount: true,
        lastViewedAt: true,
        sentAt: true,
        signedAt: true,
        createdAt: true,
        updatedAt: true,
        version: true,
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
            comments: true,
          },
        },
      },
    });

    // Serialize decimals
    const serialized = proposals.map((p: any) => ({
      ...p,
      total: p.total ? Number(p.total) : 0,
      startupPrice: p.startupPrice ? Number(p.startupPrice) : null,
      ongoingPrice: p.ongoingPrice ? Number(p.ongoingPrice) : null,
      createdAt: p.createdAt?.toISOString(),
      updatedAt: p.updatedAt?.toISOString(),
      sentAt: p.sentAt?.toISOString() || null,
      signedAt: p.signedAt?.toISOString() || null,
      lastViewedAt: p.lastViewedAt?.toISOString() || null,
    }));

    // Calculate stats
    const stats = {
      total: serialized.length,
      draft: serialized.filter((p: any) => p.status === "DRAFT").length,
      sent: serialized.filter((p: any) => p.status === "SENT" || p.status === "VIEWED").length,
      accepted: serialized.filter((p: any) => p.status === "ACCEPTED").length,
      declined: serialized.filter((p: any) => p.status === "DECLINED").length,
      totalValue: serialized.reduce((sum: number, p: any) => sum + (p.total || 0), 0),
      wonValue: serialized.filter((p: any) => p.status === "ACCEPTED").reduce((sum: number, p: any) => sum + (p.total || 0), 0),
    };

    return NextResponse.json({ proposals: serialized, stats });
  } catch (error) {
    console.error("Failed to fetch proposals:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

// POST /api/proposals - Create new proposal (starts with brief intake)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, id: true },
    });

    if (!currentUser || !currentUser.agencyId) {
      return NextResponse.json({ error: "User not found or no agency" }, { status: 404 });
    }

    const body = await request.json();
    const { clientId, title, projectType, briefSource, briefContent, currency, language } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client is required" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate unique public token
    const publicToken = crypto.randomBytes(16).toString("hex");

    const proposal = await prisma.proposal.create({
      data: {
        agencyId: currentUser.agencyId,
        clientId,
        title,
        projectType: projectType || "CUSTOM",
        briefSource: briefSource || "MANUAL",
        briefContent: briefContent || null,
        currency: currency || "AED",
        language: language || "en",
        publicToken,
        subtotal: 0,
        total: 0,
        createdBy: currentUser.id,
        sections: [],
      },
      include: {
        client: {
          select: { id: true, name: true, nickname: true },
        },
        createdByUser: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await prisma.proposalActivity.create({
      data: {
        proposalId: proposal.id,
        action: "CREATED",
        performedBy: currentUser.id,
        details: { title, projectType: projectType || "CUSTOM" },
      },
    });

    // Serialize
    const serialized = {
      ...proposal,
      subtotal: Number(proposal.subtotal),
      total: Number(proposal.total),
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
    };

    return NextResponse.json({ proposal: serialized });
  } catch (error) {
    console.error("Failed to create proposal:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
