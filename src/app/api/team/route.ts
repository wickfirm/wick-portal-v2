import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  // Get current user's full data including agencyId
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, role: true, agencyId: true, clientId: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // CLIENT role sees only team members assigned to their clients
  if (currentUser.role === "CLIENT") {
    if (currentUser.clientId) {
      // Get team members for this client
      const teamMembers = await prisma.clientTeamMember.findMany({
        where: { clientId: currentUser.clientId },
        include: {
          user: {
            include: {
              agency: true,
              clientAssignments: {
                include: {
                  client: { select: { id: true, name: true, nickname: true } }
                }
              }
            }
          }
        }
      });

      return NextResponse.json(teamMembers.map(tm => tm.user));
    }

    return NextResponse.json([]);
  }

  // SUPER_ADMIN and ADMIN see only users from their agency
  const users = await prisma.user.findMany({
    where: {
      agencyId: currentUser.agencyId // Filter by current user's agency
    },
    orderBy: { createdAt: "desc" },
    include: {
      agency: true,
      clientAssignments: {
        include: {
          client: { select: { id: true, name: true, nickname: true } }
        }
      }
    }
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = session.user as any;
  
  // Get user's agencyId
  const user = await prisma.user.findUnique({
    where: { email: currentUser.email },
    select: { id: true, role: true, agencyId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only SUPER_ADMIN and ADMIN can create users
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const data = await req.json();

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(data.password, 10);

    // For CLIENT role, set clientId to first selected client
    const clientId = data.role === "CLIENT" && data.clientIds && data.clientIds.length > 0
      ? data.clientIds[0]
      : null;

    // IMPORTANT: New users inherit the creator's agencyId (or use provided agencyId)
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        password: hashedPassword,
        role: data.role || "MEMBER",
        agencyId: data.agencyId || user.agencyId, // Use provided agencyId or inherit from creator
        clientId: clientId,
      },
    });

    // Create client assignments if provided
    if (data.clientIds && data.clientIds.length > 0) {
      await prisma.clientTeamMember.createMany({
        data: data.clientIds.map((clientId: string) => ({
          userId: newUser.id,
          clientId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
