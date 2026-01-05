import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = session.user as any;
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admin can manage agencies" }, { status: 403 });
  }

  try {
    const data = await req.json();

    const agency = await prisma.agency.update({
      where: { id: params.id },
      data: {
        name: data.name,
        isDefault: data.isDefault,
        updatedAt: new Date(),
      },
    });

    // If this is set as default, unset others
    if (data.isDefault) {
      await prisma.agency.updateMany({
        where: { id: { not: agency.id } },
        data: { isDefault: false },
      });
    }

    return NextResponse.json(agency);
  } catch (error) {
    console.error("Failed to update agency:", error);
    return NextResponse.json({ error: "Failed to update agency" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = session.user as any;
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admin can manage agencies" }, { status: 403 });
  }

  try {
    // Check if any clients are using this agency
    const clientCount = await prisma.client.count({
      where: { agencyId: params.id },
    });

    if (clientCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete agency. ${clientCount} client(s) are assigned to it.` 
      }, { status: 400 });
    }

    await prisma.agency.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete agency:", error);
    return NextResponse.json({ error: "Failed to delete agency" }, { status: 500 });
  }
}
