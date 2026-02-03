import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get current user's availability settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, agencyId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user availability
    let userAvailability = await prisma.userAvailability.findUnique({
      where: { userId: currentUser.id },
    });

    // Get agency availability as fallback/default
    const agencyAvailability = currentUser.agencyId
      ? await prisma.agencyAvailability.findUnique({
          where: { agencyId: currentUser.agencyId },
        })
      : null;

    return NextResponse.json({
      userAvailability,
      agencyAvailability,
      effectiveSchedule: userAvailability?.useCustomSchedule
        ? userAvailability.weeklySchedule
        : agencyAvailability?.weeklySchedule || {},
    });
  } catch (error) {
    console.error("Error fetching user availability:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

// PUT - Update current user's availability settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  try {
    const data = await req.json();

    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const availability = await prisma.userAvailability.upsert({
      where: { userId: currentUser.id },
      update: {
        timezone: data.timezone,
        useCustomSchedule: data.useCustomSchedule,
        weeklySchedule: data.weeklySchedule,
        dateOverrides: data.dateOverrides,
      },
      create: {
        userId: currentUser.id,
        timezone: data.timezone || "Asia/Dubai",
        useCustomSchedule: data.useCustomSchedule || false,
        weeklySchedule: data.weeklySchedule || {},
        dateOverrides: data.dateOverrides || {},
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error updating user availability:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
