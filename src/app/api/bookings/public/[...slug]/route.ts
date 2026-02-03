import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBookingConfirmation } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { createZoomMeeting } from "@/lib/zoom";

// Helper to parse the slug - supports both /[typeSlug] and /[userSlug]/[typeSlug]
async function parseSlug(slugParts: string[]): Promise<{
  bookingType: any;
  hostUser: { id: string; name: string; email: string } | null;
  hosts: string[];
  error?: string;
}> {
  // Case 1: /book/[typeSlug] - Direct booking type slug
  if (slugParts.length === 1) {
    const typeSlug = slugParts[0];

    const bookingType = await prisma.bookingType.findUnique({
      where: { slug: typeSlug },
      include: {
        assignedUsers: {
          select: {
            userId: true,
            priority: true,
          },
        },
      },
    });

    if (!bookingType || !bookingType.isActive) {
      return { bookingType: null, hostUser: null, hosts: [], error: "Booking type not found" };
    }

    // Get host users
    const assignedHostIds = bookingType.assignedUsers.map(au => au.userId);
    let hosts: string[] = [];

    if (bookingType.specificUserId) {
      hosts = [bookingType.specificUserId];
    } else if (assignedHostIds.length > 0) {
      hosts = assignedHostIds;
    } else {
      const agencyUsers = await prisma.user.findMany({
        where: {
          agencyId: bookingType.agencyId,
          isActive: true,
          role: { in: ["ADMIN", "SUPER_ADMIN", "MANAGER", "MEMBER"] },
        },
        select: { id: true },
      });
      hosts = agencyUsers.map(u => u.id);
    }

    return { bookingType, hostUser: null, hosts };
  }

  // Case 2: /book/[userSlug]/[typeSlug] - User-prefixed booking
  if (slugParts.length === 2) {
    const [userSlug, typeSlug] = slugParts;

    // Find the user by their booking slug
    const user = await prisma.user.findFirst({
      where: { bookingSlug: userSlug },
      select: { id: true, name: true, email: true, agencyId: true },
    });

    if (!user || !user.agencyId) {
      return { bookingType: null, hostUser: null, hosts: [], error: "User not found" };
    }

    // Find the booking type by slug within the user's agency
    const bookingType = await prisma.bookingType.findFirst({
      where: {
        slug: typeSlug,
        agencyId: user.agencyId,
        isActive: true,
      },
      include: {
        assignedUsers: {
          select: {
            userId: true,
            priority: true,
          },
        },
      },
    });

    if (!bookingType) {
      return { bookingType: null, hostUser: null, hosts: [], error: "Booking type not found" };
    }

    // For user-prefixed URLs, the user IS the host
    return {
      bookingType,
      hostUser: { id: user.id, name: user.name, email: user.email },
      hosts: [user.id],
    };
  }

  return { bookingType: null, hostUser: null, hosts: [], error: "Invalid URL format" };
}

// GET - Get public booking type info and available slots (no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  try {
    const { bookingType, hostUser, hosts, error } = await parseSlug(params.slug);

    if (error || !bookingType) {
      return NextResponse.json({ error: error || "Not found" }, { status: 404 });
    }

    // Get agency info for branding and timezone
    const agency = await prisma.agency.findFirst({
      where: { id: bookingType.agencyId },
      select: { id: true, name: true, logo: true, primaryColor: true },
    });

    // Get agency availability (includes timezone)
    const agencyAvail = await prisma.agencyAvailability.findFirst({
      where: { agencyId: bookingType.agencyId },
    });
    const agencyTimezone = agencyAvail?.timezone || "Asia/Dubai";

    const hostUsers = await prisma.user.findMany({
      where: { id: { in: hosts } },
      select: { id: true, name: true },
    });

    // Base response data
    const baseResponse = {
      bookingType: {
        id: bookingType.id,
        name: bookingType.name,
        description: bookingType.description,
        duration: bookingType.duration,
        color: bookingType.color,
        questions: bookingType.questions,
        minNotice: bookingType.minNotice,
        maxFutureDays: bookingType.maxFutureDays,
      },
      agency,
      timezone: agencyTimezone,
      hosts: hostUsers,
      hostUser: hostUser ? { id: hostUser.id, name: hostUser.name } : null,
    };

    // If requesting available slots for a specific date
    if (date) {
      const slots = await getAvailableSlots(bookingType, hosts, date, agencyTimezone);
      return NextResponse.json({ ...baseResponse, date, slots });
    }

    // If requesting available days in a month
    if (month) {
      const availableDays = await getAvailableDays(bookingType, hosts, month);
      return NextResponse.json({ ...baseResponse, month, availableDays });
    }

    return NextResponse.json(baseResponse);
  } catch (error) {
    console.error("Error fetching public booking:", error);
    return NextResponse.json({ error: "Failed to fetch booking info" }, { status: 500 });
  }
}

// POST - Create a booking (public, no auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const data = await req.json();
    const { bookingType, hostUser, hosts, error } = await parseSlug(params.slug);

    if (error || !bookingType) {
      return NextResponse.json({ error: error || "Not found" }, { status: 404 });
    }

    // Get agency timezone
    const agencyAvail = await prisma.agencyAvailability.findFirst({
      where: { agencyId: bookingType.agencyId },
    });
    const agencyTimezone = agencyAvail?.timezone || "Asia/Dubai";

    // Validate required fields
    if (!data.guestName || !data.guestEmail || !data.startTime) {
      return NextResponse.json(
        { error: "Name, email, and time slot are required" },
        { status: 400 }
      );
    }

    // Determine host user
    let hostUserId: string | null = null;

    if (hostUser) {
      // User-prefixed URL - the user IS the host
      hostUserId = hostUser.id;
    } else {
      // Direct type URL - use round-robin or assignment logic
      if (hosts.length > 0) {
        if (bookingType.assignmentType === "ROUND_ROBIN" || hosts.length > 1) {
          const appointmentCounts = await prisma.bookingAppointment.groupBy({
            by: ["hostUserId"],
            where: {
              hostUserId: { in: hosts },
              status: { in: ["SCHEDULED", "CONFIRMED"] },
              startTime: { gte: new Date() },
            },
            _count: true,
          });

          const countMap = new Map(appointmentCounts.map(c => [c.hostUserId, c._count]));

          hostUserId = hosts.reduce((minUser, userId) => {
            const currentCount = countMap.get(userId) || 0;
            const minCount = countMap.get(minUser) || 0;
            return currentCount < minCount ? userId : minUser;
          }, hosts[0]);
        } else {
          hostUserId = hosts[0];
        }
      } else if (data.hostUserId) {
        hostUserId = data.hostUserId;
      }
    }

    if (!hostUserId) {
      return NextResponse.json(
        { error: "No available host for this booking" },
        { status: 400 }
      );
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + bookingType.duration * 60000);

    // Check for conflicts
    const conflictQuery = hostUser
      ? { hostUserId } // User-prefixed: check only this host
      : { agencyId: bookingType.agencyId }; // Direct: check agency-wide

    const conflict = await prisma.bookingAppointment.findFirst({
      where: {
        ...conflictQuery,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Create the appointment
    const appointment = await prisma.bookingAppointment.create({
      data: {
        agencyId: bookingType.agencyId,
        bookingTypeId: bookingType.id,
        hostUserId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone || null,
        guestCompany: data.guestCompany || null,
        clientId: data.clientId || null,
        startTime,
        endTime,
        timezone: data.guestTimezone || agencyTimezone,
        status: bookingType.requiresApproval ? "SCHEDULED" : "CONFIRMED",
        notes: data.notes || null,
        formResponses: data.formResponses || {},
      },
      include: {
        bookingType: {
          select: { name: true, duration: true },
        },
      },
    });

    // Get host info for response
    const host = hostUser || await prisma.user.findUnique({
      where: { id: hostUserId },
      select: { name: true, email: true },
    });

    // Create meeting link and calendar event
    let meetingLink = null;
    let meetingId = null;
    let calendarEventId = null;

    if (bookingType.autoCreateMeet && bookingType.locationType === "VIDEO") {
      // Check host's connected integrations to determine meeting provider
      const hostIntegrations = await prisma.user.findUnique({
        where: { id: hostUserId },
        select: {
          calendarConnected: true,
          zoomConnected: true,
        },
      });

      // Priority: Zoom > Google Meet > Fallback
      if (hostIntegrations?.zoomConnected) {
        // Try to create Zoom meeting
        try {
          const zoomResult = await createZoomMeeting({
            userId: hostUserId,
            topic: `${bookingType.name} with ${data.guestName}`,
            agenda: data.notes || `Booking created through the booking system`,
            startTime,
            duration: bookingType.duration,
            timezone: data.guestTimezone || agencyTimezone,
          });

          if (zoomResult) {
            meetingId = zoomResult.meetingId;
            meetingLink = zoomResult.joinUrl;
          }
        } catch (zoomError) {
          console.error("Error creating Zoom meeting:", zoomError);
        }
      }

      // If no Zoom meeting, try Google Meet via Calendar
      if (!meetingLink && hostIntegrations?.calendarConnected) {
        try {
          const calendarResult = await createCalendarEvent({
            userId: hostUserId,
            summary: `${bookingType.name} with ${data.guestName}`,
            description: data.notes || `Booking created through the booking system`,
            startTime,
            endTime,
            timezone: data.guestTimezone || agencyTimezone,
            attendeeEmail: data.guestEmail,
            attendeeName: data.guestName,
            createGoogleMeet: true,
          });

          if (calendarResult) {
            calendarEventId = calendarResult.eventId;
            meetingLink = calendarResult.meetLink || null;
          }
        } catch (calError) {
          console.error("Error creating calendar event:", calError);
        }
      } else if (hostIntegrations?.calendarConnected) {
        // Zoom meeting created, still create calendar event without Google Meet
        try {
          const calendarResult = await createCalendarEvent({
            userId: hostUserId,
            summary: `${bookingType.name} with ${data.guestName}`,
            description: data.notes || `Booking created through the booking system`,
            startTime,
            endTime,
            timezone: data.guestTimezone || agencyTimezone,
            attendeeEmail: data.guestEmail,
            attendeeName: data.guestName,
            meetingLink, // Pass Zoom link
            createGoogleMeet: false,
          });

          if (calendarResult) {
            calendarEventId = calendarResult.eventId;
          }
        } catch (calError) {
          console.error("Error creating calendar event:", calError);
        }
      }

      // Fallback: generate placeholder meeting link if nothing created
      if (!meetingLink) {
        meetingLink = `https://meet.google.com/${generateMeetingCode()}`;
      }

      await prisma.bookingAppointment.update({
        where: { id: appointment.id },
        data: {
          meetingLink,
          meetingId,
          calendarEventId,
        },
      });
    }

    // Get base URL for cancel/reschedule links
    const baseUrl = req.headers.get("origin") || "https://wick.omnixia.ai";
    const cancelUrl = `${baseUrl}/book/manage/${appointment.id}`;
    const rescheduleUrl = `${baseUrl}/book/manage/${appointment.id}?action=reschedule`;

    // Send confirmation emails
    if (host?.email) {
      try {
        await sendBookingConfirmation({
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          hostName: host.name,
          hostEmail: host.email,
          bookingTypeName: bookingType.name,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          timezone: data.guestTimezone || agencyTimezone,
          meetingLink: meetingLink || undefined,
          notes: data.notes,
          cancelUrl,
          rescheduleUrl,
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        bookingType: appointment.bookingType,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        meetingLink,
        host: { name: host?.name },
        timezone: agencyTimezone,
        cancelUrl,
      },
    });
  } catch (error) {
    console.error("Error creating public booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

// Helper: Get available time slots for a specific date
async function getAvailableSlots(
  bookingType: any,
  hostIds: string[],
  dateStr: string,
  agencyTimezone: string
): Promise<{ time: string; hostId: string }[]> {
  if (hostIds.length === 0) {
    return [];
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  const agencyAvail = await prisma.agencyAvailability.findFirst({
    where: { agencyId: bookingType.agencyId },
  });

  if (!agencyAvail) {
    return [];
  }

  const weeklySchedule = (agencyAvail?.weeklySchedule as any) || {};
  const daySchedule = weeklySchedule[dayOfWeek] || [];

  if (daySchedule.length === 0) {
    return [];
  }

  const startOfDayUTC = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0, 0));
  const endOfDayUTC = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59, 999));

  const existingAppointments = await prisma.bookingAppointment.findMany({
    where: {
      agencyId: bookingType.agencyId,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      startTime: { gte: startOfDayUTC, lte: endOfDayUTC },
    },
    select: {
      hostUserId: true,
      startTime: true,
      endTime: true,
    },
  });

  const slots: { time: string; hostId: string }[] = [];
  const duration = bookingType.duration;
  const bufferBefore = bookingType.bufferBefore || 0;
  const bufferAfter = bookingType.bufferAfter || 0;
  const now = new Date();
  const minNoticeTime = new Date(now.getTime() + bookingType.minNotice * 60 * 60000);

  for (const period of daySchedule) {
    const [startHour, startMin] = period.start.split(":").map(Number);
    const [endHour, endMin] = period.end.split(":").map(Number);

    let slotTime = new Date(date);
    slotTime.setHours(startHour, startMin, 0, 0);

    const periodEnd = new Date(date);
    periodEnd.setHours(endHour, endMin, 0, 0);

    while (slotTime.getTime() + duration * 60000 <= periodEnd.getTime()) {
      if (slotTime > minNoticeTime) {
        const slotEnd = new Date(slotTime.getTime() + duration * 60000);

        const timeSlotTaken = existingAppointments.some(appt => {
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(appt.endTime);
          const apptStartWithBuffer = new Date(apptStart.getTime() - bufferBefore * 60000);
          const apptEndWithBuffer = new Date(apptEnd.getTime() + bufferAfter * 60000);
          return slotTime < apptEndWithBuffer && slotEnd > apptStartWithBuffer;
        });

        if (!timeSlotTaken) {
          for (const hostId of hostIds) {
            slots.push({
              time: slotTime.toISOString(),
              hostId,
            });
            break;
          }
        }
      }

      slotTime = new Date(slotTime.getTime() + 30 * 60000);
    }
  }

  return slots;
}

// Helper: Generate a random meeting code
function generateMeetingCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const segment = () =>
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment()}-${segment()}-${segment()}`;
}

// Helper: Get days with available slots in a month
async function getAvailableDays(
  bookingType: any,
  hostIds: string[],
  monthStr: string
): Promise<string[]> {
  if (hostIds.length === 0) {
    return [];
  }

  const [year, month] = monthStr.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const now = new Date();
  const minNoticeDate = new Date(now.getTime() + bookingType.minNotice * 60 * 60000);
  const maxFutureDate = new Date(now.getTime() + bookingType.maxFutureDays * 24 * 60 * 60000);

  const agencyAvail = await prisma.agencyAvailability.findFirst({
    where: { agencyId: bookingType.agencyId },
  });

  if (!agencyAvail) {
    return [];
  }

  const weeklySchedule = (agencyAvail?.weeklySchedule as any) || {};

  const availableDays: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (currentDate >= minNoticeDate && currentDate <= maxFutureDate) {
      const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const daySchedule = weeklySchedule[dayName] || [];

      if (daySchedule.length > 0) {
        availableDays.push(currentDate.toISOString().split("T")[0]);
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableDays;
}
