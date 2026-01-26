import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Bulk import holidays
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

    // Only ADMIN and SUPER_ADMIN can import holidays
    if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { holidays, replaceExisting } = await req.json();

    if (!Array.isArray(holidays)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    // If replaceExisting is true, delete all existing holidays first
    if (replaceExisting) {
      await prisma.publicHoliday.deleteMany({
        where: { agencyId: currentUser.agencyId },
      });
    }

    // Import holidays
    for (const holiday of holidays) {
      try {
        await prisma.publicHoliday.create({
          data: {
            name: holiday.name,
            date: new Date(holiday.date),
            numberOfDays: holiday.numberOfDays || 1,
            country: holiday.country || "AE",
            status: holiday.status || "UNTOUCHABLE",
            description: holiday.description || null,
            isRecurring: holiday.isRecurring ?? true,
            agencyId: currentUser.agencyId,
          },
        });
        imported++;
      } catch (error) {
        console.error("Error importing holiday:", holiday.name, error);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: holidays.length,
    });
  } catch (error) {
    console.error("Error importing holidays:", error);
    return NextResponse.json(
      { error: "Failed to import holidays" },
      { status: 500 }
    );
  }
}
