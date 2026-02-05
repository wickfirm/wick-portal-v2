import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch activity timeline for a task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch task modifications (activity log)
    const activities = await prisma.taskModification.findMany({
      where: { taskId: params.id },
      orderBy: { modifiedAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get unique user IDs to fetch user info
    const userIds = [...new Set(activities.map(a => a.modifiedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, { id: string; name: string; email: string }>);

    // Format activities with user info
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.changeType,
      oldValue: activity.oldValue,
      newValue: activity.newValue,
      notes: activity.notes,
      timestamp: activity.modifiedAt,
      user: userMap[activity.modifiedBy] || { id: activity.modifiedBy, name: "Unknown", email: "" },
    }));

    // Get total count for pagination
    const total = await prisma.taskModification.count({
      where: { taskId: params.id },
    });

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

// Helper function to format activity messages
export function formatActivityMessage(activity: {
  type: string;
  oldValue?: string | null;
  newValue?: string | null;
  user: { name: string };
}): string {
  const { type, oldValue, newValue, user } = activity;

  switch (type) {
    case "status":
      return `${user.name} changed status from "${oldValue}" to "${newValue}"`;
    case "priority":
      return `${user.name} changed priority from "${oldValue}" to "${newValue}"`;
    case "assignee":
      if (!oldValue && newValue) return `${user.name} assigned this task`;
      if (oldValue && !newValue) return `${user.name} unassigned this task`;
      return `${user.name} reassigned this task`;
    case "dueDate":
      if (!oldValue && newValue) return `${user.name} set due date to ${newValue}`;
      if (oldValue && !newValue) return `${user.name} removed the due date`;
      return `${user.name} changed due date from ${oldValue} to ${newValue}`;
    case "name":
      return `${user.name} renamed task from "${oldValue}" to "${newValue}"`;
    case "comment_added":
      return `${user.name} added a comment`;
    case "comment_deleted":
      return `${user.name} deleted a comment`;
    case "attachment_added":
      return `${user.name} added attachment "${newValue}"`;
    case "attachment_removed":
      return `${user.name} removed attachment "${oldValue}"`;
    case "created":
      return `${user.name} created this task`;
    case "watcher_added":
      return `${user.name} started watching`;
    case "watcher_removed":
      return `${user.name} stopped watching`;
    default:
      return `${user.name} made a change`;
  }
}
