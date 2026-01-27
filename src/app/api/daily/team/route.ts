import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/daily/team?date=YYYY-MM-DD
// Get all team members' daily summaries for a specific date
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const targetDate = new Date(date);

    // Get all users with their daily summaries
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const summaries = await prisma.dailySummary.findMany({
      where: {
        date: targetDate,
      },
    });

    // Get preferences for visibility
    const preferences = await prisma.userDailyPreference.findMany({
      where: {
        userId: { in: users.map(u => u.id) },
      },
    });

    const prefsMap = new Map(preferences.map(p => [p.userId, p]));

    // Combine user data with summaries
    const teamData = users.map(user => {
      const summary = summaries.find(s => s.userId === user.id);
      const prefs = prefsMap.get(user.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        summary: summary || {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          notStartedTasks: 0,
          completionRate: 0,
          mainFocus: null,
          status: "available",
          sodCompletedAt: null,
          eodCompletedAt: null,
        },
        preferences: {
          shareWithTeam: prefs?.shareWithTeam ?? true,
        },
      };
    });

    // Filter out users who don't want to share (unless requester is admin)
    const userRole = (session.user as any).role;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

    const filteredData = isAdmin
      ? teamData
      : teamData.filter(td => td.preferences.shareWithTeam);

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Failed to fetch team data:", error);
    return NextResponse.json({ error: "Failed to fetch team data" }, { status: 500 });
  }
}
