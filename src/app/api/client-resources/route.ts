import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const resources = await prisma.clientResource.findMany({
    where: { clientId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    if (!data.clientId || !data.name || !data.url) {
      return NextResponse.json({ error: "clientId, name, and url are required" }, { status: 400 });
    }

    const lastResource = await prisma.clientResource.findFirst({
      where: { clientId: data.clientId },
      orderBy: { order: "desc" },
    });

    const resource = await prisma.clientResource.create({
      data: {
        clientId: data.clientId,
        name: data.name,
        url: data.url,
        type: data.type || "LINK",
        order: (lastResource?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Failed to create resource:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
