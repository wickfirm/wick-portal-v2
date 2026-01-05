import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (clientId) {
    const clientAgencies = await prisma.clientAgency.findMany({
      where: { clientId },
      include: { agency: true },
    });
    return NextResponse.json(clientAgencies);
  }

  return NextResponse.json({ error: "clientId required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const { clientId, agencyIds } = await req.json();

    // Delete existing
    await prisma.clientAgency.deleteMany({ where: { clientId } });

    // Create new
    if (agencyIds && agencyIds.length > 0) {
      await prisma.clientAgency.createMany({
        data: agencyIds.map((agencyId: string) => ({ clientId, agencyId })),
        skipDuplicates: true,
      });
    }

    const updated = await prisma.clientAgency.findMany({
      where: { clientId },
      include: { agency: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update client agencies:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
