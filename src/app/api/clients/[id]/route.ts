import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const clientId = params.id;

  if (user.role !== "SUPER_ADMIN") {
    const assignment = await prisma.clientTeamMember.findFirst({
      where: { clientId, userId: user.id },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Not authorized to view this client" }, { status: 403 });
    }
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: {
        include: {
          stages: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      agencies: {
        include: { agency: true }
      },
      teamMembers: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const clientId = params.id;

  if (user.role !== "SUPER_ADMIN") {
    const assignment = await prisma.clientTeamMember.findFirst({
      where: { clientId, userId: user.id },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Not authorized to update this client" }, { status: 403 });
    }
  }

  try {
    const data = await req.json();
    
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.nickname !== undefined) updateData.nickname = data.nickname || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.company !== undefined) updateData.company = data.company || null;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.industry !== undefined) updateData.industry = data.industry || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.primaryContact !== undefined) updateData.primaryContact = data.primaryContact || null;
    if (data.primaryEmail !== undefined) updateData.primaryEmail = data.primaryEmail || null;
    if (data.monthlyRetainer !== undefined) updateData.monthlyRetainer = data.monthlyRetainer ? parseFloat(data.monthlyRetainer) : null;
    if (data.showTimeInPortal !== undefined) updateData.showTimeInPortal = Boolean(data.showTimeInPortal);

    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      include: { 
        agencies: {
          include: { agency: true }
        }
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to update client:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not authorized to delete clients" }, { status: 403 });
  }

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
