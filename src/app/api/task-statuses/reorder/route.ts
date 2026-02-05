import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderedIds } = await req.json();

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 });
  }

  // Update each status with its new order
  await Promise.all(
    orderedIds.map((id: string, index: number) =>
      prisma.taskStatusOption.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  );

  return NextResponse.json({ success: true });
}
