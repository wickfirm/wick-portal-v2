import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.onboardingTemplate.findMany({
    where: { isActive: true },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ order: "asc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    // Get last order for this service type
    const lastTemplate = await prisma.onboardingTemplate.findFirst({
      where: { serviceType: data.serviceType || "GENERAL" },
      orderBy: { order: "desc" },
    });

    const template = await prisma.onboardingTemplate.create({
      data: {
        name: data.name,
        description: data.description || null,
        serviceType: data.serviceType || "GENERAL",
        order: (lastTemplate?.order ?? 0) + 1,
        isActive: true,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
