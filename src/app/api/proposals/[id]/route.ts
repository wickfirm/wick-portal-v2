import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/proposals/[id] - Get single proposal with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
        comments: {
          orderBy: { createdAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            phone: true,
            company: true,
            industry: true,
          },
        },
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        revisions: {
          select: { id: true, version: true, createdAt: true, status: true },
          orderBy: { version: "desc" },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Serialize decimals and dates
    const serialized = {
      ...proposal,
      subtotal: Number(proposal.subtotal),
      total: Number(proposal.total),
      taxRate: proposal.taxRate ? Number(proposal.taxRate) : null,
      taxAmount: proposal.taxAmount ? Number(proposal.taxAmount) : null,
      discountValue: proposal.discountValue ? Number(proposal.discountValue) : null,
      startupPrice: proposal.startupPrice ? Number(proposal.startupPrice) : null,
      ongoingPrice: proposal.ongoingPrice ? Number(proposal.ongoingPrice) : null,
      depositPercentage: proposal.depositPercentage ? Number(proposal.depositPercentage) : null,
      paidAmount: proposal.paidAmount ? Number(proposal.paidAmount) : null,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      sentAt: proposal.sentAt?.toISOString() || null,
      signedAt: proposal.signedAt?.toISOString() || null,
      acceptedAt: proposal.acceptedAt?.toISOString() || null,
      declinedAt: proposal.declinedAt?.toISOString() || null,
      paidAt: proposal.paidAt?.toISOString() || null,
      lastViewedAt: proposal.lastViewedAt?.toISOString() || null,
      expiresAt: proposal.expiresAt?.toISOString() || null,
      items: proposal.items.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        estimatedHours: item.estimatedHours ? Number(item.estimatedHours) : null,
        createdAt: item.createdAt.toISOString(),
      })),
      comments: proposal.comments.map((c: any) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      activities: proposal.activities.map((a: any) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      revisions: proposal.revisions.map((r: any) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ proposal: serialized });
  } catch (error) {
    console.error("Failed to fetch proposal:", error);
    return NextResponse.json({ error: "Failed to fetch proposal" }, { status: 500 });
  }
}

// PUT /api/proposals/[id] - Update proposal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.proposal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();

    // Build update data from provided fields only
    const updateData: any = {};
    const allowedFields = [
      "title", "projectType", "status", "language", "currency",
      "briefSource", "briefContent", "briefAttachments", "extractedData",
      "sections", "subtotal", "taxRate", "taxAmount",
      "discountType", "discountValue", "total",
      "startupPrice", "startupMonths", "ongoingPrice",
      "paymentTerms", "paymentSchedule",
      "password", "expiresAt",
      "paymentRequired",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.proposalActivity.create({
      data: {
        proposalId: id,
        action: "UPDATED",
        performedBy: currentUser.id,
        details: { updatedFields: Object.keys(updateData) },
      },
    });

    return NextResponse.json({
      proposal: {
        ...proposal,
        subtotal: Number(proposal.subtotal),
        total: Number(proposal.total),
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update proposal:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}

// DELETE /api/proposals/[id] - Delete proposal (draft only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Only allow deleting drafts
    if (proposal.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft proposals can be deleted" },
        { status: 400 }
      );
    }

    await prisma.proposal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete proposal:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
}
