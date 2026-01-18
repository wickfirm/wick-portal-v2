import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  if (user.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Platform admin access required" }, { status: 403 });
  }

  try {
    // Get all agencies
    const agencies = await prisma.agency.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        agency: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Recent signups (last 10)
    const recentSignups = users.slice(0, 10).map(u => ({
      email: u.email,
      name: u.name || "Unknown",
      agency: u.agency?.name || "No tenant",
      createdAt: u.createdAt,
    }));

    // Agency breakdown
    const agencyBreakdown = agencies.map(agency => ({
      agencyName: agency.name,
      userCount: agency._count.users,
      activeCount: users.filter(u => u.agencyId === agency.id && u.isActive).length,
    }));

    const stats = {
      totalAgencies: agencies.length,
      activeAgencies: agencies.filter(a => a.isActive).length,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      recentSignups,
      agencyBreakdown,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
