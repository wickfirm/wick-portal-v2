import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/send - Mark proposal as sent
export async function POST(
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

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.status !== "DRAFT" && proposal.status !== "NEGOTIATING") {
      return NextResponse.json(
        { error: "Only draft or negotiating proposals can be sent" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { password, expiresInDays } = body;

    const updateData: any = {
      status: "SENT",
      sentAt: new Date(),
    };

    if (password) {
      updateData.password = password;
    }

    if (expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      updateData.expiresAt = expiresAt;
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.proposalActivity.create({
      data: {
        proposalId: id,
        action: "SENT",
        performedBy: currentUser.id,
        details: {
          passwordProtected: !!password,
          expiresInDays: expiresInDays || null,
        },
      },
    });

    // Build the public URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const publicUrl = `${baseUrl}/p/${updated.publicToken}`;

    return NextResponse.json({
      success: true,
      publicUrl,
      publicToken: updated.publicToken,
    });
  } catch (error) {
    console.error("Failed to send proposal:", error);
    return NextResponse.json({ error: "Failed to send proposal" }, { status: 500 });
  }
}
