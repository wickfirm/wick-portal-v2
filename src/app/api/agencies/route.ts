import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agencies = await prisma.agency.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  return NextResponse.json(agencies);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const agency = await prisma.agency.create({
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(agency);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create agency" }, { status: 500 });
  }
}
