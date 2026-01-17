// /src/app/api/ai-config/route.ts
// AI Configuration API for Lead Qualifier Settings

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user's agency ID if they have one
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { agencyId: true },
    });

    // Find config for this agency, or the default (no agency)
    let config = await prisma.aIConfiguration.findFirst({
      where: user?.agencyId ? { agencyId: user.agencyId } : { agencyId: null },
    });

    // If no config exists, return default values
    if (!config) {
      return NextResponse.json({
        config: {
          services: [],
          targetIndustries: [],
          minBudget: 5000,
          targetCompanySize: "SMB",
          budgetWeight: 30,
          authorityWeight: 25,
          needWeight: 25,
          timelineWeight: 20,
          qualificationThreshold: 70,
          tone: "consultative",
          greetingMessage: "Hi! I'm here to help you learn more about our services. What brings you here today?",
          caseStudies: [],
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to fetch AI config:", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Get the user's agency ID if they have one
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { agencyId: true },
    });

    // Check if config exists
    const existingConfig = await prisma.aIConfiguration.findFirst({
      where: user?.agencyId ? { agencyId: user.agencyId } : { agencyId: null },
    });

    const configData = {
      services: body.services || [],
      targetIndustries: body.targetIndustries || [],
      minBudget: body.minBudget || 5000,
      targetCompanySize: body.targetCompanySize || "SMB",
      budgetWeight: body.budgetWeight || 30,
      authorityWeight: body.authorityWeight || 25,
      needWeight: body.needWeight || 25,
      timelineWeight: body.timelineWeight || 20,
      qualificationThreshold: body.qualificationThreshold || 70,
      tone: body.tone || "consultative",
      greetingMessage: body.greetingMessage || "Hi! I'm here to help you learn more about our services. What brings you here today?",
      caseStudies: body.caseStudies || [],
      agencyId: user?.agencyId || null,
    };

    let config;

    if (existingConfig) {
      // Update existing config
      config = await prisma.aIConfiguration.update({
        where: { id: existingConfig.id },
        data: configData,
      });
    } else {
      // Create new config
      config = await prisma.aIConfiguration.create({
        data: configData,
      });
    }

    return NextResponse.json({ config, success: true });
  } catch (error) {
    console.error("Failed to save AI config:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}
