import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify the partner agency belongs to this tenant
    const existing = await prisma.partnerAgency.findFirst({
      where: {
        id: params.id,
        agencyId: user.agencyId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Partner agency not found" }, { status: 404 });
    }

    const data = await req.json();

    const updated = await prisma.partnerAgency.update({
      where: { id: params.id },
      data: {
        name: data.name,
        isDefault: data.isDefault,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update partner agency:", error);
    return NextResponse.json({ error: "Failed to update partner agency" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify the partner agency belongs to this tenant
    const existing = await prisma.partnerAgency.findFirst({
      where: {
        id: params.id,
        agencyId: user.agencyId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Partner agency not found" }, { status: 404 });
    }

    await prisma.partnerAgency.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete partner agency:", error);
    return NextResponse.json({ error: "Failed to delete partner agency" }, { status: 500 });
  }
}
