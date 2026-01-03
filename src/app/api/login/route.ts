import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // First, let's just check if passwords match directly (for debugging)
    const directMatch = password === user.password;
    
    // Then try bcrypt
    let bcryptMatch = false;
    try {
      const { compare } = await import("bcryptjs");
      bcryptMatch = await compare(password, user.password);
    } catch (bcryptError) {
      return NextResponse.json({ 
        error: "bcrypt error", 
        details: String(bcryptError),
        storedPasswordStart: user.password.substring(0, 10)
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: bcryptMatch || directMatch,
      directMatch,
      bcryptMatch,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      passwordLength: user.password.length,
      passwordStart: user.password.substring(0, 15)
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: String(error) 
    }, { status: 500 });
  }
}
