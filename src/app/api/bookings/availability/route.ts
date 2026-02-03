import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get agency availability settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  try {
    // Get user's agency
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true },
    });

    if (!currentUser?.agencyId) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    // Get or create agency availability
    let availability = await prisma.agencyAvailability.findUnique({
      where: { agencyId: currentUser.agencyId },
    });

    if (!availability) {
      // Create default availability
      availability = await prisma.agencyAvailability.create({
        data: {
          agencyId: currentUser.agencyId,
          timezone: "Asia/Dubai",
          weeklySchedule: {
            monday: [{ start: "09:00", end: "18:00" }],
            tuesday: [{ start: "09:00", end: "18:00" }],
            wednesday: [{ start: "09:00", end: "18:00" }],
            thursday: [{ start: "09:00", end: "18:00" }],
            friday: [{ start: "09:00", end: "18:00" }],
            saturday: [],
            sunday: [],
          },
        },
      });
    }

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching agency availability:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

// PUT - Update agency availability settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  // Only admins can update agency availability
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();

    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true },
    });

    if (!currentUser?.agencyId) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const availability = await prisma.agencyAvailability.upsert({
      where: { agencyId: currentUser.agencyId },
      update: {
        timezone: data.timezone,
        weeklySchedule: data.weeklySchedule,
      },
      create: {
        agencyId: currentUser.agencyId,
        timezone: data.timezone || "Asia/Dubai",
        weeklySchedule: data.weeklySchedule || {},
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error updating agency availability:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
