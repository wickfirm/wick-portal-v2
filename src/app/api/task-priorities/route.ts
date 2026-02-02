import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priorities = await prisma.taskPriorityOption.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(priorities);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, color } = await req.json();

  const lastPriority = await prisma.taskPriorityOption.findFirst({
    orderBy: { order: "desc" },
  });

  const priority = await prisma.taskPriorityOption.create({
    data: {
      name: name.toUpperCase().replace(/\s+/g, "_"),
      color: color || "#6B7280",
      order: (lastPriority?.order ?? 0) + 1,
    },
  });

  return NextResponse.json(priority);
}
