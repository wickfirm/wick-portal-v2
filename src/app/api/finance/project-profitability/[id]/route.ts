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

    // Get project with budget and pricing model
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
            billRate: true,
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

    // Calculate time costs and revenue
    let totalHours = 0;
    let totalCost = 0;
    let totalRevenue = 0;

    timeEntries.forEach((entry) => {
      const hours = entry.duration / 3600; // Convert seconds to hours
      totalHours += hours;

      // Cost = hours × hourly rate at time of logging (or current if not set)
      const hourlyRate = Number(entry.hourlyRateAtTime) || Number(entry.user.hourlyRate) || 0;
      const userCost = hours * hourlyRate;
      totalCost += userCost;

      // Revenue = hours × bill rate (only if billable)
      if (entry.billable) {
        // Use snapshot rate first, then fallback to current rates
        const billRate = 
          Number(entry.billRateAtTime) || 
          Number(entry.user.billRate) || 
          Number(project.billRate) || 
          Number(project.client.billRate) || 
          0;
        totalRevenue += hours * billRate;
      }
    });

    // Calculate expense costs and revenue
    let totalExpenseCost = 0;
    let totalExpenseRevenue = 0;

    expenses.forEach((expense) => {
      const amount = Number(expense.amount);
      totalExpenseCost += amount;

      // If expense is billable, add markup to revenue
      if (expense.isBillable) {
        const markup = Number(expense.markupPercentage) || 0;
        const revenueAmount = amount * (1 + markup / 100);
        totalExpenseRevenue += revenueAmount;
      }
    });

    // Handle Fixed Fee vs Time & Materials pricing
    let finalRevenue = totalRevenue + totalExpenseRevenue;
    
    if (project.pricingModel === "FIXED_FEE" && project.fixedFeeAmount) {
      // For fixed fee, revenue is the fixed amount
      finalRevenue = Number(project.fixedFeeAmount);
    }

    // Total calculations
    const totalProjectCost = totalCost + totalExpenseCost;
    const profitAmount = finalRevenue - totalProjectCost;
    const profitMargin = finalRevenue > 0 ? (profitAmount / finalRevenue) * 100 : 0;

    // Budget utilization
    const budget = Number(project.budget) || 0;
    const budgetUtilization = budget > 0 ? (finalRevenue / budget) * 100 : 0;

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        budget,
        pricingModel: project.pricingModel,
        fixedFeeAmount: project.fixedFeeAmount ? Number(project.fixedFeeAmount) : null,
        client: project.client,
      },
      hours: {
        total: Math.round(totalHours * 100) / 100,
      },
      costs: {
        labor: Math.round(totalCost * 100) / 100,
        expenses: Math.round(totalExpenseCost * 100) / 100,
        total: Math.round(totalProjectCost * 100) / 100,
      },
      revenue: {
        labor: project.pricingModel === "FIXED_FEE" ? 0 : Math.round(totalRevenue * 100) / 100,
        expenses: Math.round(totalExpenseRevenue * 100) / 100,
        fixedFee: project.pricingModel === "FIXED_FEE" && project.fixedFeeAmount ? Number(project.fixedFeeAmount) : 0,
        total: Math.round(finalRevenue * 100) / 100,
      },
      profit: {
        amount: Math.round(profitAmount * 100) / 100,
        margin: Math.round(profitMargin * 100) / 100,
      },
      budget: {
        allocated: budget,
        used: Math.round(finalRevenue * 100) / 100,
        utilization: Math.round(budgetUtilization * 100) / 100,
        remaining: Math.round((budget - finalRevenue) * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Failed to calculate profitability:", error);
    return NextResponse.json({ error: "Failed to calculate profitability" }, { status: 500 });
  }
}
