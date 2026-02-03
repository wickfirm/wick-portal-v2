import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get available slots for a booking type (for rescheduling)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  try {
    const bookingType = await prisma.bookingType.findUnique({
      where: { id: params.id },
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

    // Get agency timezone
    const agencyAvail = await prisma.agencyAvailability.findFirst({
      where: { agencyId: bookingType.agencyId },
    });
    const agencyTimezone = agencyAvail?.timezone || "Asia/Dubai";

    // Build list of potential hosts
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

    // If requesting available slots for a specific date
    if (date) {
      const slots = await getAvailableSlots(bookingType, hosts, date, agencyTimezone);
      return NextResponse.json({ slots });
    }

    // If requesting available days in a month
    if (month) {
      const availableDays = await getAvailableDays(bookingType, hosts, month);
      return NextResponse.json({ availableDays });
    }

    return NextResponse.json({ error: "Please specify date or month" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
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

  // Parse date string
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  // Get agency availability
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

  // Get existing appointments for this date (query wide range to handle timezone differences)
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
      if (slotTime > minNoticeTime) {
        const slotEnd = new Date(slotTime.getTime() + duration * 60000);

        // Check if ANY appointment exists at this time slot
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

  // Get agency schedule
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
