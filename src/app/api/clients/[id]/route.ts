import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to check if user has access to client
async function hasClientAccess(userId: string, clientId: string, role: string): Promise<boolean> {
  if (role === "SUPER_ADMIN") return true;
  
  const assignment = await prisma.clientTeamMember.findFirst({
    where: { clientId, userId },
  });
  
  return !!assignment;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  // Check access
  if (user.role !== "SUPER_ADMIN") {
    const hasAccess = await hasClientAccess(user.id, params.id, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
include: {
      projects: true,
      agencies: {
        include: { agency: true }
      },
      teamMembers: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } }
      }
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Hide budget fields for non-SUPER_ADMIN
  if (user.role !== "SUPER_ADMIN") {
    const clientWithoutBudget = { ...client, monthlyRetainer: null };
    return NextResponse.json(clientWithoutBudget);
  }

  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  // Check access
  if (user.role !== "SUPER_ADMIN") {
    const hasAccess = await hasClientAccess(user.id, params.id, user.role);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  try {
    const data = await req.json();

    const updateData: any = {
      name: data.name,
      nickname: data.nickname,
      email: data.email,
      phone: data.phone,
      company: data.company,
      website: data.website,
      industry: data.industry,
      status: data.status,
      notes: data.notes,
      primaryContact: data.primaryContact,
      primaryEmail: data.primaryEmail,
      agencyId: data.agencyId || null,
      updatedAt: new Date(),
    };

    // Only SUPER_ADMIN can update budget
    if (user.role === "SUPER_ADMIN" && data.monthlyRetainer !== undefined) {
      updateData.monthlyRetainer = data.monthlyRetainer ? parseFloat(data.monthlyRetainer) : null;
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
      include: { agency: true },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to update client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  // Only SUPER_ADMIN can delete clients
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admin can delete clients" }, { status: 403 });
  }

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
