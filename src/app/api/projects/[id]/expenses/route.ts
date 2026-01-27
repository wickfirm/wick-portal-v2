import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/[id]/expenses - Get all expenses for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projectId = params.id;

    const expenses = await prisma.projectExpense.findMany({
      where: { projectId },
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST /api/projects/[id]/expenses - Create a new expense
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projectId = params.id;
    const data = await request.json();

    // Get project to get clientId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const expense = await prisma.projectExpense.create({
      data: {
        projectId,
        clientId: project.clientId,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        vendor: data.vendor || null,
        isBillable: data.isBillable ?? false,
        markupPercentage: data.markupPercentage || null,
        invoiceNumber: data.invoiceNumber || null,
        notes: data.notes || null,
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
    console.error("Failed to create expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
