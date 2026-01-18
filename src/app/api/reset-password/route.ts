export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword, adminSecret } = await req.json();
    
    // Use hardcoded secret for now
    if (adminSecret !== "wick-admin-2024") {
      return NextResponse.json({ error: "Invalid admin secret" }, { status: 401 });
    }
    
    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Hash and update password
    const hashedPassword = await hash(newPassword, 10);
    
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    
    return NextResponse.json({ success: true, message: "Password updated for " + email });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
