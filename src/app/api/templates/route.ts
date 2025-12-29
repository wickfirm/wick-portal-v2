import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const serviceType = searchParams.get("serviceType");

  const templates = await prisma.stageTemplate.findMany({
    where: serviceType ? { serviceType: serviceType as any } : undefined,
    orderBy: { order: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    const lastTemplate = await prisma.stageTemplate.findFirst({
      where: { serviceType: data.serviceType },
      orderBy: { order: "desc" },
    });

    const template = await prisma.stageTemplate.create({
      data: {
        serviceType: data.serviceType,
        name: data.name,
        order: (lastTemplate?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
