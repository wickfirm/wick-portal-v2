// GET /api/integrations/zoom/auth - Get Zoom OAuth URL
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getZoomAuthUrl } from "@/lib/zoom";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Include user ID in state for the callback
    const state = Buffer.from(
      JSON.stringify({ userId: session.user.id })
    ).toString("base64");

    const authUrl = getZoomAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating Zoom auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
