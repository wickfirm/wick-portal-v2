// Force rebuild v5 - with proper multi-agency isolation

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  // Get user's full data including agencyId
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, role: true, agencyId: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let clients: any[];

  // External partners (agencyId = NULL) see ALL clients where they're personally assigned
  if (currentUser.agencyId === null) {
    clients = await prisma.client.findMany({
      where: {
        teamMembers: {
          some: { userId: currentUser.id }
        }
      },
      orderBy: { createdAt: "desc" },
      include: { 
        projects: true,
        agencies: {
          include: { agency: true }
        },
        teamMembers: {
          include: { user: { select: { id: true, name: true, agencyId: true } } }
        }
      },
    });
  }
  // SUPER_ADMIN sees ALL clients that belong to their agency
  else if (currentUser.role === "SUPER_ADMIN" && currentUser.agencyId) {
    clients = await prisma.client.findMany({
      where: {
        agencies: {
          some: {
            agencyId: currentUser.agencyId
          }
        }
      },
      orderBy: { createdAt: "desc" },
      include: { 
        projects: true,
        agencies: {
          include: { agency: true }
        },
        teamMembers: {
          include: { user: { select: { id: true, name: true, agencyId: true } } }
        }
      },
    });
  } 
  // ADMIN sees all clients that belong to their agency
  else if (currentUser.role === "ADMIN" && currentUser.agencyId) {
    clients = await prisma.client.findMany({
      where: {
        agencies: {
          some: {
            agencyId: currentUser.agencyId
          }
        }
      },
      orderBy: { createdAt: "desc" },
      include: { 
        projects: true,
        agencies: {
          include: { agency: true }
        },
        teamMembers: {
          include: { user: { select: { id: true, name: true, agencyId: true } } }
        }
      },
    });
  }
  // MEMBER sees ONLY clients they're personally assigned to
  else if (currentUser.role === "MEMBER") {
    clients = await prisma.client.findMany({
      where: {
        teamMembers: {
          some: { userId: currentUser.id }
        }
      },
      orderBy: { createdAt: "desc" },
      include: { 
        projects: true,
        agencies: {
          include: { agency: true }
        },
        teamMembers: {
          include: { user: { select: { id: true, name: true, agencyId: true } } }
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

  // Get user's agencyId
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, role: true, agencyId: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only SUPER_ADMIN and ADMIN can create clients
  if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
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
      },
    });

    // Auto-assign the creator to this client (links client to agency through user)
    await prisma.clientTeamMember.create({
      data: {
        clientId: client.id,
        userId: currentUser.id,
      },
    });

    // CRITICAL: Link client to the creator's agency via client_agencies
    if (currentUser.agencyId) {
      await prisma.clientAgency.create({
        data: {
          clientId: client.id,
          agencyId: currentUser.agencyId,
        },
      });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
