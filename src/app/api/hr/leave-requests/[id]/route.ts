import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH - Approve/Reject leave request
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

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            manager: true,
            user: true
          }
        }
      }
    });

    if (!leaveRequest || leaveRequest.agencyId !== user.agencyId) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Check permissions: Manager of employee OR Admin
    const isManager = leaveRequest.employee.managerId === user.id;
    const isAdmin = ["ADMIN", "PLATFORM_ADMIN"].includes(user.role);

    if (!isManager && !isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { status, reviewNotes } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // If approving, deduct from leave balance
    if (status === "APPROVED") {
      const balanceField = leaveRequest.leaveType === "ANNUAL" 
        ? "annualLeaveBalance" 
        : "sickLeaveBalance";
      
      const currentBalance = leaveRequest.employee[balanceField];
      const newBalance = Number(currentBalance) - Number(leaveRequest.totalDays);

      if (newBalance < 0) {
        return NextResponse.json({ 
          error: "Insufficient leave balance" 
        }, { status: 400 });
      }

      // Update leave request and balance in transaction
      const [updated] = await prisma.$transaction([
        prisma.leaveRequest.update({
          where: { id: params.id },
          data: {
            status,
            reviewedBy: user.id,
            reviewedAt: new Date(),
            reviewNotes,
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
            },
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }),
        prisma.employeeProfile.update({
          where: { id: leaveRequest.employeeId },
          data: {
            [balanceField]: newBalance
          }
        })
      ]);

      return NextResponse.json(updated);
    } else {
      // Reject - no balance change
      const updated = await prisma.leaveRequest.update({
        where: { id: params.id },
        data: {
          status,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          reviewNotes,
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
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel leave request (only if PENDING and own request)
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
      select: { 
        id: true, 
        employeeProfile: { select: { id: true } }
      }
    });

    if (!user?.employeeProfile) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 403 });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id }
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Can only cancel own PENDING requests
    if (leaveRequest.employeeId !== user.employeeProfile.id) {
      return NextResponse.json({ error: "Not your leave request" }, { status: 403 });
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json({ 
        error: "Can only cancel pending requests" 
      }, { status: 400 });
    }

    await prisma.leaveRequest.update({
      where: { id: params.id },
      data: { status: "CANCELLED" }
    });

    return NextResponse.json({ message: "Leave request cancelled" });
  } catch (error) {
    console.error("Error cancelling leave request:", error);
    return NextResponse.json(
      { error: "Failed to cancel leave request" },
      { status: 500 }
    );
  }
}
