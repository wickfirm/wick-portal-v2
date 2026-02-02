import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date: Date): string {
  return new Date(date).toISOString().split("T")[0];
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const weeksCount = Math.min(parseInt(searchParams.get("weeks") || "12"), 52);

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, agencyId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const canViewOthers = ["SUPER_ADMIN", "ADMIN"].includes(dbUser.role || "");
    const targetUserId = canViewOthers && userIdParam ? userIdParam : dbUser.id;

    // Calculate date range: current week + N previous weeks
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const rangeStart = new Date(currentWeekStart);
    rangeStart.setDate(rangeStart.getDate() - (weeksCount - 1) * 7);
    const rangeEnd = new Date(currentWeekStart);
    rangeEnd.setDate(rangeEnd.getDate() + 6);
    rangeEnd.setHours(23, 59, 59, 999);

    // Fetch all entries in range
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: targetUserId,
        date: { gte: rangeStart, lte: rangeEnd },
      },
      select: { date: true, duration: true, billable: true },
      orderBy: { date: "asc" },
    });

    // Group by week
    const weekMap = new Map<
      string,
      { weekStart: Date; entries: { date: Date; duration: number; billable: boolean }[] }
    >();

    // Pre-populate all weeks so we get empty ones too
    for (let i = 0; i < weeksCount; i++) {
      const ws = new Date(currentWeekStart);
      ws.setDate(ws.getDate() - i * 7);
      const key = toDateKey(ws);
      weekMap.set(key, { weekStart: ws, entries: [] });
    }

    entries.forEach((entry) => {
      const ws = getWeekStart(new Date(entry.date));
      const key = toDateKey(ws);
      const week = weekMap.get(key);
      if (week) {
        week.entries.push({ date: new Date(entry.date), duration: entry.duration, billable: entry.billable });
      }
    });

    // Build response
    const weeks = Array.from(weekMap.values())
      .map((data) => {
        const weekEnd = new Date(data.weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const totalSeconds = data.entries.reduce((sum, e) => sum + e.duration, 0);
        const billableSeconds = data.entries
          .filter((e) => e.billable)
          .reduce((sum, e) => sum + e.duration, 0);

        // Daily breakdown for sparkline (Mon-Sun)
        const dailyMap = new Map<string, number>();
        data.entries.forEach((e) => {
          const dk = toDateKey(e.date);
          dailyMap.set(dk, (dailyMap.get(dk) || 0) + e.duration);
        });

        const dailyHours: number[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(data.weekStart);
          d.setDate(d.getDate() + i);
          const dk = toDateKey(d);
          dailyHours.push(Math.round(((dailyMap.get(dk) || 0) / 3600) * 10) / 10);
        }

        return {
          weekStart: toDateKey(data.weekStart),
          weekEnd: toDateKey(weekEnd),
          totalSeconds,
          billableSeconds,
          entryCount: data.entries.length,
          dailyHours,
          hasOvertime: totalSeconds > 144000, // 40 hours
        };
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    return NextResponse.json({ weeks });
  } catch (error) {
    console.error("Error fetching timesheet history:", error);
    return NextResponse.json({ error: "Failed to fetch timesheet history" }, { status: 500 });
  }
}
