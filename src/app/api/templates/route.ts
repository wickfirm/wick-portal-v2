import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.stageTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    const template = await prisma.stageTemplate.create({
      data: {
        name: data.name,
        stages: data.stages || [],
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
