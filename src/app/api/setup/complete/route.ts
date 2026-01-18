import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agency, admin, config } = body;

    // Validate required fields
    if (!agency?.name || !agency?.slug || !admin?.email || !admin?.password || !admin?.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.agency.findUnique({
      where: { slug: agency.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: admin.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create agency
      const newAgency = await tx.agency.create({
        data: {
          name: agency.name,
          slug: agency.slug.toLowerCase(),
          isActive: true,
        },
      });

      // Create admin user
      const hashedPassword = await hash(admin.password, 12);
      const adminUser = await tx.user.create({
        data: {
          email: admin.email,
          name: admin.name,
          password: hashedPassword,
          role: 'ADMIN',
          agencyId: newAgency.id,
          isActive: true,
        },
      });

      // Create AI configuration with defaults
      await tx.aIConfiguration.create({
        data: {
          agencyId: newAgency.id,
          services: config.services || ['SEO', 'AEO'],
          targetIndustries: config.targetIndustries || [],
          minBudget: config.minBudget || 5000,
          targetCompanySize: 'SMB',
          budgetWeight: 30,
          authorityWeight: 25,
          needWeight: 25,
          timelineWeight: 20,
          qualificationThreshold: 70,
          tone: 'consultative',
          greetingMessage: "Hi! I'm here to help you learn more about our services. What brings you here today?",
          caseStudies: [],
          activeVersion: 1,
        },
      });

      return { agency: newAgency, admin: adminUser };
    });

    return NextResponse.json({
      success: true,
      agencySlug: result.agency.slug,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed. Please try again.' },
      { status: 500 }
    );
  }
}
