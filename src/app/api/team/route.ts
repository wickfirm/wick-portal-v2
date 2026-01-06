import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  // CLIENT role sees only team members assigned to their clients
  if (user.role === "CLIENT") {
    // Get clients this user has access to
    const userWithClient = await prisma.user.findUnique({
      where: { id: user.id },
      include: { client: true },
    });

    if (userWithClient?.clientId) {
      // Get team members for this client
      const teamMembers = await prisma.clientTeamMember.findMany({
        where: { clientId: userWithClient.clientId },
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

  // SUPER_ADMIN and ADMIN see all users
  const users = await prisma.user.findMany({
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
  
  // Only SUPER_ADMIN and ADMIN can create users
  if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
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

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        password: hashedPassword,
        role: data.role || "MEMBER",
        agencyId: data.agencyId || null,
        clientId: clientId,
      },
    });

    // Create client assignments if provided
    if (data.clientIds && data.clientIds.length > 0) {
      await prisma.clientTeamMember.createMany({
        data: data.clientIds.map((clientId: string) => ({
          userId: user.id,
          clientId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
