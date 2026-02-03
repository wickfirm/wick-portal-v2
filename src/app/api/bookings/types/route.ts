import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List all booking types for agency
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true },
    });

    if (!currentUser?.agencyId) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    const bookingTypes = await prisma.bookingType.findMany({
      where: { agencyId: currentUser.agencyId },
      include: {
        assignedUsers: {
          select: {
            userId: true,
            priority: true,
          },
        },
        _count: {
          select: {
            appointments: {
              where: {
                status: { in: ["SCHEDULED", "CONFIRMED"] },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get user names for assigned users
    const userIds = bookingTypes.flatMap(bt => bt.assignedUsers.map(au => au.userId));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const typesWithUsers = bookingTypes.map(bt => ({
      ...bt,
      assignedUsers: bt.assignedUsers.map(au => ({
        ...au,
        user: userMap.get(au.userId),
      })),
    }));

    return NextResponse.json(typesWithUsers);
  } catch (error) {
    console.error("Error fetching booking types:", error);
    return NextResponse.json({ error: "Failed to fetch booking types" }, { status: 500 });
  }
}

// POST - Create a new booking type
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();

    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true },
    });

    if (!currentUser?.agencyId) {
      return NextResponse.json({ error: "No agency found" }, { status: 404 });
    }

    // Generate slug from name
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for existing slug and append number if needed
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.bookingType.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const bookingType = await prisma.bookingType.create({
      data: {
        agencyId: currentUser.agencyId,
        name: data.name,
        slug,
        description: data.description || null,
        duration: data.duration || 30,
        color: data.color || "#76527c",
        bufferBefore: data.bufferBefore || 0,
        bufferAfter: data.bufferAfter || 15,
        minNotice: data.minNotice || 24,
        maxFutureDays: data.maxFutureDays || 60,
        isActive: data.isActive ?? true,
        requiresApproval: data.requiresApproval || false,
        locationType: data.locationType || "VIDEO",
        locationDetails: data.locationDetails || null,
        autoCreateMeet: data.autoCreateMeet ?? true,
        assignmentType: data.assignmentType || "ROUND_ROBIN",
        specificUserId: data.specificUserId || null,
        questions: data.questions || [],
      },
    });

    // If assigned users provided, create relationships
    if (data.assignedUserIds && data.assignedUserIds.length > 0) {
      await prisma.bookingTypeUser.createMany({
        data: data.assignedUserIds.map((userId: string, index: number) => ({
          bookingTypeId: bookingType.id,
          userId,
          priority: index,
        })),
      });
    }

    return NextResponse.json(bookingType);
  } catch (error) {
    console.error("Error creating booking type:", error);
    return NextResponse.json({ error: "Failed to create booking type" }, { status: 500 });
  }
}
