import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // This returns the multi-tenant agencies (for the agency dropdown in team form)
    // NOTE: This is different from ClientAgency (partner agencies)
    const agencies = await prisma.agency.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json(agencies);
  } catch (error) {
    console.error("Failed to fetch agencies:", error);
    return NextResponse.json({ error: "Failed to fetch agencies" }, { status: 500 });
  }
}
