import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Load HR settings for agency
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Get or create default settings for agency
    let settings = await prisma.hRSettings.findUnique({
      where: { agencyId: user.agencyId }
    });

    // If no settings exist, create defaults
    if (!settings) {
      settings = await prisma.hRSettings.create({
        data: {
          agencyId: user.agencyId,
          annualLeaveEntitlement: 21,
          sickLeaveEntitlement: 10,
          weekendDays: "FRI_SAT",
          workingHoursPerDay: 8,
          carryOverEnabled: false,
          maxCarryOverDays: 5
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching HR settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch HR settings" },
      { status: 500 }
    );
  }
}

// PUT: Update HR settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Only ADMIN and SUPER_ADMIN can update settings
    if (!["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      annualLeaveEntitlement,
      sickLeaveEntitlement,
      weekendDays,
      workingHoursPerDay,
      carryOverEnabled,
      maxCarryOverDays
    } = body;

    // Validate inputs
    if (annualLeaveEntitlement < 0 || annualLeaveEntitlement > 365) {
      return NextResponse.json(
        { error: "Invalid annual leave entitlement" },
        { status: 400 }
      );
    }

    if (sickLeaveEntitlement < 0 || sickLeaveEntitlement > 365) {
      return NextResponse.json(
        { error: "Invalid sick leave entitlement" },
        { status: 400 }
      );
    }

    if (workingHoursPerDay < 1 || workingHoursPerDay > 24) {
      return NextResponse.json(
        { error: "Invalid working hours per day" },
        { status: 400 }
      );
    }

    const validWeekendDays = ["FRI_SAT", "SAT_SUN", "SUN_ONLY", "FRI_ONLY"];
    if (!validWeekendDays.includes(weekendDays)) {
      return NextResponse.json(
        { error: "Invalid weekend days" },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await prisma.hRSettings.upsert({
      where: { agencyId: user.agencyId },
      update: {
        annualLeaveEntitlement,
        sickLeaveEntitlement,
        weekendDays,
        workingHoursPerDay,
        carryOverEnabled,
        maxCarryOverDays
      },
      create: {
        agencyId: user.agencyId,
        annualLeaveEntitlement,
        sickLeaveEntitlement,
        weekendDays,
        workingHoursPerDay,
        carryOverEnabled,
        maxCarryOverDays
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating HR settings:", error);
    return NextResponse.json(
      { error: "Failed to update HR settings" },
      { status: 500 }
    );
  }
}
