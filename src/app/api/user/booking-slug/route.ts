import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get current user's booking slug
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { bookingSlug: true },
    });

    return NextResponse.json({ bookingSlug: user?.bookingSlug || null });
  } catch (error) {
    console.error("Error fetching booking slug:", error);
    return NextResponse.json({ error: "Failed to fetch booking slug" }, { status: 500 });
  }
}

// PUT - Update current user's booking slug
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { bookingSlug } = data;

    // Validate slug format if provided
    if (bookingSlug) {
      // Must be lowercase letters, numbers, and dashes only
      if (!/^[a-z0-9-]+$/.test(bookingSlug)) {
        return NextResponse.json(
          { error: "URL can only contain lowercase letters, numbers, and dashes" },
          { status: 400 }
        );
      }

      // Minimum length
      if (bookingSlug.length < 3) {
        return NextResponse.json(
          { error: "URL must be at least 3 characters" },
          { status: 400 }
        );
      }

      // Maximum length
      if (bookingSlug.length > 50) {
        return NextResponse.json(
          { error: "URL must be less than 50 characters" },
          { status: 400 }
        );
      }

      // Check if slug is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          bookingSlug,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "This URL is already taken. Please choose a different one." },
          { status: 409 }
        );
      }
    }

    // Update user's booking slug
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { bookingSlug: bookingSlug || null },
      select: { bookingSlug: true },
    });

    return NextResponse.json({ bookingSlug: updatedUser.bookingSlug });
  } catch (error) {
    console.error("Error updating booking slug:", error);
    return NextResponse.json({ error: "Failed to update booking slug" }, { status: 500 });
  }
}
