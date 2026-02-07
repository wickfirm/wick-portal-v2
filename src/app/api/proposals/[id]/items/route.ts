import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/items - Add items to proposal
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

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    // Get max order for existing items
    const maxOrder = await prisma.proposalItem.aggregate({
      where: { proposalId: id },
      _max: { order: true },
    });

    let currentOrder = (maxOrder._max.order || 0) + 1;

    // Create all items
    const created = await Promise.all(
      items.map((item: any) => {
        const total = (item.quantity || 1) * (item.unitPrice || 0);
        return prisma.proposalItem.create({
          data: {
            proposalId: id,
            type: item.type || "SERVICE",
            name: item.name,
            nameAr: item.nameAr || null,
            description: item.description || null,
            descriptionAr: item.descriptionAr || null,
            category: item.category || null,
            subcategory: item.subcategory || null,
            order: item.order ?? currentOrder++,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total,
            estimatedHours: item.estimatedHours || null,
            timeline: item.timeline || null,
            isRecurring: item.isRecurring || false,
            frequency: item.frequency || null,
            isOptional: item.isOptional || false,
            isSelected: item.isSelected !== undefined ? item.isSelected : true,
          },
        });
      })
    );

    // Recalculate proposal totals
    const allItems = await prisma.proposalItem.findMany({
      where: { proposalId: id, isSelected: true },
    });

    const subtotal = allItems.reduce(
      (sum: number, item: any) => sum + Number(item.total),
      0
    );

    let total = subtotal;
    if (proposal.taxRate) {
      const taxAmount = subtotal * (Number(proposal.taxRate) / 100);
      await prisma.proposal.update({
        where: { id },
        data: { subtotal, taxAmount, total: subtotal + taxAmount },
      });
    } else {
      // Apply discount if any
      if (proposal.discountType === "PERCENTAGE" && proposal.discountValue) {
        total = subtotal - subtotal * (Number(proposal.discountValue) / 100);
      } else if (proposal.discountType === "FIXED" && proposal.discountValue) {
        total = subtotal - Number(proposal.discountValue);
      }
      await prisma.proposal.update({
        where: { id },
        data: { subtotal, total },
      });
    }

    // Serialize
    const serialized = created.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
      estimatedHours: item.estimatedHours ? Number(item.estimatedHours) : null,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json({ items: serialized });
  } catch (error) {
    console.error("Failed to add proposal items:", error);
    return NextResponse.json({ error: "Failed to add items" }, { status: 500 });
  }
}

// PUT /api/proposals/[id]/items - Bulk update items (reorder, update, delete)
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

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    // Update each item
    const updated = await Promise.all(
      items.map((item: any) =>
        prisma.proposalItem.update({
          where: { id: item.id },
          data: {
            name: item.name,
            nameAr: item.nameAr,
            description: item.description,
            descriptionAr: item.descriptionAr,
            category: item.category,
            subcategory: item.subcategory,
            order: item.order,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: (item.quantity || 1) * (item.unitPrice || 0),
            estimatedHours: item.estimatedHours,
            timeline: item.timeline,
            isRecurring: item.isRecurring,
            frequency: item.frequency,
            isOptional: item.isOptional,
            isSelected: item.isSelected,
          },
        })
      )
    );

    // Recalculate proposal totals
    const allItems = await prisma.proposalItem.findMany({
      where: { proposalId: id, isSelected: true },
    });

    const subtotal = allItems.reduce(
      (sum: number, item: any) => sum + Number(item.total),
      0
    );

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    let total = subtotal;

    if (proposal?.discountType === "PERCENTAGE" && proposal.discountValue) {
      total = subtotal - subtotal * (Number(proposal.discountValue) / 100);
    } else if (proposal?.discountType === "FIXED" && proposal?.discountValue) {
      total = subtotal - Number(proposal.discountValue);
    }

    if (proposal?.taxRate) {
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
    console.error("Failed to update proposal items:", error);
    return NextResponse.json({ error: "Failed to update items" }, { status: 500 });
  }
}
