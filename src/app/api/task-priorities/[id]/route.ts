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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priority = PRIORITIES.find(p => p.id === params.id);
  
  if (!priority) {
    return NextResponse.json({ error: "Priority not found" }, { status: 404 });
  }

  return NextResponse.json(priority);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Priorities are enum-based, cannot be modified
  return NextResponse.json({ error: "Priorities are system-defined and cannot be modified" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Priorities are enum-based, cannot be deleted
  return NextResponse.json({ error: "Priorities are system-defined and cannot be deleted" }, { status: 400 });
}
