import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const data = await req.json();

  try {
    // If updating another user, must be admin
    if (data.userId && data.userId !== user.id) {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Only admins can update other users" }, { status: 403 });
      }
    }

    const targetUserId = data.userId || user.id;
    const updateData: any = {};

    // Name can be updated by anyone for themselves, or by admin for anyone
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    // Email can only be updated by admin
    if (data.email !== undefined) {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Only admins can update email addresses" }, { status: 403 });
      }
      // Check if email is already taken
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: targetUserId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      updateData.email = data.email;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { ...updateData, updatedAt: new Date() },
    });

    return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
