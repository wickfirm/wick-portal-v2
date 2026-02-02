import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statuses = await prisma.taskStatusOption.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(statuses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, color } = await req.json();

  const lastStatus = await prisma.taskStatusOption.findFirst({
    orderBy: { order: "desc" },
  });

  const status = await prisma.taskStatusOption.create({
    data: {
      name: name.toUpperCase().replace(/\s+/g, "_"),
      color: color || "#6B7280",
      order: (lastStatus?.order ?? 0) + 1,
    },
  });

  return NextResponse.json(status);
}
