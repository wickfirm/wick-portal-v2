import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // "YYYY-MM"
    const userIdParam = searchParams.get("userId");

    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json({ error: "month parameter required (YYYY-MM)" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, agencyId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const canViewOthers = ["SUPER_ADMIN", "ADMIN"].includes(dbUser.role || "");
    const targetUserId = canViewOthers && userIdParam ? userIdParam : dbUser.id;

    // Calculate 6-week grid range around the month
    const [year, month] = monthParam.split("-").map(Number);
    const firstOfMonth = new Date(year, month - 1, 1);
    const gridStart = startOfWeek(firstOfMonth);
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridEnd.getDate() + 41); // 6 weeks = 42 days
    gridEnd.setHours(23, 59, 59, 999);

    // Query all time entries in the grid range
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: targetUserId,
        date: { gte: gridStart, lte: gridEnd },
      },
      select: { date: true, duration: true },
    });

    // Aggregate by date
    const dailyTotals: Record<string, number> = {};
    entries.forEach((e) => {
      const dateKey = new Date(e.date).toISOString().split("T")[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + e.duration;
    });

    return NextResponse.json({ dailyTotals });
  } catch (error) {
    console.error("Error fetching calendar activity:", error);
    return NextResponse.json({ error: "Failed to fetch calendar activity" }, { status: 500 });
  }
}
