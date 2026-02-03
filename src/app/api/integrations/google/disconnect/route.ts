// POST /api/integrations/google/disconnect - Disconnect Google Calendar
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { disconnectGoogleCalendar } from "@/lib/google-calendar";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disconnected = await disconnectGoogleCalendar(session.user.id);

    if (!disconnected) {
      return NextResponse.json(
        { error: "Failed to disconnect" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
