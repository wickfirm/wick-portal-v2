import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMessage } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

// POST /api/proposals/[id]/analyze-brief - AI analyzes the client brief
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        client: {
          select: { name: true, industry: true, company: true },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (!proposal.briefContent) {
      return NextResponse.json({ error: "No brief content to analyze" }, { status: 400 });
    }

    const systemPrompt = `You are an expert agency project analyst. Analyze the following client brief/requirements and extract structured information.

Your analysis should identify:
1. **Project Type**: What kind of project is this? (WEB_DEV, BRANDING, SEO, SOCIAL_MEDIA, FULL_PACKAGE, MARKETING_RETAINER, MOBILE_APP, ECOMMERCE, CUSTOM)
2. **Requirements**: Key high-level requirements mentioned
3. **Deliverables**: Extract EVERY specific deliverable/solution the client is asking for. Each deliverable should be a concrete, scoped piece of work that could be included or excluded from a proposal. Group them by category. Give each a unique id, a clear name, a short description of what's involved, and map it to one of the service categories:
   - BUILD_AND_FILL (Website, Newsletter, Maintenance, Social Setup, Content)
   - PLAN_AND_PROMOTE (SEO, Social Media Services, Paid Advertising)
   - CAPTURE_AND_STORE (Tracking, Audience Building)
   - TAILOR_AND_AUTOMATE (Automation, Dynamic Campaigns)
4. **Budget Hints**: Any budget indicators or price sensitivities
5. **Timeline**: Any mentioned deadlines or urgency
6. **Pain Points**: Problems the client is trying to solve
7. **Missing Information**: What critical details are missing that should be asked
8. **Scope Assessment**: Is this a small, medium, or large project?
9. **Recommended Package Tier**: Based on the scope (ENTRY_LEVEL, STARTER_PLUS, STANDARD, PROFESSIONAL, ENTERPRISE)

The client is: ${proposal.client?.name || "Unknown"}
Industry: ${proposal.client?.industry || "Unknown"}

Respond ONLY with valid JSON in this exact format:
{
  "projectType": "FULL_PACKAGE",
  "requirements": ["requirement 1", "requirement 2"],
  "deliverables": [
    {
      "id": "del_1",
      "name": "Brand Identity & Logo Design",
      "description": "Complete brand naming, logo design, color palette, typography, and brand guidelines",
      "category": "BUILD_AND_FILL",
      "estimatedScope": "LARGE"
    },
    {
      "id": "del_2",
      "name": "Website Design & Development",
      "description": "Responsive project website with property listings, floor plans, gallery, and contact forms",
      "category": "BUILD_AND_FILL",
      "estimatedScope": "LARGE"
    }
  ],
  "budgetHints": "any budget information found or null",
  "timeline": "any timeline information or null",
  "painPoints": ["pain point 1"],
  "missingInfo": ["missing item 1", "missing item 2"],
  "suggestedServices": {
    "BUILD_AND_FILL": ["Website", "Content Creation"],
    "PLAN_AND_PROMOTE": ["SEO"],
    "CAPTURE_AND_STORE": [],
    "TAILOR_AND_AUTOMATE": []
  },
  "scopeAssessment": "MEDIUM",
  "recommendedTier": "STANDARD",
  "summary": "Brief 2-3 sentence summary of what the client needs"
}

IMPORTANT: Extract as many distinct deliverables as you can find in the brief. Be specific — e.g., instead of "marketing collateral", break it down into "Brochure Design", "Factsheet Design", "EDM Templates" etc. Each should be a billable item that the agency might or might not include in their proposal.`;

    const response = await sendMessage({
      messages: [{ role: "user", content: proposal.briefContent }],
      systemPrompt,
      maxTokens: 4096,
    });

    // Parse the AI response
    let extractedData;
    try {
      // Try to find JSON in the response text
      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse brief analysis" },
        { status: 500 }
      );
    }

    // Update proposal with extracted data and suggested project type
    await prisma.proposal.update({
      where: { id },
      data: {
        extractedData,
        projectType: extractedData.projectType || proposal.projectType,
      },
    });

    // Log activity
    const user = session.user as any;
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (currentUser) {
      await prisma.proposalActivity.create({
        data: {
          proposalId: id,
          action: "BRIEF_ANALYZED",
          performedBy: currentUser.id,
          details: {
            projectType: extractedData.projectType,
            scopeAssessment: extractedData.scopeAssessment,
            recommendedTier: extractedData.recommendedTier,
          },
        },
      });
    }

    return NextResponse.json({ extractedData });
  } catch (error) {
    console.error("Failed to analyze brief:", error);
    return NextResponse.json({ error: "Failed to analyze brief" }, { status: 500 });
  }
}
