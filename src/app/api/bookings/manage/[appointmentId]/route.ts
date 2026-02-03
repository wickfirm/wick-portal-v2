import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBookingCancellation } from "@/lib/email";

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

    // TODO: Delete Google Calendar event if exists
    // if (appointment.calendarEventId) {
    //   await deleteCalendarEvent(appointment.calendarEventId);
    // }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
