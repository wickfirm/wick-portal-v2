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
