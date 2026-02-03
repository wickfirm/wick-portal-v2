import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resources = await prisma.projectResource.findMany({
    where: { projectId: params.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(resources);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    // Get max order
    const lastResource = await prisma.projectResource.findFirst({
      where: { projectId: params.id },
      orderBy: { order: "desc" },
    });

    const resource = await prisma.projectResource.create({
      data: {
        projectId: params.id,
        name: data.name,
        url: data.url,
        type: data.type || "LINK",
        order: (lastResource?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
