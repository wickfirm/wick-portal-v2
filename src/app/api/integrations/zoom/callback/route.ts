// GET /api/integrations/zoom/callback - Handle Zoom OAuth callback
import { NextRequest, NextResponse } from "next/server";
import { getZoomTokensFromCode, saveZoomTokens } from "@/lib/zoom";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Base URL for redirects
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (error) {
    console.error("Zoom OAuth error:", error);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=zoom_auth_failed`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=missing_params`
    );
  }

  try {
    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    const userId = stateData.userId;

    if (!userId) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=invalid_state`
      );
    }

    // Exchange code for tokens
    const tokens = await getZoomTokensFromCode(code);

    // Save tokens to database
    const saved = await saveZoomTokens({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    if (!saved) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=save_failed`
      );
    }

    // Success - redirect to integrations page
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?success=zoom_connected`
    );
  } catch (error) {
    console.error("Error processing Zoom callback:", error);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=callback_failed`
    );
  }
}
