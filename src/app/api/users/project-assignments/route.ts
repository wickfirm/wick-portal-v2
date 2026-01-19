import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/users/[userId]/project-assignments
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projectAssignments = await prisma.projectAssignment.findMany({
      where: { userId: params.userId },
      include: {
        project: {
          include: {
            client: {
              select: { id: true, name: true, nickname: true }
            }
          }
        }
      }
    });

    return NextResponse.json(projectAssignments);
  } catch (error) {
    console.error("Failed to fetch project assignments:", error);
    return NextResponse.json({ error: "Failed to fetch project assignments" }, { status: 500 });
  }
}

// PUT /api/users/[userId]/project-assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { projectIds } = await request.json();

    // Delete existing assignments
    await prisma.projectAssignment.deleteMany({
      where: { userId: params.userId }
    });

    // Create new assignments
    if (projectIds && projectIds.length > 0) {
      await prisma.projectAssignment.createMany({
        data: projectIds.map((projectId: string) => ({
          id: `pa-${params.userId}-${projectId}-${Date.now()}`,
          userId: params.userId,
          projectId,
          role: 'MEMBER',
          createdAt: new Date(),
        }))
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update project assignments:", error);
    return NextResponse.json({ error: "Failed to update project assignments" }, { status: 500 });
  }
}
