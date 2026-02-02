import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Get single employee profile
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { id: params.id },
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
        },
        leaveRequests: {
          orderBy: {
            startDate: "desc"
          },
          take: 10,
          include: {
            reviewer: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!employeeProfile) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Check access: own profile, manager, or admin
    const isOwnProfile = employeeProfile.userId === user.id;
    const isManager = employeeProfile.managerId === user.id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(user.role);

    if (!isOwnProfile && !isManager && !isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return NextResponse.json(employeeProfile);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

// PATCH - Update employee profile
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Only ADMIN and SUPER_ADMIN can update employee profiles
    if (!["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { id: params.id },
      select: { agencyId: true }
    });

    if (!employeeProfile || employeeProfile.agencyId !== user.agencyId) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      employeeNumber,
      jobTitle,
      department,
      employmentType,
      weeklyCapacity,
      startDate,
      endDate,
      annualLeaveEntitlement,
      sickLeaveEntitlement,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      managerId
    } = body;

    const updated = await prisma.employeeProfile.update({
      where: { id: params.id },
      data: {
        ...(employeeNumber !== undefined && { employeeNumber }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(department !== undefined && { department }),
        ...(employmentType !== undefined && { employmentType }),
        ...(weeklyCapacity !== undefined && { weeklyCapacity }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(annualLeaveEntitlement !== undefined && { annualLeaveEntitlement }),
        ...(sickLeaveEntitlement !== undefined && { sickLeaveEntitlement }),
        ...(emergencyContactName !== undefined && { emergencyContactName }),
        ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
        ...(emergencyContactRelation !== undefined && { emergencyContactRelation }),
        ...(managerId !== undefined && { managerId: managerId || null }),
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE - Delete employee profile
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, agencyId: true }
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: "User not assigned to agency" }, { status: 403 });
    }

    // Only ADMIN, SUPER_ADMIN can delete employees
    if (!["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const employee = await prisma.employeeProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true } }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (employee.agencyId !== user.agencyId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete employee profile (cascade will delete related records)
    await prisma.employeeProfile.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: `Employee profile for ${employee.user.name} deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
