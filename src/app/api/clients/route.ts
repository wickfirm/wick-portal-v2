import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    const client = await prisma.client.create({
      data: {
        name: data.name,
        slug: data.slug,
        website: data.website,
        industry: data.industry,
        status: data.status || "LEAD",
        primaryContact: data.primaryContact,
        primaryEmail: data.primaryEmail,
        monthlyRetainer: data.monthlyRetainer,
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A client with this slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { projects: true },
  });

  return NextResponse.json(clients);
}
