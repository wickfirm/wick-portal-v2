import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const templates = await prisma.keyDateTemplate.findMany({
      orderBy: [{ region: "asc" }, { date: "asc" }],
    });

    // Group by region
    const grouped = templates.reduce((acc, template) => {
      if (!acc[template.region]) {
        acc[template.region] = [];
      }
      acc[template.region].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);

    return NextResponse.json({ templates, grouped });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();

    const template = await prisma.keyDateTemplate.create({
      data: {
        name: data.name,
        region: data.region,
        date: data.date,
        isRecurring: data.isRecurring ?? true,
        category: data.category || "HOLIDAY",
        color: data.color || null,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
