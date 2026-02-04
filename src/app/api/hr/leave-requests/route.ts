import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendLeaveRequestNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

// Calculate working days between two dates (excluding weekends)
function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDay();
    // Skip Friday (5) and Saturday (6) for UAE
    // Change to Saturday (6) and Sunday (0) for standard weekend
    if (day !== 5 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// GET - List leave requests (filtered by user role)
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
        agencyId: true,
        employeeProfile: {
          select: { id: true }
        }
      }
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: "User not assigned to agency" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    // Build where clause based on role
    let whereClause: any = { agencyId: user.agencyId };

    // MEMBER can only see their own requests
    if (user.role === "MEMBER") {
      if (!user.employeeProfile) {
        return NextResponse.json({ leaveRequests: [] });
      }
      whereClause.employeeId = user.employeeProfile.id;
    }
    // MANAGER can see their team's requests + own
    else if (user.role === "MANAGER") {
      const managedEmployees = await prisma.employeeProfile.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      
      const managedIds = managedEmployees.map(e => e.id);
      if (user.employeeProfile) {
        managedIds.push(user.employeeProfile.id);
      }
      
      whereClause.employeeId = { in: managedIds };
    }
    // ADMIN can see all in agency
    // (no additional filter needed)

    // Apply additional filters
    if (status) {
      whereClause.status = status;
    }
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        requestedAt: "desc"
      }
    });

    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}

// POST - Create leave request
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
        agencyId: true,
        employeeProfile: true
      }
    });

    if (!user?.employeeProfile) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 403 });
    }

    const body = await request.json();
    const {
      leaveType,
      startDate,
      endDate,
      reason
    } = body;

    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    // Calculate working days
    const totalDays = calculateWorkingDays(start, end);

    // Check if user has enough leave balance
    const balanceField = leaveType === "ANNUAL" ? "annualLeaveBalance" : "sickLeaveBalance";
    const currentBalance = user.employeeProfile[balanceField];

    if (Number(currentBalance) < totalDays) {
      return NextResponse.json({ 
        error: `Insufficient ${leaveType.toLowerCase()} leave balance. You have ${currentBalance} days, but requested ${totalDays} days.` 
      }, { status: 400 });
    }

    // Get user details for email
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true }
    });

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: user.employeeProfile.id,
        agencyId: user.agencyId!,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: "PENDING",
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    // Send email notification to management
    const MANAGEMENT_EMAIL = "management@thewickfirm.com";
    const approvalUrl = `https://wick.omnixia.ai/dashboard/hr?tab=leaves`;

    try {
      await sendLeaveRequestNotification({
        employeeName: userDetails?.name || "Employee",
        employeeEmail: userDetails?.email || "",
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        managementEmail: MANAGEMENT_EMAIL,
        approvalUrl,
      });
      console.log(`📧 Leave request notification sent to ${MANAGEMENT_EMAIL}`);
    } catch (emailError) {
      console.error("Failed to send leave request email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: "Failed to create leave request" },
      { status: 500 }
    );
  }
}
