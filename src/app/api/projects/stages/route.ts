import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    
    // Get the highest order number for this project
    const lastStage = await prisma.projectStage.findFirst({
      where: { projectId: params.id },
      orderBy: { order: "desc" },
    });
    
    const stage = await prisma.projectStage.create({
      data: {
        name: data.name,
        order: (lastStage?.order ?? 0) + 1,
        projectId: params.id,
        isCompleted: false,
      },
    });
    
    return NextResponse.json(stage);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create stage" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stages = await prisma.projectStage.findMany({
    where: { projectId: params.id },
    orderBy: { order: "asc" },
  });
  
  return NextResponse.json(stages);
}
