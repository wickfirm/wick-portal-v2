import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get a specific booking type
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    if (!bookingType) {
      return NextResponse.json({ error: "Booking type not found" }, { status: 404 });
    }

    // Get user details for assigned users
    const userIds = bookingType.assignedUsers.map(au => au.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return NextResponse.json({
      ...bookingType,
      assignedUsers: bookingType.assignedUsers.map(au => ({
        ...au,
        user: userMap.get(au.userId),
      })),
    });
  } catch (error) {
    console.error("Error fetching booking type:", error);
    return NextResponse.json({ error: "Failed to fetch booking type" }, { status: 500 });
  }
}

// PUT - Update a booking type
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();

    // Update booking type
    const bookingType = await prisma.bookingType.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        duration: data.duration,
        color: data.color,
        bufferBefore: data.bufferBefore,
        bufferAfter: data.bufferAfter,
        minNotice: data.minNotice,
        maxFutureDays: data.maxFutureDays,
        isActive: data.isActive,
        requiresApproval: data.requiresApproval,
        locationType: data.locationType,
        locationDetails: data.locationDetails,
        autoCreateMeet: data.autoCreateMeet,
        assignmentType: data.assignmentType,
        specificUserId: data.specificUserId,
        questions: data.questions,
      },
    });

    // Update assigned users if provided
    if (data.assignedUserIds !== undefined) {
      // Remove existing
      await prisma.bookingTypeUser.deleteMany({
        where: { bookingTypeId: params.id },
      });

      // Add new
      if (data.assignedUserIds.length > 0) {
        await prisma.bookingTypeUser.createMany({
          data: data.assignedUserIds.map((userId: string, index: number) => ({
            bookingTypeId: params.id,
            userId,
            priority: index,
          })),
        });
      }
    }

    return NextResponse.json(bookingType);
  } catch (error) {
    console.error("Error updating booking type:", error);
    return NextResponse.json({ error: "Failed to update booking type" }, { status: 500 });
  }
}

// DELETE - Delete a booking type
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Check for existing appointments
    const appointmentCount = await prisma.bookingAppointment.count({
      where: {
        bookingTypeId: params.id,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    });

    if (appointmentCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete booking type with upcoming appointments" },
        { status: 400 }
      );
    }

    await prisma.bookingType.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking type:", error);
    return NextResponse.json({ error: "Failed to delete booking type" }, { status: 500 });
  }
}
