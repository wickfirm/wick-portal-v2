import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Get time entries for the client user's client
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true },
    });
    if (!user || !user.client) {
      return NextResponse.json({ error: "No client linked" }, { status: 404 });
    }
    // Check if time is enabled for this client
    if (!user.client.showTimeInPortal) {
      return NextResponse.json({ enabled: false, timeEntries: [], total: 0 });
    }
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    // Build where clause
    const where: any = {
      clientId: user.client.id,
    };
    if (projectId) {
      where.projectId = projectId;
    }
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });
    // Calculate totals by project
    const byProject: Record<string, { project: any; total: number }> = {};
    
    timeEntries.forEach((entry) => {
      if (!byProject[entry.projectId]) {
        byProject[entry.projectId] = {
          project: entry.project,
          total: 0,
        };
      }
      byProject[entry.projectId].total += entry.duration;
    });
    const totalTime = timeEntries.reduce((sum, e) => sum + e.duration, 0);
    return NextResponse.json({
      enabled: true,
      timeEntries: timeEntries.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        duration: e.duration,
        description: e.description,
        user: e.user,
        project: e.project,
        task: e.task,
      })),
      byProject: Object.values(byProject),
      total: totalTime,
    });
  } catch (error) {
    console.error("Error fetching portal time:", error);
    return NextResponse.json({ error: "Failed to fetch time data" }, { status: 500 });
  }
}
