import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List users linked to this client
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { clientId: params.id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return NextResponse.json(users);
}

// POST - Link a user to this client
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { clientId: params.id },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}
