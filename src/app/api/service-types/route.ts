import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Default service types to seed if table is empty
const DEFAULT_SERVICE_TYPES = [
  { name: "SEO", slug: "SEO", icon: "🔍", color: "#10B981", order: 1 },
  { name: "AEO", slug: "AEO", icon: "🤖", color: "#6366F1", order: 2 },
  { name: "Web Development", slug: "WEB_DEVELOPMENT", icon: "💻", color: "#3B82F6", order: 3 },
  { name: "Paid Media", slug: "PAID_MEDIA", icon: "📢", color: "#F59E0B", order: 4 },
  { name: "Social Media", slug: "SOCIAL_MEDIA", icon: "📱", color: "#EC4899", order: 5 },
  { name: "Content", slug: "CONTENT", icon: "✍️", color: "#8B5CF6", order: 6 },
  { name: "Branding", slug: "BRANDING", icon: "🎨", color: "#F97316", order: 7 },
  { name: "Consulting", slug: "CONSULTING", icon: "💼", color: "#14B8A6", order: 8 },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let serviceTypes = await prisma.serviceTypeOption.findMany({
    orderBy: { order: "asc" },
  });

  // Auto-seed if empty (first run after migration)
  if (serviceTypes.length === 0) {
    await prisma.serviceTypeOption.createMany({
      data: DEFAULT_SERVICE_TYPES,
    });
    serviceTypes = await prisma.serviceTypeOption.findMany({
      orderBy: { order: "asc" },
    });
  }

  return NextResponse.json(serviceTypes);
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

    if (!data.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate slug from name: "Paid Media" -> "PAID_MEDIA"
    const slug = data.slug?.trim() || data.name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

    // Check for duplicates
    const existing = await prisma.serviceTypeOption.findFirst({
      where: { OR: [{ name: data.name.trim() }, { slug }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Service type already exists" }, { status: 409 });
    }

    const lastItem = await prisma.serviceTypeOption.findFirst({
      orderBy: { order: "desc" },
    });

    const serviceType = await prisma.serviceTypeOption.create({
      data: {
        name: data.name.trim(),
        slug,
        icon: data.icon || "",
        color: data.color || "#6B7280",
        order: (lastItem?.order ?? 0) + 1,
        isActive: true,
      },
    });

    return NextResponse.json(serviceType);
  } catch (error) {
    console.error("Failed to create service type:", error);
    return NextResponse.json({ error: "Failed to create service type" }, { status: 500 });
  }
}
