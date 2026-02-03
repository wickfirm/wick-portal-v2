import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List appointments
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, agencyId: true, role: true },
    });

    if (!currentUser?.agencyId) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const hostId = searchParams.get("hostId");

    const where: any = { agencyId: currentUser.agencyId };

    // Non-admins only see their own appointments
    if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(currentUser.role || "")) {
      where.hostUserId = currentUser.id;
    } else if (hostId) {
      where.hostUserId = hostId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate) {
      where.startTime = { ...where.startTime, gte: new Date(startDate) };
    }

    if (endDate) {
      where.startTime = { ...where.startTime, lte: new Date(endDate) };
    }

    const appointments = await prisma.bookingAppointment.findMany({
      where,
      include: {
        bookingType: {
          select: {
            id: true,
            name: true,
            duration: true,
            color: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Get host user details
    const hostIds = [...new Set(appointments.map(a => a.hostUserId))];
    const hosts = await prisma.user.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, name: true, email: true },
    });
    const hostMap = new Map(hosts.map(h => [h.id, h]));

    const appointmentsWithHosts = appointments.map(a => ({
      ...a,
      host: hostMap.get(a.hostUserId),
    }));

    return NextResponse.json(appointmentsWithHosts);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

// POST - Create a new appointment (internal booking by team)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  try {
    const data = await req.json();

    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, agencyId: true },
    });

    if (!currentUser?.agencyId) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const bookingType = await prisma.bookingType.findUnique({
      where: { id: data.bookingTypeId },
    });

    if (!bookingType) {
      return NextResponse.json({ error: "Booking type not found" }, { status: 404 });
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + bookingType.duration * 60000);

    const appointment = await prisma.bookingAppointment.create({
      data: {
        agencyId: currentUser.agencyId,
        bookingTypeId: data.bookingTypeId,
        hostUserId: data.hostUserId || currentUser.id,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone || null,
        guestCompany: data.guestCompany || null,
        clientId: data.clientId || null,
        startTime,
        endTime,
        timezone: data.timezone || "Asia/Dubai",
        status: bookingType.requiresApproval ? "SCHEDULED" : "CONFIRMED",
        location: data.location || null,
        notes: data.notes || null,
        formResponses: data.formResponses || {},
      },
      include: {
        bookingType: true,
      },
    });

    // TODO: Send confirmation email
    // TODO: Create calendar event

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
