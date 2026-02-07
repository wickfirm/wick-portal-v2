import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE /api/proposals/[id]/items/[itemId] - Delete a single item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify proposal exists
    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Only allow deleting items from draft proposals
    if (proposal.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only remove items from draft proposals" },
        { status: 400 }
      );
    }

    // Verify item belongs to this proposal
    const item = await prisma.proposalItem.findUnique({ where: { id: itemId } });
    if (!item || item.proposalId !== id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete the item
    await prisma.proposalItem.delete({ where: { id: itemId } });

    // Recalculate proposal totals
    const remainingItems = await prisma.proposalItem.findMany({
      where: { proposalId: id, isSelected: true },
    });

    const subtotal = remainingItems.reduce(
      (sum: number, i: any) => sum + Number(i.total),
      0
    );

    let total = subtotal;

    if (proposal.discountType === "PERCENTAGE" && proposal.discountValue) {
      total = subtotal - subtotal * (Number(proposal.discountValue) / 100);
    } else if (proposal.discountType === "FIXED" && proposal.discountValue) {
      total = subtotal - Number(proposal.discountValue);
    }

    if (proposal.taxRate) {
      const taxAmount = total * (Number(proposal.taxRate) / 100);
      total = total + taxAmount;
      await prisma.proposal.update({
        where: { id },
        data: { subtotal, taxAmount, total },
      });
    } else {
      await prisma.proposal.update({
        where: { id },
        data: { subtotal, total },
      });
    }

    return NextResponse.json({ success: true, subtotal, total });
  } catch (error) {
    console.error("Failed to delete proposal item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
