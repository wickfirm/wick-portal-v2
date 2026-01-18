import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get current user's agency
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { agencyId: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: "No agency assigned" }, { status: 400 });
    }

    // Get partner agencies for this tenant only
    const partnerAgencies = await prisma.partnerAgency.findMany({
      where: {
        agencyId: user.agencyId,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return NextResponse.json(partnerAgencies);
  } catch (error) {
    console.error("Failed to fetch partner agencies:", error);
    return NextResponse.json({ error: "Failed to fetch partner agencies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = session.user as any;

  if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    // Get current user's agency
    const user = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { agencyId: true },
    });

    if (!user?.agencyId) {
      return NextResponse.json({ error: "No agency assigned" }, { status: 400 });
    }

    const data = await req.json();

    // Create partner agency for this tenant
    const partnerAgency = await prisma.partnerAgency.create({
      data: {
        name: data.name,
        isDefault: data.isDefault || false,
        agencyId: user.agencyId,  // Link to current user's agency
      },
    });

    return NextResponse.json(partnerAgency);
  } catch (error) {
    console.error("Failed to create partner agency:", error);
    return NextResponse.json({ error: "Failed to create partner agency" }, { status: 500 });
  }
}
