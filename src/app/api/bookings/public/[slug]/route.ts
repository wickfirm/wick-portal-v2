import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get public booking type info and available slots (no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // Optional: specific date to get slots for
  const month = searchParams.get("month"); // Optional: YYYY-MM to get available days

  try {
    const bookingType = await prisma.bookingType.findUnique({
      where: { slug: params.slug },
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
      return NextResponse.json({ error: "Booking type not found" }, { status: 404 });
    }

    // Get agency info for branding
    const agency = await prisma.agency.findFirst({
      where: { id: bookingType.agencyId },
      select: { id: true, name: true, logo: true, primaryColor: true },
    });

    // Get host users info
    const assignedHostIds = bookingType.assignedUsers.map(au => au.userId);
    let hosts: string[] = [];

    if (bookingType.specificUserId) {
      hosts = [bookingType.specificUserId];
    } else if (assignedHostIds.length > 0) {
      hosts = assignedHostIds;
    } else {
      // Fallback: use all active users from the agency as potential hosts
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

    const hostUsers = await prisma.user.findMany({
      where: { id: { in: hosts } },
      select: { id: true, name: true },
    });

    // If requesting available slots for a specific date
    if (date) {
      const slots = await getAvailableSlots(bookingType, hosts, date);
      return NextResponse.json({
        bookingType: {
          id: bookingType.id,
          name: bookingType.name,
          description: bookingType.description,
          duration: bookingType.duration,
          color: bookingType.color,
          questions: bookingType.questions,
        },
        agency,
        hosts: hostUsers,
        date,
        slots,
      });
    }

    // If requesting available days in a month
    if (month) {
      const availableDays = await getAvailableDays(bookingType, hosts, month);
      return NextResponse.json({
        bookingType: {
          id: bookingType.id,
          name: bookingType.name,
          description: bookingType.description,
          duration: bookingType.duration,
          color: bookingType.color,
          questions: bookingType.questions,
        },
        agency,
        hosts: hostUsers,
        month,
        availableDays,
      });
    }

    // Return basic booking type info
    return NextResponse.json({
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
      hosts: hostUsers,
    });
  } catch (error) {
    console.error("Error fetching public booking:", error);
    return NextResponse.json({ error: "Failed to fetch booking info" }, { status: 500 });
  }
}

// POST - Create a booking (public, no auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const data = await req.json();

    const bookingType = await prisma.bookingType.findUnique({
      where: { slug: params.slug },
      include: {
        assignedUsers: {
          orderBy: { priority: "asc" },
        },
      },
    });

    if (!bookingType || !bookingType.isActive) {
      return NextResponse.json({ error: "Booking type not found" }, { status: 404 });
    }

    // Validate required fields
    if (!data.guestName || !data.guestEmail || !data.startTime) {
      return NextResponse.json(
        { error: "Name, email, and time slot are required" },
        { status: 400 }
      );
    }

    // Determine host user
    let hostUserId: string | null = null;

    // Build list of potential hosts
    let potentialHosts: string[] = [];
    if (bookingType.specificUserId) {
      potentialHosts = [bookingType.specificUserId];
    } else if (bookingType.assignedUsers.length > 0) {
      potentialHosts = bookingType.assignedUsers.map((au: any) => au.userId);
    } else {
      // Fallback: use all active users from the agency
      const agencyUsers = await prisma.user.findMany({
        where: {
          agencyId: bookingType.agencyId,
          isActive: true,
          role: { in: ["ADMIN", "SUPER_ADMIN", "MANAGER", "MEMBER"] },
        },
        select: { id: true },
      });
      potentialHosts = agencyUsers.map(u => u.id);
    }

    if (potentialHosts.length > 0) {
      if (bookingType.assignmentType === "ROUND_ROBIN" || potentialHosts.length > 1) {
        // Get the user with the least upcoming appointments (round-robin)
        const appointmentCounts = await prisma.bookingAppointment.groupBy({
          by: ["hostUserId"],
          where: {
            hostUserId: { in: potentialHosts },
            status: { in: ["SCHEDULED", "CONFIRMED"] },
            startTime: { gte: new Date() },
          },
          _count: true,
        });

        const countMap = new Map(appointmentCounts.map(c => [c.hostUserId, c._count]));

        // Find user with lowest count (or first user if none have appointments)
        hostUserId = potentialHosts.reduce((minUser, userId) => {
          const currentCount = countMap.get(userId) || 0;
          const minCount = countMap.get(minUser) || 0;
          return currentCount < minCount ? userId : minUser;
        }, potentialHosts[0]);
      } else {
        hostUserId = potentialHosts[0];
      }
    } else if (data.hostUserId) {
      hostUserId = data.hostUserId;
    }

    if (!hostUserId) {
      return NextResponse.json(
        { error: "No available host for this booking" },
        { status: 400 }
      );
    }

    // Validate the time slot is still available
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + bookingType.duration * 60000);

    // Check for conflicts
    const conflict = await prisma.bookingAppointment.findFirst({
      where: {
        hostUserId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
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
        timezone: data.timezone || "Asia/Dubai",
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
    const host = await prisma.user.findUnique({
      where: { id: hostUserId },
      select: { name: true, email: true },
    });

    // TODO: Send confirmation emails to guest and host
    // TODO: Create calendar event

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        bookingType: appointment.bookingType,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        host: { name: host?.name },
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
  dateStr: string
): Promise<{ time: string; hostId: string }[]> {
  // If no hosts, no slots available
  if (hostIds.length === 0) {
    console.log("[getAvailableSlots] No hosts provided");
    return [];
  }

  // Parse date string as local date (not UTC)
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  // Get agency availability
  const agencyAvail = await prisma.agencyAvailability.findFirst({
    where: { agencyId: bookingType.agencyId },
  });

  if (!agencyAvail) {
    console.log("[getAvailableSlots] No agency availability found for agencyId:", bookingType.agencyId);
    return [];
  }

  const weeklySchedule = (agencyAvail?.weeklySchedule as any) || {};
  const daySchedule = weeklySchedule[dayOfWeek] || [];

  console.log("[getAvailableSlots] Day:", dayOfWeek, "Schedule:", daySchedule, "Hosts:", hostIds.length);

  if (daySchedule.length === 0) {
    return [];
  }

  // Get existing appointments for this date
  // Use UTC date range to match database timestamps
  const startOfDayUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const endOfDayUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // Also query with local date range as fallback (in case appointments were saved with local time)
  const startOfDayLocal = new Date(date);
  startOfDayLocal.setHours(0, 0, 0, 0);
  const endOfDayLocal = new Date(date);
  endOfDayLocal.setHours(23, 59, 59, 999);

  // Use the wider range to catch all appointments
  const startOfDay = startOfDayUTC < startOfDayLocal ? startOfDayUTC : startOfDayLocal;
  const endOfDay = endOfDayUTC > endOfDayLocal ? endOfDayUTC : endOfDayLocal;

  const existingAppointments = await prisma.bookingAppointment.findMany({
    where: {
      hostUserId: { in: hostIds },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      startTime: { gte: startOfDay, lte: endOfDay },
    },
    select: {
      hostUserId: true,
      startTime: true,
      endTime: true,
    },
  });

  console.log("[getAvailableSlots] Query range:", startOfDay.toISOString(), "to", endOfDay.toISOString());
  console.log("[getAvailableSlots] Existing appointments for date:", dateStr, existingAppointments.map(a => ({
    host: a.hostUserId,
    start: a.startTime,
    end: a.endTime
  })));

  // Generate available slots
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
      // Check if slot is in the future with min notice
      if (slotTime > minNoticeTime) {
        const slotEnd = new Date(slotTime.getTime() + duration * 60000);

        // Check each host for availability
        for (const hostId of hostIds) {
          const isConflict = existingAppointments.some(appt => {
            if (appt.hostUserId !== hostId) return false;
            const apptStart = new Date(appt.startTime);
            const apptEnd = new Date(appt.endTime);
            // Add buffer time
            apptStart.setMinutes(apptStart.getMinutes() - bufferBefore);
            apptEnd.setMinutes(apptEnd.getMinutes() + bufferAfter);
            return slotTime < apptEnd && slotEnd > apptStart;
          });

          if (!isConflict) {
            slots.push({
              time: slotTime.toISOString(),
              hostId,
            });
            break; // Only need one available host per slot
          }
        }
      }

      // Move to next slot (30-min increments)
      slotTime = new Date(slotTime.getTime() + 30 * 60000);
    }
  }

  return slots;
}

// Helper: Get days with available slots in a month
async function getAvailableDays(
  bookingType: any,
  hostIds: string[],
  monthStr: string // YYYY-MM
): Promise<string[]> {
  if (hostIds.length === 0) {
    console.log("[getAvailableDays] No hosts provided");
    return [];
  }

  const [year, month] = monthStr.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const now = new Date();
  const minNoticeDate = new Date(now.getTime() + bookingType.minNotice * 60 * 60000);
  const maxFutureDate = new Date(now.getTime() + bookingType.maxFutureDays * 24 * 60 * 60000);

  // Get agency schedule
  const agencyAvail = await prisma.agencyAvailability.findFirst({
    where: { agencyId: bookingType.agencyId },
  });

  if (!agencyAvail) {
    console.log("[getAvailableDays] No agency availability found for agencyId:", bookingType.agencyId);
    return [];
  }

  const weeklySchedule = (agencyAvail?.weeklySchedule as any) || {};
  console.log("[getAvailableDays] Agency schedule keys:", Object.keys(weeklySchedule), "MinNotice:", bookingType.minNotice, "hours, MaxFuture:", bookingType.maxFutureDays, "days");

  const availableDays: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Check if date is within allowed range
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
