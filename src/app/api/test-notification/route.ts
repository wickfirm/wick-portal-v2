/**
 * POST /api/test-notification
 * Creates a test notification for the current user
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a test notification
    await createNotification({
      userId: session.user.id,
      type: "TASK_ASSIGNED",
      category: "TASK",
      priority: "HIGH",
      title: "🎉 Test Notification Created!",
      message: "This is a test notification from Phase 2. If you can see this, the notification system is working!",
      link: "/tasks",
      metadata: {
        test: true,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Test notification created! Check the bell icon." 
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
    return NextResponse.json(
      { error: "Failed to create test notification" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(); // Allow GET for easy browser testing
}
