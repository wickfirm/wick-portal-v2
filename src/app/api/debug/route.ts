import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Test 1: Can we connect?
    const userCount = await prisma.user.count();
    
    // Test 2: Find the admin user
    const admin = await prisma.user.findUnique({
      where: { email: "admin@thewickfirm.com" },
      select: { id: true, email: true, name: true, role: true }
    });

    return NextResponse.json({
      success: true,
      userCount,
      admin,
      dbUrl: process.env.DATABASE_URL?.substring(0, 50) + "..."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
