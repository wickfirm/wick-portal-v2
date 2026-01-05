// Force rebuild v3 - with access control

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  let clients: any[];

  // SUPER_ADMIN sees all clients
  if (user.role === "SUPER_ADMIN") {
    clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        projects: true,
        agency: true,
        teamMembers: {
          include: { user: { select: { id: true, name: true } } }
        }
      },
    });
  } 
  // ADMIN and MEMBER see only assigned clients
  else if (["ADMIN", "MEMBER"].includes(user.role)) {
    clients = await prisma.client.findMany({
      where: {
        teamMembers: {
          some: { userId: user.id }
        }
      },
      orderBy: { createdAt: "desc" },
      include: { 
        projects: true,
        agency: true,
        teamMembers: {
          include: { user: { select: { id: true, name: true } } }
        }
      },
    });
  }
  // CLIENT role - handled separately
  else {
    clients = [];
  }

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  // Only SUPER_ADMIN and ADMIN can create clients
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Not authorized to create clients" }, { status: 403 });
  }

  try {
    const data = await req.json();

    const client = await prisma.client.create({
      data: {
        name: data.name,
        nickname: data.nickname || null,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        website: data.website || null,
        industry: data.industry || null,
        status: data.status || "LEAD",
        notes: data.notes || null,
        primaryContact: data.primaryContact || null,
        primaryEmail: data.primaryEmail || null,
        monthlyRetainer: data.monthlyRetainer ? parseFloat(data.monthlyRetainer) : null,
        agencyId: data.agencyId || null,
      },
    });

    // Auto-assign the creator to this client
    await prisma.clientTeamMember.create({
      data: {
        clientId: client.id,
        userId: user.id,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
