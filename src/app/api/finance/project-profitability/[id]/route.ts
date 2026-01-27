import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/finance/project-profitability/[id] - Calculate project profitability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projectId = params.id;

    // Get project with client info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
            revenueModel: true,
            pricingModel: true,
            monthlyRevenue: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all time entries for this project
    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
            billRate: true,
          },
        },
      },
    });

    // Get all expenses for this project
    const expenses = await prisma.projectExpense.findMany({
      where: { projectId },
    });

    // Calculate time costs
    let totalHours = 0;
    let totalLaborCost = 0;
    let totalLaborRevenue = 0;

    // Group by user for breakdown
    const userBreakdown: Record<string, any> = {};

    timeEntries.forEach((entry) => {
      const hours = entry.duration / 3600;
      totalHours += hours;

      // Cost - Use rate snapshot if available, fallback to current rate
      const hourlyRate = Number(entry.hourlyRateAtTime) || Number(entry.user.hourlyRate) || 0;
      const cost = hours * hourlyRate;
      totalLaborCost += cost;

      // Revenue (only for billable entries)
      if (entry.billable) {
        const billRate = Number(entry.billRateAtTime) || Number(entry.user.billRate) || 0;
        const revenue = hours * billRate;
        totalLaborRevenue += revenue;
      }

      // Track per-user
      if (!userBreakdown[entry.userId]) {
        userBreakdown[entry.userId] = {
          userId: entry.userId,
          userName: entry.user.name,
          hours: 0,
          cost: 0,
          revenue: 0,
        };
      }
      userBreakdown[entry.userId].hours += hours;
      userBreakdown[entry.userId].cost += cost;
      if (entry.billable) {
        const billRate = Number(entry.billRateAtTime) || Number(entry.user.billRate) || 0;
        userBreakdown[entry.userId].revenue += hours * billRate;
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
    });

    // Determine final revenue based on pricing model
    let finalRevenue = 0;
    
    // Check if client uses CLIENT_LEVEL revenue model
    if (project.client.revenueModel === "CLIENT_LEVEL") {
      // For client-level, we can't determine this project's share
      // We'll just show T&M calculated revenue for now
      finalRevenue = totalLaborRevenue + totalExpenseRevenue;
    } else {
      // Project-based revenue
      if (project.pricingModel === "FIXED_FEE" && project.fixedFeeAmount) {
        finalRevenue = Number(project.fixedFeeAmount);
      } else {
        // TIME_AND_MATERIALS
        finalRevenue = totalLaborRevenue + totalExpenseRevenue;
      }
    }

    // Total calculations
    const totalCost = totalLaborCost + totalExpenseCost;
    const profitAmount = finalRevenue - totalCost;
    const profitMargin = finalRevenue > 0 ? (profitAmount / finalRevenue) * 100 : 0;

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        pricingModel: project.pricingModel,
        fixedFeeAmount: project.fixedFeeAmount ? Number(project.fixedFeeAmount) : null,
      },
      client: {
        id: project.client.id,
        name: project.client.name,
        nickname: project.client.nickname,
        revenueModel: project.client.revenueModel,
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
        total: Math.round(finalRevenue * 100) / 100,
      },
      profit: {
        amount: Math.round(profitAmount * 100) / 100,
        margin: Math.round(profitMargin * 100) / 100,
      },
      userBreakdown: Object.values(userBreakdown).map((u: any) => ({
        ...u,
        hours: Math.round(u.hours * 100) / 100,
        cost: Math.round(u.cost * 100) / 100,
        revenue: Math.round(u.revenue * 100) / 100,
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        isBillable: e.isBillable,
        markupPercentage: e.markupPercentage ? Number(e.markupPercentage) : null,
        billedAmount: e.isBillable 
          ? Number(e.amount) * (1 + (Number(e.markupPercentage) || 0) / 100)
          : Number(e.amount),
      })),
    });
  } catch (error) {
    console.error("Failed to calculate project profitability:", error);
    return NextResponse.json({ error: "Failed to calculate project profitability" }, { status: 500 });
  }
}
