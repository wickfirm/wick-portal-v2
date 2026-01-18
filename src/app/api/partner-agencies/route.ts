// /src/app/api/partner-agencies/route.ts
// Manage partner agencies (ATC, UDMS collaborators)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
export async function GET() {
const session = await getServerSession(authOptions);
if (!session) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
try {
const partnerAgencies = await prisma.clientAgency.findMany({
orderBy: { name: "asc" },
select: {
id: true,
name: true,
createdAt: true,
},
});
return NextResponse.json(partnerAgencies);
} catch (error) {
console.error("Failed to fetch partner agencies:", error);
return NextResponse.json({ error: "Failed to fetch partner agencies" }, { status: 500 });
}
}
export async function POST(req: NextRequest) {
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
const partnerAgency = await prisma.clientAgency.create({
data: {
name: data.name,
isDefault: data.isDefault || false,
},
});
return NextResponse.json(partnerAgency);
} catch (error) {
console.error("Failed to create partner agency:", error);
return NextResponse.json({ error: "Failed to create partner agency" }, { status: 500 });
}
}
