import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/[id]/expenses/[expenseId] - Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const expense = await prisma.projectExpense.findUnique({
      where: { id: params.expenseId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to fetch expense:", error);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

// PUT /api/projects/[id]/expenses/[expenseId] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();

    const expense = await prisma.projectExpense.update({
      where: { id: params.expenseId },
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date ? new Date(data.date) : undefined,
        vendor: data.vendor,
        isBillable: data.isBillable,
        markupPercentage: data.markupPercentage,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
          },
        },
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to update expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/expenses/[expenseId] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.projectExpense.delete({
      where: { id: params.expenseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
