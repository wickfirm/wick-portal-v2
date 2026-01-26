import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch single holiday
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true },
    });

    if (!currentUser || !currentUser.agencyId) {
      return NextResponse.json({ error: "User not found or not assigned to agency" }, { status: 404 });
    }

    const holiday = await prisma.publicHoliday.findFirst({
      where: { 
        id: params.id,
        agencyId: currentUser.agencyId 
      },
    });

    if (!holiday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Error fetching holiday:", error);
    return NextResponse.json(
      { error: "Failed to fetch holiday" },
      { status: 500 }
    );
  }
}

// PATCH - Update holiday
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, role: true },
    });

    if (!currentUser || !currentUser.agencyId) {
      return NextResponse.json({ error: "User not found or not assigned to agency" }, { status: 404 });
    }

    // Only ADMIN and SUPER_ADMIN can update holidays
    if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const data = await req.json();

    // Verify holiday belongs to user's agency
    const existingHoliday = await prisma.publicHoliday.findFirst({
      where: { 
        id: params.id,
        agencyId: currentUser.agencyId 
      },
    });

    if (!existingHoliday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.numberOfDays !== undefined) updateData.numberOfDays = data.numberOfDays;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;

    const holiday = await prisma.publicHoliday.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Error updating holiday:", error);
    return NextResponse.json(
      { error: "Failed to update holiday" },
      { status: 500 }
    );
  }
}

// DELETE - Delete holiday
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, role: true },
    });

    if (!currentUser || !currentUser.agencyId) {
      return NextResponse.json({ error: "User not found or not assigned to agency" }, { status: 404 });
    }

    // Only ADMIN and SUPER_ADMIN can delete holidays
    if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Verify holiday belongs to user's agency
    const existingHoliday = await prisma.publicHoliday.findFirst({
      where: { 
        id: params.id,
        agencyId: currentUser.agencyId 
      },
    });

    if (!existingHoliday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await prisma.publicHoliday.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json(
      { error: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
