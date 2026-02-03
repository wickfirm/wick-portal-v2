// Google Calendar integration for booking appointments
// Handles OAuth, event creation, updates, and deletions

import { google, calendar_v3 } from "googleapis";
import prisma from "@/lib/prisma";

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/integrations/google/callback"
);

// Scopes required for calendar operations
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

// Generate OAuth URL for user authorization
export function getGoogleAuthUrl(state?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}> {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens as {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  };
}

// Get authenticated calendar client for a user
async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
      calendarConnected: true,
    },
  });

  if (!user?.calendarConnected || !user.googleAccessToken) {
    return null;
  }

  // Set credentials
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken || undefined,
    expiry_date: user.googleTokenExpiry?.getTime(),
  });

  // Check if token is expired and refresh if needed
  if (user.googleTokenExpiry && new Date() >= user.googleTokenExpiry) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: credentials.access_token,
          googleRefreshToken: credentials.refresh_token || user.googleRefreshToken,
          googleTokenExpiry: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : null,
        },
      });

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("Failed to refresh Google token:", error);
      // Mark calendar as disconnected
      await prisma.user.update({
        where: { id: userId },
        data: { calendarConnected: false },
      });
      return null;
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Create a calendar event for a booking
export async function createCalendarEvent({
  userId,
  summary,
  description,
  startTime,
  endTime,
  timezone,
  attendeeEmail,
  attendeeName,
  meetingLink,
  createGoogleMeet = true,
}: {
  userId: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  attendeeEmail: string;
  attendeeName: string;
  meetingLink?: string;
  createGoogleMeet?: boolean;
}): Promise<{ eventId: string; meetLink?: string } | null> {
  const calendar = await getCalendarClient(userId);

  if (!calendar) {
    console.log("Google Calendar not connected for user:", userId);
    return null;
  }

  try {
    const event: calendar_v3.Schema$Event = {
      summary,
      description: description || `Meeting with ${attendeeName}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: timezone,
      },
      attendees: [
        { email: attendeeEmail, displayName: attendeeName },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    // Add Google Meet if requested and no external meeting link provided
    if (createGoogleMeet && !meetingLink) {
      event.conferenceData = {
        createRequest: {
          requestId: `booking-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    // If external meeting link provided, add it to description
    if (meetingLink) {
      event.description = `${event.description}\n\nMeeting Link: ${meetingLink}`;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarId: true },
    });

    const calendarId = user?.googleCalendarId || "primary";

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: createGoogleMeet && !meetingLink ? 1 : 0,
      sendUpdates: "all", // Send email invitations to attendees
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri;

    return {
      eventId: response.data.id || "",
      meetLink: meetLink || undefined,
    };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

// Update a calendar event (for rescheduling)
export async function updateCalendarEvent({
  userId,
  eventId,
  summary,
  description,
  startTime,
  endTime,
  timezone,
}: {
  userId: string;
  eventId: string;
  summary?: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
}): Promise<boolean> {
  const calendar = await getCalendarClient(userId);

  if (!calendar) {
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarId: true },
    });

    const calendarId = user?.googleCalendarId || "primary";

    const updateData: calendar_v3.Schema$Event = {
      start: {
        dateTime: startTime.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: timezone,
      },
    };

    if (summary) updateData.summary = summary;
    if (description) updateData.description = description;

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updateData,
      sendUpdates: "all",
    });

    return true;
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return false;
  }
}

// Delete a calendar event (for cancellations)
export async function deleteCalendarEvent({
  userId,
  eventId,
}: {
  userId: string;
  eventId: string;
}): Promise<boolean> {
  const calendar = await getCalendarClient(userId);

  if (!calendar) {
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarId: true },
    });

    const calendarId = user?.googleCalendarId || "primary";

    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });

    return true;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }
}

// Get user's busy times for availability checking
export async function getUserBusyTimes({
  userId,
  startTime,
  endTime,
  timezone,
}: {
  userId: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
}): Promise<{ start: Date; end: Date }[]> {
  const calendar = await getCalendarClient(userId);

  if (!calendar) {
    return [];
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarId: true },
    });

    const calendarId = user?.googleCalendarId || "primary";

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        timeZone: timezone,
        items: [{ id: calendarId }],
      },
    });

    const busyTimes = response.data.calendars?.[calendarId]?.busy || [];

    return busyTimes.map((busy) => ({
      start: new Date(busy.start || ""),
      end: new Date(busy.end || ""),
    }));
  } catch (error) {
    console.error("Error fetching busy times:", error);
    return [];
  }
}

// Disconnect Google Calendar for a user
export async function disconnectGoogleCalendar(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        calendarConnected: false,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null,
      },
    });
    return true;
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return false;
  }
}

// Save OAuth tokens for a user
export async function saveGoogleTokens({
  userId,
  accessToken,
  refreshToken,
  expiryDate,
}: {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
}): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        calendarConnected: true,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken || undefined,
        googleTokenExpiry: expiryDate ? new Date(expiryDate) : null,
      },
    });
    return true;
  } catch (error) {
    console.error("Error saving Google tokens:", error);
    return false;
  }
}
