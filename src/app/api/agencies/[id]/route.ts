import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      users: true,
    },
  });

  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  return NextResponse.json(agency);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const agency = await prisma.agency.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
      },
    });

    return NextResponse.json(agency);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update agency" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Remove agency assignment from all users first
    await prisma.user.updateMany({
      where: { agencyId: id },
      data: { agencyId: null },
    });

    // Delete the agency
    await prisma.agency.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete agency" }, { status: 500 });
  }
}
