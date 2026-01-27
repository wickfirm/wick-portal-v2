import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/daily/summary?date=YYYY-MM-DD&userId=xxx
// Get daily summary for a user on a specific date
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const userId = searchParams.get("userId") || (session.user as any).id;
  const userRole = (session.user as any).role;

  // Only allow viewing own data unless admin/super_admin
  if (userId !== (session.user as any).id && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = await prisma.dailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
    });

    return NextResponse.json(summary || null);
  } catch (error) {
    console.error("Failed to fetch daily summary:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}

// POST /api/daily/summary
// Create or update daily summary
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const data = await req.json();
    const {
      date,
      mainFocus,
      status,
      notes,
      sodCompleted,
      eodCompleted,
    } = data;

    const summaryDate = date ? new Date(date) : new Date();
    summaryDate.setHours(0, 0, 0, 0);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (mainFocus !== undefined) updateData.mainFocus = mainFocus;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (sodCompleted) updateData.sodCompletedAt = new Date();
    if (eodCompleted) updateData.eodCompletedAt = new Date();

    const summary = await prisma.dailySummary.upsert({
      where: {
        userId_date: {
          userId,
          date: summaryDate,
        },
      },
      update: updateData,
      create: {
        userId,
        date: summaryDate,
        ...updateData,
      },
    });

    // Create team activity if SOD or EOD completed
    if (sodCompleted || eodCompleted) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await prisma.teamActivity.create({
        data: {
          userId,
          activityType: sodCompleted ? "sod" : "eod",
          content: sodCompleted
            ? `${user?.name} started the day`
            : `${user?.name} finished the day`,
          metadata: {
            mainFocus: mainFocus,
            totalTasks: summary.totalTasks,
            completedTasks: summary.completedTasks,
            completionRate: summary.completionRate,
          },
        },
      });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to update daily summary:", error);
    return NextResponse.json({ error: "Failed to update summary" }, { status: 500 });
  }
}
