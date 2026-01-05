import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamMembers = await prisma.clientTeamMember.findMany({
    where: { clientId: params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { assignedAt: "asc" },
  });

  return NextResponse.json(teamMembers);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = session.user as any;
  
  // Only SUPER_ADMIN and ADMIN can assign team members
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Not authorized to assign team members" }, { status: 403 });
  }

  // If ADMIN, check they are assigned to this client
  if (user.role === "ADMIN") {
    const isAssigned = await prisma.clientTeamMember.findFirst({
      where: { clientId: params.id, userId: user.id },
    });
    if (!isAssigned) {
      return NextResponse.json({ error: "You are not assigned to this client" }, { status: 403 });
    }
  }

  try {
    const data = await req.json();
    const { userIds } = data;

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "userIds must be an array" }, { status: 400 });
    }

    // Get current assignments
    const currentAssignments = await prisma.clientTeamMember.findMany({
      where: { clientId: params.id },
      select: { userId: true },
    });
    const currentUserIds = currentAssignments.map(a => a.userId);

    // Determine additions and removals
    const toAdd = userIds.filter((id: string) => !currentUserIds.includes(id));
    const toRemove = currentUserIds.filter(id => !userIds.includes(id));

    // Remove old assignments
    if (toRemove.length > 0) {
      await prisma.clientTeamMember.deleteMany({
        where: {
          clientId: params.id,
          userId: { in: toRemove },
        },
      });
    }

    // Add new assignments
    if (toAdd.length > 0) {
      await prisma.clientTeamMember.createMany({
        data: toAdd.map((userId: string) => ({
          clientId: params.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    // Return updated list
    const teamMembers = await prisma.clientTeamMember.findMany({
      where: { clientId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}
