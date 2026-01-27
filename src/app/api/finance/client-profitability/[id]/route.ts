import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/finance/client-profitability/[id] - Calculate client profitability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const clientId = params.id;

    // Get client with revenue model
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get all projects for this client
    const projects = await prisma.project.findMany({
      where: { clientId },
    });

    // Get all time entries for this client
    const timeEntries = await prisma.timeEntry.findMany({
      where: { clientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            billRate: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get all expenses for this client
    const expenses = await prisma.projectExpense.findMany({
      where: { clientId },
    });

    // Calculate time costs
    let totalHours = 0;
    let totalLaborCost = 0;
    let totalLaborRevenue = 0;

    // Group by project for breakdown
    const projectBreakdown: Record<string, any> = {};

    timeEntries.forEach((entry) => {
      const hours = entry.duration / 3600;
      totalHours += hours;

      // Cost - Use rate snapshot if available, fallback to current rate
      const hourlyRate = Number(entry.hourlyRateAtTime) || Number(entry.user.hourlyRate) || 0;
      const cost = hours * hourlyRate;
      totalLaborCost += cost;

      // Revenue (only for T&M at project level)
      if (entry.billable) {
        const billRate = Number(entry.billRateAtTime) || Number(entry.user.billRate) || 0;
        const revenue = hours * billRate;
        totalLaborRevenue += revenue;
      }

      // Track per-project
      if (!projectBreakdown[entry.projectId]) {
        projectBreakdown[entry.projectId] = {
          projectId: entry.projectId,
          projectName: entry.project.name,
          hours: 0,
          laborCost: 0,
          laborRevenue: 0,
          expenses: 0,
        };
      }
      projectBreakdown[entry.projectId].hours += hours;
      projectBreakdown[entry.projectId].laborCost += cost;
      if (entry.billable) {
        const billRate = Number(entry.billRateAtTime) || Number(entry.user.billRate) || 0;
        projectBreakdown[entry.projectId].laborRevenue += hours * billRate;
      }
    });

    // Calculate expense costs
    let totalExpenseCost = 0;
    let totalExpenseRevenue = 0;

    expenses.forEach((expense) => {
      const amount = Number(expense.amount);
      totalExpenseCost += amount;

      if (expense.isBillable) {
        const markup = Number(expense.markupPercentage) || 0;
        totalExpenseRevenue += amount * (1 + markup / 100);
      }

      // Track per-project
      if (projectBreakdown[expense.projectId]) {
        projectBreakdown[expense.projectId].expenses += amount;
      }
    });

    // Determine final revenue based on client's revenue model
    let finalRevenue = 0;
    
    if (client.revenueModel === "CLIENT_LEVEL") {
      // Client-level: Use monthly revenue or fixed fee
      if (client.pricingModel === "FIXED_FEE" && client.monthlyRevenue) {
        finalRevenue = Number(client.monthlyRevenue);
      } else {
        // T&M at client level still uses calculated revenue
        finalRevenue = totalLaborRevenue + totalExpenseRevenue;
      }
    } else {
      // Project-based: Sum up project revenues
      // Need to check each project's pricing model
      for (const project of projects) {
        if (project.pricingModel === "FIXED_FEE" && project.fixedFeeAmount) {
          finalRevenue += Number(project.fixedFeeAmount);
        }
      }
      // Add T&M revenue from time entries
      finalRevenue += totalLaborRevenue + totalExpenseRevenue;
    }

    // Total calculations
    const totalCost = totalLaborCost + totalExpenseCost;
    const profitAmount = finalRevenue - totalCost;
    const profitMargin = finalRevenue > 0 ? (profitAmount / finalRevenue) * 100 : 0;

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        nickname: client.nickname,
        revenueModel: client.revenueModel,
        pricingModel: client.pricingModel,
        monthlyRevenue: client.monthlyRevenue ? Number(client.monthlyRevenue) : null,
      },
      hours: {
        total: Math.round(totalHours * 100) / 100,
      },
      costs: {
        labor: Math.round(totalLaborCost * 100) / 100,
        expenses: Math.round(totalExpenseCost * 100) / 100,
        total: Math.round(totalCost * 100) / 100,
      },
      revenue: {
        labor: Math.round(totalLaborRevenue * 100) / 100,
        expenses: Math.round(totalExpenseRevenue * 100) / 100,
        clientLevel: client.revenueModel === "CLIENT_LEVEL" && client.monthlyRevenue ? Number(client.monthlyRevenue) : 0,
        total: Math.round(finalRevenue * 100) / 100,
      },
      profit: {
        amount: Math.round(profitAmount * 100) / 100,
        margin: Math.round(profitMargin * 100) / 100,
      },
      projectBreakdown: Object.values(projectBreakdown).map((p: any) => ({
        ...p,
        hours: Math.round(p.hours * 100) / 100,
        laborCost: Math.round(p.laborCost * 100) / 100,
        laborRevenue: Math.round(p.laborRevenue * 100) / 100,
        expenses: Math.round(p.expenses * 100) / 100,
      })),
    });
  } catch (error) {
    console.error("Failed to calculate client profitability:", error);
    return NextResponse.json({ error: "Failed to calculate client profitability" }, { status: 500 });
  }
}
