// Force rebuild v2


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { projects: true },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    const client = await prisma.client.create({
      data: {
        name: data.name,
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

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
