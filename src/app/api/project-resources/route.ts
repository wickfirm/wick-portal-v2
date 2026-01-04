import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const resources = await prisma.projectResource.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    if (!data.projectId || !data.name || !data.url) {
      return NextResponse.json({ error: "projectId, name, and url are required" }, { status: 400 });
    }

    // Get max order
    const lastResource = await prisma.projectResource.findFirst({
      where: { projectId: data.projectId },
      orderBy: { order: "desc" },
    });

    const resource = await prisma.projectResource.create({
      data: {
        projectId: data.projectId,
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
