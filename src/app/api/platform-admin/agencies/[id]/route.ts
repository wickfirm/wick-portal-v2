// /src/app/api/platform-admin/agencies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
export async function PUT(
req: NextRequest,
{ params }: { params: { id: string } }
) {
const session = await getServerSession(authOptions);
if (!session) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const user = session.user as any;
if (user.role !== "PLATFORM_ADMIN") {
return NextResponse.json({ error: "Platform admin access required" }, { status: 403 });
}
try {
const data = await req.json();
const updated = await prisma.agency.update({
where: { id: params.id },
data: {
name: data.name,
primaryColor: data.primaryColor,
isActive: data.isActive,
},
});
return NextResponse.json(updated);
} catch (error) {
console.error("Failed to update agency:", error);
return NextResponse.json({ error: "Failed to update agency" }, { status: 500 });
}
}
export async function DELETE(
req: NextRequest,
{ params }: { params: { id: string } }
) {
const session = await getServerSession(authOptions);
if (!session) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const user = session.user as any;
if (user.role !== "PLATFORM_ADMIN") {
return NextResponse.json({ error: "Platform admin access required" }, { status: 403 });
}
try {
const userCount = await prisma.user.count({
where: { agencyId: params.id },
});
if (userCount > 0) {
return NextResponse.json(
{ error: `Cannot delete agency with ${userCount} users. Remove users first.` },
{ status: 400 }
);
}
await prisma.agency.delete({
where: { id: params.id },
});
return NextResponse.json({ success: true });
} catch (error) {
console.error("Failed to delete agency:", error);
return NextResponse.json({ error: "Failed to delete agency" }, { status: 500 });
}
}
