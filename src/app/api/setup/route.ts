import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  // Delete existing admin
  await prisma.user.deleteMany({
    where: { email: "admin@thewickfirm.com" }
  });

  // Create new admin with properly hashed password
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const user = await prisma.user.create({
    data: {
      email: "admin@thewickfirm.com",
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  return NextResponse.json({ 
    success: true, 
    message: "Admin created. Login with admin@thewickfirm.com / admin123",
    hash: hashedPassword 
  });
}
