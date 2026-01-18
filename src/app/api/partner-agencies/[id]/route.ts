// /src/app/api/partner-agencies/[id]/route.ts
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
if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
return NextResponse.json({ error: "Not authorized" }, { status: 403 });
}
try {
const data = await req.json();
const updated = await prisma.clientAgency.update({
where: { id: params.id },
data: {
name: data.name,
isDefault: data.isDefault,
},
});
return NextResponse.json(updated);
} catch (error) {
console.error("Failed to update partner agency:", error);
return NextResponse.json({ error: "Failed to update partner agency" }, { status: 500 });
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
if (!["SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN"].includes(user.role)) {
return NextResponse.json({ error: "Not authorized" }, { status: 403 });
}
try {
await prisma.clientAgency.delete({
where: { id: params.id },
});
return NextResponse.json({ success: true });
} catch (error) {
console.error("Failed to delete partner agency:", error);
return NextResponse.json({ error: "Failed to delete partner agency" }, { status: 500 });
}
}
