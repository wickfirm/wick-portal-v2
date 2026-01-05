import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "MEMBER",
        agencyId: data.agencyId || null,
        clientId: data.clientId || null,
        isActive: true,
      },
    });

    // Assign to clients if provided
    if (data.clientIds && data.clientIds.length > 0) {
      await prisma.clientTeamMember.createMany({
        data: data.clientIds.map((clientId: string) => ({
          userId: user.id,
          clientId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      client: true,
      agency: true,
      clientAssignments: {
        include: { client: { select: { id: true, name: true, nickname: true } } }
      }
    },
  });
  
  return NextResponse.json(users);
}
