import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, agencyId: true, role: true, email: true, name: true },
    });

    // Count clients with direct agencyId
    const clientsWithAgencyId = currentUser?.agencyId
      ? await prisma.client.count({ where: { agencyId: currentUser.agencyId } })
      : 0;

    // Count clients via agencies relation
    const clientsViaRelation = currentUser?.agencyId
      ? await prisma.client.count({
          where: {
            agencies: { some: { agencyId: currentUser.agencyId } }
          }
        })
      : 0;

    // Total clients (no filter)
    const totalClients = await prisma.client.count();

    // Sample of all clients
    const sampleClients = await prisma.client.findMany({
      take: 5,
      select: { id: true, name: true, agencyId: true }
    });

    // Sample of agencies
    const agencies = await prisma.agency.findMany({
      take: 5,
      select: { id: true, name: true, slug: true }
    });

    // Test the exact OR query that clients/list uses
    const clientsWithORQuery = currentUser?.agencyId
      ? await prisma.client.findMany({
          where: {
            OR: [
              { agencyId: currentUser.agencyId },
              {
                agencies: {
                  some: {
                    agencyId: currentUser.agencyId
                  }
                }
              }
            ]
          },
          select: { id: true, name: true, status: true }
        })
      : [];

    return NextResponse.json({
      _version: "v3-with-or-query",
      currentUser,
      counts: {
        clientsWithAgencyId,
        clientsViaRelation,
        totalClients,
        clientsWithORQuery: clientsWithORQuery.length,
      },
      clientsFromORQuery: clientsWithORQuery,
      sampleClients,
      agencies,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
