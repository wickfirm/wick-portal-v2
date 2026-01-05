import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencies = await prisma.agency.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(agencies);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = session.user as any;
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admin can manage agencies" }, { status: 403 });
  }

  try {
    const data = await req.json();

    const agency = await prisma.agency.create({
      data: {
        name: data.name,
        isDefault: data.isDefault || false,
      },
    });

    // If this is set as default, unset others
    if (data.isDefault) {
      await prisma.agency.updateMany({
        where: { id: { not: agency.id } },
        data: { isDefault: false },
      });
    }

    return NextResponse.json(agency);
  } catch (error) {
    console.error("Failed to create agency:", error);
    return NextResponse.json({ error: "Failed to create agency" }, { status: 500 });
  }
}
