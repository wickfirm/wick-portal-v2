import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = session.user as any;
  
  if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.agencyId !== undefined) updateData.agencyId = data.agencyId || null;

    // For CLIENT role, set clientId to first selected client
    if (data.role === "CLIENT" && data.clientIds && data.clientIds.length > 0) {
      updateData.clientId = data.clientIds[0];
    } else if (data.role !== "CLIENT") {
      // If changing away from CLIENT role, clear clientId
      updateData.clientId = null;
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update client assignments if provided
    if (data.clientIds !== undefined) {
      // Delete existing assignments
      await prisma.clientTeamMember.deleteMany({
        where: { userId: params.id },
      });

      // Create new assignments
      if (data.clientIds.length > 0) {
        await prisma.clientTeamMember.createMany({
          data: data.clientIds.map((clientId: string) => ({
            userId: params.id,
            clientId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = session.user as any;
  
  if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Prevent self-deletion
  if (currentUser.id === params.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
