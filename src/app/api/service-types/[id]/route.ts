import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // If name is changing, update the slug too
    if (data.name && !data.slug) {
      updateData.slug = data.name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
    }
    if (data.slug) updateData.slug = data.slug;

    const serviceType = await prisma.serviceTypeOption.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(serviceType);
  } catch (error) {
    console.error("Failed to update service type:", error);
    return NextResponse.json({ error: "Failed to update service type" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Check if any projects are using this service type
    const serviceType = await prisma.serviceTypeOption.findUnique({
      where: { id: params.id },
    });

    if (!serviceType) {
      return NextResponse.json({ error: "Service type not found" }, { status: 404 });
    }

    // Check for projects using this slug
    const projectCount = await prisma.project.count({
      where: { serviceType: serviceType.slug as any },
    });

    if (projectCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${projectCount} project(s) are using this service type. Reassign them first.` },
        { status: 409 }
      );
    }

    // Check for stage templates using this slug
    const stageCount = await prisma.stageTemplate.count({
      where: { serviceType: serviceType.slug as any },
    });

    if (stageCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${stageCount} stage template(s) are using this service type. Remove them first.` },
        { status: 409 }
      );
    }

    await prisma.serviceTypeOption.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete service type:", error);
    return NextResponse.json({ error: "Failed to delete service type" }, { status: 500 });
  }
}
