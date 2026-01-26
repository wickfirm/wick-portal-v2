import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch all holidays for the agency
export async function GET() {
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

    const holidays = await prisma.publicHoliday.findMany({
      where: { agencyId: currentUser.agencyId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json(
      { error: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}

// POST - Create a new holiday
export async function POST(req: Request) {
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

    // Only ADMIN and SUPER_ADMIN can create holidays
    if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const data = await req.json();

    const holiday = await prisma.publicHoliday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        numberOfDays: data.numberOfDays || 1,
        country: data.country || "AE",
        status: data.status || "UNTOUCHABLE",
        description: data.description || null,
        isRecurring: data.isRecurring ?? true,
        agencyId: currentUser.agencyId,
      },
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json(
      { error: "Failed to create holiday" },
      { status: 500 }
    );
  }
}
