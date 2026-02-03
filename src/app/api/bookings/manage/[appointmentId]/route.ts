import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBookingCancellation, sendBookingReschedule } from "@/lib/email";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

// GET - Fetch appointment details for guest management
export async function GET(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  const { appointmentId } = params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  try {
    const appointment = await prisma.bookingAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        bookingType: {
          select: {
            id: true,
            name: true,
            duration: true,
            color: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Get host info
    const host = await prisma.user.findUnique({
      where: { id: appointment.hostUserId },
      select: { id: true, name: true, email: true },
    });

    // Simple token validation (in production, use proper tokens)
    // For now, we'll allow access without token for convenience
    // In production, generate secure tokens and validate them

    return NextResponse.json({
      id: appointment.id,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      meetingLink: appointment.meetingLink,
      bookingType: appointment.bookingType,
      host,
      guestName: appointment.guestName,
      guestEmail: appointment.guestEmail,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 });
  }
}

// PUT - Reschedule appointment (by guest)
export async function PUT(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  const { appointmentId } = params;

  try {
    const data = await req.json();
    const { newStartTime, guestTimezone } = data;

    if (!newStartTime) {
      return NextResponse.json({ error: "New time is required" }, { status: 400 });
    }

    const appointment = await prisma.bookingAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        bookingType: {
          select: {
            name: true,
            duration: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json({ error: "Appointment is cancelled" }, { status: 400 });
    }

    // Check if appointment is in the past
    if (new Date(appointment.startTime) < new Date()) {
      return NextResponse.json({ error: "Cannot reschedule past appointments" }, { status: 400 });
    }

    // Calculate new end time based on booking type duration
    const duration = appointment.bookingType?.duration || 30;
    const newStart = new Date(newStartTime);
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    // Check for conflicts
    const conflict = await prisma.bookingAppointment.findFirst({
      where: {
        agencyId: appointment.agencyId,
        id: { not: appointmentId }, // Exclude current appointment
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        startTime: { lt: newEnd },
        endTime: { gt: newStart },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Get host info for email
    const host = await prisma.user.findUnique({
      where: { id: appointment.hostUserId },
      select: { name: true, email: true },
    });

    // Store old time for email
    const oldStartTime = appointment.startTime;

    // Update Google Calendar event if exists
    if (appointment.calendarEventId) {
      try {
        await updateCalendarEvent({
          userId: appointment.hostUserId,
          eventId: appointment.calendarEventId,
          startTime: newStart,
          endTime: newEnd,
          timezone: guestTimezone || appointment.timezone,
        });
      } catch (calError) {
        console.error("Error updating calendar event:", calError);
      }
    }

    // Update appointment
    const updated = await prisma.bookingAppointment.update({
      where: { id: appointmentId },
      data: {
        startTime: newStart,
        endTime: newEnd,
        timezone: guestTimezone || appointment.timezone,
        rescheduledAt: new Date(),
      },
    });

    // Get base URL for manage links
    const baseUrl = req.headers.get("origin") || "https://wick.omnixia.ai";
    const manageUrl = `${baseUrl}/book/manage/${appointment.id}`;
    const rescheduleUrl = `${manageUrl}?action=reschedule`;
    const cancelUrl = `${manageUrl}?action=cancel`;

    // Send reschedule emails
    if (host) {
      try {
        await sendBookingReschedule({
          guestName: appointment.guestName,
          guestEmail: appointment.guestEmail,
          hostName: host.name,
          hostEmail: host.email,
          bookingTypeName: appointment.bookingType?.name || "Meeting",
          oldStartTime: new Date(oldStartTime),
          newStartTime: newStart,
          newEndTime: newEnd,
          timezone: guestTimezone || appointment.timezone,
          meetingLink: appointment.meetingLink || undefined,
          rescheduleUrl,
          cancelUrl,
        });
      } catch (emailError) {
        console.error("Error sending reschedule email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: updated.id,
        startTime: updated.startTime,
        endTime: updated.endTime,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return NextResponse.json({ error: "Failed to reschedule appointment" }, { status: 500 });
  }
}

// DELETE - Cancel appointment (by guest)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  const { appointmentId } = params;

  try {
    const data = await req.json();
    const { reason } = data;

    const appointment = await prisma.bookingAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        bookingType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json({ error: "Appointment already cancelled" }, { status: 400 });
    }

    // Check if appointment is in the past
    if (new Date(appointment.startTime) < new Date()) {
      return NextResponse.json({ error: "Cannot cancel past appointments" }, { status: 400 });
    }

    // Get host info for email
    const host = await prisma.user.findUnique({
      where: { id: appointment.hostUserId },
      select: { name: true, email: true },
    });

    // Update appointment status
    const updated = await prisma.bookingAppointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: "GUEST",
        cancellationReason: reason || null,
      },
    });

    // Send cancellation email
    if (host) {
      try {
        await sendBookingCancellation({
          guestName: appointment.guestName,
          guestEmail: appointment.guestEmail,
          hostName: host.name,
          hostEmail: host.email,
          bookingTypeName: appointment.bookingType?.name || "Meeting",
          startTime: new Date(appointment.startTime),
          timezone: appointment.timezone,
          cancelledBy: "GUEST",
          reason,
        });
      } catch (emailError) {
        console.error("Error sending cancellation email:", emailError);
      }
    }

    // Delete Google Calendar event if exists
    if (appointment.calendarEventId) {
      try {
        await deleteCalendarEvent({
          userId: appointment.hostUserId,
          eventId: appointment.calendarEventId,
        });
      } catch (calError) {
        console.error("Error deleting calendar event:", calError);
      }
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
