import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/finance/task-profitability/[id] - Calculate task profitability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const taskId = params.id;

    // Get task with client and project info
    const task = await prisma.clientTask.findUnique({
      where: { id: taskId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            nickname: true,
            billRate: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            billRate: true,
            pricingModel: true,
            fixedFeeAmount: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get all time entries for this task
    const timeEntries = await prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
            billRate: true,
          },
        },
      },
    });

    // Calculate time costs and revenue per user
    const userBreakdown: Record<string, any> = {};
    let totalHours = 0;
    let totalCost = 0;
    let totalRevenue = 0;

    timeEntries.forEach((entry) => {
      const hours = entry.duration / 3600; // Convert seconds to hours
      totalHours += hours;

      // Cost = hours × hourly rate at time of logging
      const hourlyRate = Number(entry.hourlyRateAtTime) || Number(entry.user.hourlyRate) || 0;
      const userCost = hours * hourlyRate;
      totalCost += userCost;

      // Revenue = hours × bill rate (only if billable)
      let userRevenue = 0;
      if (entry.billable) {
        const billRate = 
          Number(entry.billRateAtTime) || 
          Number(entry.user.billRate) || 
          Number(task.project?.billRate) || 
          Number(task.client.billRate) || 
          0;
        userRevenue = hours * billRate;
        totalRevenue += userRevenue;
      }

      // Track per-user breakdown
      if (!userBreakdown[entry.user.id]) {
        userBreakdown[entry.user.id] = {
          userId: entry.user.id,
          userName: entry.user.name,
          userEmail: entry.user.email,
          hours: 0,
          cost: 0,
          revenue: 0,
        };
      }

      userBreakdown[entry.user.id].hours += hours;
      userBreakdown[entry.user.id].cost += userCost;
      userBreakdown[entry.user.id].revenue += userRevenue;
    });

    // Calculate profitability
    const profitAmount = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profitAmount / totalRevenue) * 100 : 0;

    return NextResponse.json({
      task: {
        id: task.id,
        name: task.name,
        status: task.status,
        priority: task.priority,
        client: task.client,
        project: task.project,
      },
      hours: {
        total: Math.round(totalHours * 100) / 100,
      },
      costs: {
        labor: Math.round(totalCost * 100) / 100,
      },
      revenue: {
        labor: Math.round(totalRevenue * 100) / 100,
      },
      profit: {
        amount: Math.round(profitAmount * 100) / 100,
        margin: Math.round(profitMargin * 100) / 100,
      },
      userBreakdown: Object.values(userBreakdown).map((user: any) => ({
        ...user,
        hours: Math.round(user.hours * 100) / 100,
        cost: Math.round(user.cost * 100) / 100,
        revenue: Math.round(user.revenue * 100) / 100,
      })),
    });
  } catch (error) {
    console.error("Failed to calculate task profitability:", error);
    return NextResponse.json({ error: "Failed to calculate task profitability" }, { status: 500 });
  }
}
