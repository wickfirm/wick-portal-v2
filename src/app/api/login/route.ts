import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", email }, { status: 401 });
    }

    // Generate hash of entered password (for debugging)
    const newHash = await hash(password, 10);
    
    // Try bcrypt compare
    const bcryptMatch = await compare(password, user.password);

    return NextResponse.json({ 
      success: bcryptMatch,
      bcryptMatch,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      storedHash: user.password,
      newHashForEnteredPassword: newHash,
      tip: "Copy newHashForEnteredPassword to database if bcryptMatch is false"
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: String(error) 
    }, { status: 500 });
  }
}
