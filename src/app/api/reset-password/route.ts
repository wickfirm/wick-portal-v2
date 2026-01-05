import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, newPassword, secret } = await req.json();
  
  // Simple protection - remove this route after use
  if (secret !== "temp-reset-123") {
    return NextResponse.json({ error: "Invalid" }, { status: 401 });
  }

  const hashed = await hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}
