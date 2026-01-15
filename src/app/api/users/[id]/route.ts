import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Get a single user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can view other users
    if (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "ADMIN" && currentUser.id !== params.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        hourlyRate: true,
        billRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PUT - Update a user
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only SUPER_ADMIN can update hourly rates
    // Users can update their own profile (but not rates)
    const body = await request.json();
    const { hourlyRate, billRate, name, role, isActive } = body;

    // Check permissions
    const isOwnProfile = currentUser.id === params.id;
    const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

    if (!isOwnProfile && !isSuperAdmin && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only SUPER_ADMIN can update rates
    if (hourlyRate !== undefined && !isSuperAdmin) {
      return NextResponse.json({ error: "Only super admins can update hourly rates" }, { status: 403 });
    }
    if (billRate !== undefined && !isSuperAdmin) {
      return NextResponse.json({ error: "Only super admins can update bill rates" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (billRate !== undefined) updateData.billRate = billRate;
    
    // Only admins can change roles and active status
    if (isSuperAdmin || currentUser.role === "ADMIN") {
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        hourlyRate: true,
        billRate: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE - Deactivate a user (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only SUPER_ADMIN can delete users
    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prevent self-deletion
    if (currentUser.id === params.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
