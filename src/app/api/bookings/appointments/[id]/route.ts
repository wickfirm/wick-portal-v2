import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get a specific appointment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const appointment = await prisma.bookingAppointment.findUnique({
      where: { id: params.id },
      include: {
        bookingType: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Get host details
    const host = await prisma.user.findUnique({
      where: { id: appointment.hostUserId },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ ...appointment, host });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 });
  }
}

// PUT - Update an appointment (reschedule, update notes, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    const appointment = await prisma.bookingAppointment.findUnique({
      where: { id: params.id },
      include: { bookingType: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updateData: any = {};

    // Handle rescheduling
    if (data.startTime) {
      const newStartTime = new Date(data.startTime);
      const newEndTime = new Date(
        newStartTime.getTime() + appointment.bookingType.duration * 60000
      );
      updateData.startTime = newStartTime;
      updateData.endTime = newEndTime;
      updateData.status = "RESCHEDULED";
    }

    // Handle status changes
    if (data.status) {
      updateData.status = data.status;
      if (data.status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = data.cancelledBy || "HOST";
        updateData.cancellationReason = data.cancellationReason;
      }
    }

    // Update other fields
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink;
    if (data.location !== undefined) updateData.location = data.location;

    const updated = await prisma.bookingAppointment.update({
      where: { id: params.id },
      data: updateData,
      include: { bookingType: true },
    });

    // TODO: Send reschedule/cancellation email
    // TODO: Update calendar event

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

// DELETE - Cancel an appointment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const reason = searchParams.get("reason");

  try {
    const appointment = await prisma.bookingAppointment.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: "HOST",
        cancellationReason: reason,
      },
    });

    // TODO: Send cancellation email
    // TODO: Delete calendar event

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
