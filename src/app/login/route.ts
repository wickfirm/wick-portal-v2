import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    console.log("Login attempt:", email);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("User not found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("User found, checking password...");
    console.log("Stored hash:", user.password.substring(0, 20) + "...");
    
    const isValid = await compare(password, user.password);
    console.log("Password valid:", isValid);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
