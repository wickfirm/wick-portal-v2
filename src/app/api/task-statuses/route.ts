import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Task statuses are defined as an enum in the schema, not a database table
// This API returns static status options

const STATUSES = [
  { id: "PENDING", name: "Pending", color: "#6B7280", order: 1 },
  { id: "IN_PROGRESS", name: "In Progress", color: "#3B82F6", order: 2 },
  { id: "IN_REVIEW", name: "In Review", color: "#8B5CF6", order: 3 },
  { id: "COMPLETED", name: "Completed", color: "#10B981", order: 4 },
  { id: "CANCELLED", name: "Cancelled", color: "#EF4444", order: 5 },
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(STATUSES);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Statuses are enum-based, cannot be added
  return NextResponse.json({ error: "Statuses are system-defined and cannot be added" }, { status: 400 });
}
