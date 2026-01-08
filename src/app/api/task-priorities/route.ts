import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Task priorities are defined as an enum in the schema, not a database table
// This API returns static priority options

const PRIORITIES = [
  { id: "LOW", name: "Low", color: "#6B7280", order: 1 },
  { id: "MEDIUM", name: "Medium", color: "#F59E0B", order: 2 },
  { id: "HIGH", name: "High", color: "#F97316", order: 3 },
  { id: "URGENT", name: "Urgent", color: "#EF4444", order: 4 },
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(PRIORITIES);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Priorities are enum-based, cannot be added
  return NextResponse.json({ error: "Priorities are system-defined and cannot be added" }, { status: 400 });
}
