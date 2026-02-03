import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { region, year } = await req.json();
    const targetYear = year || new Date().getFullYear();

    // Get templates for the region
    const templates = await prisma.keyDateTemplate.findMany({
      where: { region },
    });

    if (templates.length === 0) {
      return NextResponse.json({ error: "No templates found for this region" }, { status: 404 });
    }

    // Create key dates from templates
    const keyDates = await Promise.all(
      templates.map(async (template) => {
        // Parse the template date (format: "MM-DD" for recurring, "YYYY-MM-DD" for specific)
        let dateStr = template.date;
        if (dateStr.length === 5) {
          // MM-DD format, add year
          dateStr = `${targetYear}-${dateStr}`;
        }

        // Check if this key date already exists for this client
        const existing = await prisma.clientKeyDate.findFirst({
          where: {
            clientId: params.id,
            name: template.name,
            date: new Date(dateStr),
          },
        });

        if (existing) return null;

        return prisma.clientKeyDate.create({
          data: {
            clientId: params.id,
            name: template.name,
            date: new Date(dateStr),
            isRecurring: template.isRecurring,
            category: template.category,
            color: template.color,
          },
        });
      })
    );

    const created = keyDates.filter(Boolean);

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: templates.length - created.length,
    });
  } catch (error) {
    console.error("Error applying template:", error);
    return NextResponse.json({ error: "Failed to apply template" }, { status: 500 });
  }
}
