import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - List all employees for agency (with optional filters)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true, 
        agencyId: true 
      }
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: "User not assigned to agency" }, { status: 403 });
    }

    // Only ADMIN, MANAGER, SUPER_ADMIN, PLATFORM_ADMIN can view all employees
    const canViewAll = ["ADMIN", "SUPER_ADMIN", "MANAGER", "PLATFORM_ADMIN"].includes(user.role);
    
    if (!canViewAll) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const employmentType = searchParams.get("employmentType");
    const isActive = searchParams.get("isActive");

    const employees = await prisma.employeeProfile.findMany({
      where: {
        agencyId: user.agencyId,
        ...(department && { department }),
        ...(employmentType && { employmentType: employmentType as any }),
        ...(isActive !== null && { 
          user: { 
            isActive: isActive === "true" 
          } 
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        user: {
          name: "asc"
        }
      }
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST - Create employee profile
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true, 
        agencyId: true 
      }
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: "User not assigned to agency" }, { status: 403 });
    }

    // Only ADMIN and SUPER_ADMIN can create employee profiles
    if (!["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      employeeNumber,
      jobTitle,
      department,
      employmentType,
      weeklyCapacity,
      startDate,
      annualLeaveEntitlement,
      sickLeaveEntitlement,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      managerId
    } = body;

    // Validate user exists and belongs to same agency
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { agencyId: true }
    });

    if (!targetUser || targetUser.agencyId !== user.agencyId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    // Check if employee profile already exists
    const existing = await prisma.employeeProfile.findUnique({
      where: { userId }
    });

    if (existing) {
      return NextResponse.json({ error: "Employee profile already exists" }, { status: 400 });
    }

    const employeeProfile = await prisma.employeeProfile.create({
      data: {
        userId,
        agencyId: user.agencyId,
        employeeNumber,
        jobTitle,
        department,
        employmentType: employmentType || "FULL_TIME",
        weeklyCapacity: weeklyCapacity || 40,
        startDate: startDate ? new Date(startDate) : null,
        annualLeaveEntitlement: annualLeaveEntitlement || 21,
        sickLeaveEntitlement: sickLeaveEntitlement || 10,
        annualLeaveBalance: annualLeaveEntitlement || 21, // Start with full balance
        sickLeaveBalance: sickLeaveEntitlement || 10,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        managerId: managerId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json(employeeProfile, { status: 201 });
  } catch (error) {
    console.error("Error creating employee profile:", error);
    return NextResponse.json(
      { error: "Failed to create employee profile" },
      { status: 500 }
    );
  }
}
