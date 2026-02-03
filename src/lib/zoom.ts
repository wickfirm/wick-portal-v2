// Zoom integration for booking appointments
// Handles OAuth, meeting creation, updates, and deletions

import prisma from "@/lib/prisma";

// Zoom OAuth configuration
const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize";
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_URL = "https://api.zoom.us/v2";

// Scopes required for meeting operations
const SCOPES = ["meeting:write:admin", "meeting:read:admin", "user:read:admin"];

// Generate OAuth URL for user authorization
export function getZoomAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOOM_CLIENT_ID || "",
    redirect_uri: process.env.ZOOM_REDIRECT_URI || "http://localhost:3000/api/integrations/zoom/callback",
    state: state || "",
  });

  return `${ZOOM_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function getZoomTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.ZOOM_REDIRECT_URI || "http://localhost:3000/api/integrations/zoom/callback",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens");
  }

  return response.json();
}

// Refresh access token
async function refreshZoomToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await fetch(ZOOM_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error refreshing Zoom token:", error);
    return null;
  }
}

// Get valid access token for a user (refreshing if necessary)
async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      zoomAccessToken: true,
      zoomRefreshToken: true,
      zoomTokenExpiry: true,
      zoomConnected: true,
    },
  });

  if (!user?.zoomConnected || !user.zoomAccessToken) {
    return null;
  }

  // Check if token is expired (with 5 min buffer)
  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);

  if (user.zoomTokenExpiry && expiryBuffer >= user.zoomTokenExpiry) {
    // Token is expired or about to expire, refresh it
    if (!user.zoomRefreshToken) {
      await prisma.user.update({
        where: { id: userId },
        data: { zoomConnected: false },
      });
      return null;
    }

    const newTokens = await refreshZoomToken(user.zoomRefreshToken);
    if (!newTokens) {
      await prisma.user.update({
        where: { id: userId },
        data: { zoomConnected: false },
      });
      return null;
    }

    // Update tokens in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        zoomAccessToken: newTokens.access_token,
        zoomRefreshToken: newTokens.refresh_token,
        zoomTokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
      },
    });

    return newTokens.access_token;
  }

  return user.zoomAccessToken;
}

// Create a Zoom meeting for a booking
export async function createZoomMeeting({
  userId,
  topic,
  agenda,
  startTime,
  duration,
  timezone,
}: {
  userId: string;
  topic: string;
  agenda?: string;
  startTime: Date;
  duration: number; // in minutes
  timezone: string;
}): Promise<{ meetingId: string; joinUrl: string; password: string } | null> {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    console.log("Zoom not connected for user:", userId);
    return null;
  }

  try {
    const response = await fetch(`${ZOOM_API_URL}/users/me/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration,
        timezone,
        agenda,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: false,
          waiting_room: false,
          auto_recording: "none",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Zoom API error:", error);
      return null;
    }

    const meeting = await response.json();

    return {
      meetingId: meeting.id.toString(),
      joinUrl: meeting.join_url,
      password: meeting.password,
    };
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    return null;
  }
}

// Update a Zoom meeting
export async function updateZoomMeeting({
  userId,
  meetingId,
  topic,
  startTime,
  duration,
  timezone,
}: {
  userId: string;
  meetingId: string;
  topic?: string;
  startTime: Date;
  duration: number;
  timezone: string;
}): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    return false;
  }

  try {
    const response = await fetch(`${ZOOM_API_URL}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        topic,
        start_time: startTime.toISOString(),
        duration,
        timezone,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error updating Zoom meeting:", error);
    return false;
  }
}

// Delete a Zoom meeting
export async function deleteZoomMeeting({
  userId,
  meetingId,
}: {
  userId: string;
  meetingId: string;
}): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    return false;
  }

  try {
    const response = await fetch(`${ZOOM_API_URL}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok || response.status === 404; // 404 means already deleted
  } catch (error) {
    console.error("Error deleting Zoom meeting:", error);
    return false;
  }
}

// Disconnect Zoom for a user
export async function disconnectZoom(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        zoomConnected: false,
        zoomAccessToken: null,
        zoomRefreshToken: null,
        zoomTokenExpiry: null,
        zoomUserId: null,
      },
    });
    return true;
  } catch (error) {
    console.error("Error disconnecting Zoom:", error);
    return false;
  }
}

// Save Zoom OAuth tokens for a user
export async function saveZoomTokens({
  userId,
  accessToken,
  refreshToken,
  expiresIn,
}: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        zoomConnected: true,
        zoomAccessToken: accessToken,
        zoomRefreshToken: refreshToken,
        zoomTokenExpiry: new Date(Date.now() + expiresIn * 1000),
      },
    });
    return true;
  } catch (error) {
    console.error("Error saving Zoom tokens:", error);
    return false;
  }
}
