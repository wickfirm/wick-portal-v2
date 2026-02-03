// GET /api/integrations/google/callback - Handle OAuth callback
import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode, saveGoogleTokens } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Base URL for redirects - use production URL as fallback
  const baseUrl = process.env.NEXTAUTH_URL || "https://wick.omnixia.ai";

  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=google_auth_failed`
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
    const tokens = await getTokensFromCode(code);

    // Save tokens to database
    const saved = await saveGoogleTokens({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });

    if (!saved) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=save_failed`
      );
    }

    // Success - redirect to integrations page
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?success=google_connected`
    );
  } catch (error) {
    console.error("Error processing Google callback:", error);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=callback_failed`
    );
  }
}
