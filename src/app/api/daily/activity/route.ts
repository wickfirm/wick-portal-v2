import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/daily/activity?limit=20&offset=0
// Get team activity feed
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const type = searchParams.get("type"); // Optional filter by activity type

  try {
    const where: any = {
      visibleTo: "everyone",
    };

    if (type) {
      where.activityType = type;
    }

    const activities = await prisma.teamActivity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get reactions for these activities
    const activityIds = activities.map(a => a.id);
    const reactions = await prisma.activityReaction.findMany({
      where: {
        activityId: { in: activityIds },
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Group reactions by activity
    const reactionsMap = new Map<string, any[]>();
    reactions.forEach(reaction => {
      if (!reactionsMap.has(reaction.activityId)) {
        reactionsMap.set(reaction.activityId, []);
      }
      reactionsMap.get(reaction.activityId)!.push(reaction);
    });

    // Combine activities with reactions
    const activitiesWithReactions = activities.map(activity => ({
      ...activity,
      reactions: reactionsMap.get(activity.id) || [],
    }));

    return NextResponse.json(activitiesWithReactions);
  } catch (error) {
    console.error("Failed to fetch activity feed:", error);
    return NextResponse.json({ error: "Failed to fetch activity feed" }, { status: 500 });
  }
}

// POST /api/daily/activity/react
// Add a reaction to an activity
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const data = await req.json();
    const { activityId, reaction } = data;

    // Check if activity exists
    const activity = await prisma.teamActivity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Create or update reaction
    const activityReaction = await prisma.activityReaction.upsert({
      where: {
        activityId_userId_reaction: {
          activityId,
          userId,
          reaction,
        },
      },
      update: {},
      create: {
        activityId,
        userId,
        reaction,
      },
    });

    return NextResponse.json(activityReaction);
  } catch (error) {
    console.error("Failed to add reaction:", error);
    return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
  }
}

// DELETE /api/daily/activity/react
// Remove a reaction from an activity
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const { activityId, reaction } = await req.json();

    await prisma.activityReaction.delete({
      where: {
        activityId_userId_reaction: {
          activityId,
          userId,
          reaction,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove reaction:", error);
    return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 });
  }
}
