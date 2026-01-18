// /src/app/api/platform-admin/agencies/route.ts
// PLATFORM ADMIN ONLY - Manage tenants (Wick, UDMS, future tenant agencies)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
export async function GET() {
const session = await getServerSession(authOptions);
if (!session) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const user = session.user as any;
if (user.role !== "PLATFORM_ADMIN") {
return NextResponse.json({ error: "Platform admin access required" }, { status: 403 });
}
try {
const agencies = await prisma.agency.findMany({
orderBy: { createdAt: "desc" },
include: {
_count: {
select: { users: true },
},
},
});
return NextResponse.json(agencies);
} catch (error) {
console.error("Failed to fetch tenant agencies:", error);
return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
}
}
export async function POST(req: NextRequest) {
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
const existing = await prisma.agency.findUnique({
where: { slug: data.slug },
});
if (existing) {
return NextResponse.json({ error: "Tenant slug already exists" }, { status: 400 });
}
const agency = await prisma.agency.create({
data: {
name: data.name,
slug: data.slug,
primaryColor: data.primaryColor || "#000000",
isActive: true,
},
});
return NextResponse.json(agency);
} catch (error) {
console.error("Failed to create tenant:", error);
return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
}
}
