import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Get current user's agencyId and role
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { agencyId: true, role: true, id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build client filter based on role
    let clientFilter: any = {};
    
    if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
      // ADMINs and SUPER_ADMINs see all clients that belong to their agency
      if (currentUser.agencyId) {
        clientFilter = {
          agencies: {
            some: {
              agencyId: currentUser.agencyId
            }
          }
        };
      }
    } else if (currentUser.role === "MEMBER") {
      // MEMBERs see ONLY clients they're personally assigned to
      clientFilter = {
        teamMembers: {
          some: {
            userId: currentUser.id
          }
        }
      };
    }

    // Fetch clients with only needed fields
    const clients = await prisma.client.findMany({
      where: clientFilter,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        status: true,
        industry: true,
        email: true,
        phone: true,
        createdAt: true,
        projects: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = {
      total: clients.length,
      active: clients.filter(c => c.status === "ACTIVE").length,
      onboarding: clients.filter(c => c.status === "ONBOARDING").length,
      leads: clients.filter(c => c.status === "LEAD").length,
    };

    return NextResponse.json({ clients, stats });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Get current user's agency
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { id: true, agencyId: true, role: true },
    });

    if (!currentUser?.agencyId) {
      return NextResponse.json({ error: "User has no agency" }, { status: 400 });
    }

    // Generate friendly client ID from nickname or name
    const baseSlug = (data.nickname || data.name || "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Check if slug exists and append number if needed
    let clientId = `client-${baseSlug}`;
    let counter = 1;
    while (await prisma.client.findUnique({ where: { id: clientId } })) {
      clientId = `client-${baseSlug}-${counter}`;
      counter++;
    }

    // Safely parse monthlyRetainer (avoid NaN)
    const retainer = data.monthlyRetainer != null && !isNaN(Number(data.monthlyRetainer))
      ? Number(data.monthlyRetainer)
      : null;

    // Create the client with friendly ID
    const client = await prisma.client.create({
      data: {
        id: clientId,
        name: data.name,
        nickname: data.nickname || null,
        industry: data.industry || null,
        website: data.website || null,
        status: data.status || "LEAD",
        email: data.primaryEmail || null,
        phone: data.phone || null,
        monthlyRetainer: retainer,
      },
    });

    // Link client to the user's main agency (not partner agency)
    // The form sends a PartnerAgency ID in data.agencyId, but ClientAgency
    // references the Agency table. Always use the user's actual agency ID.
    await prisma.clientAgency.create({
      data: {
        clientId: client.id,
        agencyId: currentUser.agencyId,
      },
    });

    // Auto-add creator to client team (for ADMIN and SUPER_ADMIN)
    if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
      await prisma.clientTeamMember.create({
        data: {
          clientId: client.id,
          userId: currentUser.id,
        },
      });
    }

    // Auto-create "Admin/Operations" default project
    // Use raw SQL to avoid Prisma enum type mismatch with pricing_model
    // Column names must match actual DB names: Prisma uses camelCase unless @map() overrides
    try {
      await prisma.$executeRaw`
        INSERT INTO projects (id, name, description, "clientId", "serviceType", status, is_default, "createdAt", "updatedAt")
        VALUES (
          ${`proj-${clientId}-default`},
          'Admin/Operations',
          'General administrative tasks and operations',
          ${client.id},
          'CONSULTING'::service_type,
          'IN_PROGRESS'::project_status,
          true,
          NOW(),
          NOW()
        )
      `;
    } catch (projError) {
      // Non-critical: client is already created, just log the project creation failure
      console.error("Warning: Failed to create default project:", projError);
    }

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
