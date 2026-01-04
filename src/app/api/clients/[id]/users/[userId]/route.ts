import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE - Unlink a user from this client
export async function DELETE(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: params.userId },
    data: { clientId: null },
  });

  return NextResponse.json({ success: true });
}
