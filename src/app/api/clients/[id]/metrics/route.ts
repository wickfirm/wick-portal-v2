import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const metrics = await prisma.clientMetrics.findMany({
    where: { clientId: params.id },
    orderBy: { month: "desc" },
  });

  return NextResponse.json(metrics);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();

    // Check if metrics for this month already exist
    const existing = await prisma.clientMetrics.findFirst({
      where: { 
        clientId: params.id, 
        month: new Date(data.month) 
      },
    });

    if (existing) {
      // Update existing
      const metrics = await prisma.clientMetrics.update({
        where: { id: existing.id },
        data: {
          gaSessions: data.gaSessions || null,
          gaUsers: data.gaUsers || null,
          gaPageviews: data.gaPageviews || null,
          gaBounceRate: data.gaBounceRate || null,
          gaAvgSessionDuration: data.gaAvgSessionDuration || null,
          gscImpressions: data.gscImpressions || null,
          gscClicks: data.gscClicks || null,
          gscCtr: data.gscCtr || null,
          gscAvgPosition: data.gscAvgPosition || null,
          metaSpend: data.metaSpend || null,
          metaImpressions: data.metaImpressions || null,
          metaClicks: data.metaClicks || null,
          metaConversions: data.metaConversions || null,
          metaCtr: data.metaCtr || null,
          metaCpc: data.metaCpc || null,
          metaRoas: data.metaRoas || null,
          notes: data.notes || null,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(metrics);
    }

    // Create new
    const metrics = await prisma.clientMetrics.create({
      data: {
        clientId: params.id,
        month: new Date(data.month),
        gaSessions: data.gaSessions || null,
        gaUsers: data.gaUsers || null,
        gaPageviews: data.gaPageviews || null,
        gaBounceRate: data.gaBounceRate || null,
        gaAvgSessionDuration: data.gaAvgSessionDuration || null,
        gscImpressions: data.gscImpressions || null,
        gscClicks: data.gscClicks || null,
        gscCtr: data.gscCtr || null,
        gscAvgPosition: data.gscAvgPosition || null,
        metaSpend: data.metaSpend || null,
        metaImpressions: data.metaImpressions || null,
        metaClicks: data.metaClicks || null,
        metaConversions: data.metaConversions || null,
        metaCtr: data.metaCtr || null,
        metaCpc: data.metaCpc || null,
        metaRoas: data.metaRoas || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to save metrics:", error);
    return NextResponse.json({ error: "Failed to save metrics" }, { status: 500 });
  }
}
