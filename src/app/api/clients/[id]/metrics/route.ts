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

    const metricsData: any = {
      // Google Analytics
      gaSessions: data.gaSessions || null,
      gaUsers: data.gaUsers || null,
      gaPageviews: data.gaPageviews || null,
      gaBounceRate: data.gaBounceRate || null,
      gaAvgSessionDuration: data.gaAvgSessionDuration || null,
      
      // Google Search Console
      gscImpressions: data.gscImpressions || null,
      gscClicks: data.gscClicks || null,
      gscCtr: data.gscCtr || null,
      gscAvgPosition: data.gscAvgPosition || null,
      
      // SEO Rankings
      seoKeywordsTop3: data.seoKeywordsTop3 || null,
      seoKeywordsTop10: data.seoKeywordsTop10 || null,
      seoKeywordsTop100: data.seoKeywordsTop100 || null,
      seoBacklinks: data.seoBacklinks || null,
      seoDomainRating: data.seoDomainRating || null,
      
      // AEO
      aeoVisibilityScore: data.aeoVisibilityScore || null,
      aeoCitations: data.aeoCitations || null,
      aeoBrandMentions: data.aeoBrandMentions || null,
      
      // META Ads
      metaSpend: data.metaSpend || null,
      metaImpressions: data.metaImpressions || null,
      metaClicks: data.metaClicks || null,
      metaConversions: data.metaConversions || null,
      metaCtr: data.metaCtr || null,
      metaCpc: data.metaCpc || null,
      metaRoas: data.metaRoas || null,
      
      // Google Ads
      googleAdsSpend: data.googleAdsSpend || null,
      googleAdsImpressions: data.googleAdsImpressions || null,
      googleAdsClicks: data.googleAdsClicks || null,
      googleAdsConversions: data.googleAdsConversions || null,
      googleAdsCtr: data.googleAdsCtr || null,
      googleAdsCpc: data.googleAdsCpc || null,
      googleAdsRoas: data.googleAdsRoas || null,
      
      // LinkedIn Ads
      linkedinAdsSpend: data.linkedinAdsSpend || null,
      linkedinAdsImpressions: data.linkedinAdsImpressions || null,
      linkedinAdsClicks: data.linkedinAdsClicks || null,
      linkedinAdsConversions: data.linkedinAdsConversions || null,
      linkedinAdsCtr: data.linkedinAdsCtr || null,
      linkedinAdsCpc: data.linkedinAdsCpc || null,
      
      // TikTok Ads
      tiktokAdsSpend: data.tiktokAdsSpend || null,
      tiktokAdsImpressions: data.tiktokAdsImpressions || null,
      tiktokAdsClicks: data.tiktokAdsClicks || null,
      tiktokAdsConversions: data.tiktokAdsConversions || null,
      tiktokAdsCtr: data.tiktokAdsCtr || null,
      tiktokAdsCpc: data.tiktokAdsCpc || null,
      
      // Instagram
      igFollowers: data.igFollowers || null,
      igFollowing: data.igFollowing || null,
      igPosts: data.igPosts || null,
      igReach: data.igReach || null,
      igEngagementRate: data.igEngagementRate || null,
      
      // Facebook
      fbFollowers: data.fbFollowers || null,
      fbPosts: data.fbPosts || null,
      fbReach: data.fbReach || null,
      fbEngagementRate: data.fbEngagementRate || null,
      
      // LinkedIn Organic
      liFollowers: data.liFollowers || null,
      liPosts: data.liPosts || null,
      liImpressions: data.liImpressions || null,
      liEngagementRate: data.liEngagementRate || null,
      
      // TikTok Organic
      ttFollowers: data.ttFollowers || null,
      ttVideos: data.ttVideos || null,
      ttViews: data.ttViews || null,
      ttEngagementRate: data.ttEngagementRate || null,
      
      // Twitter/X
      twFollowers: data.twFollowers || null,
      twTweets: data.twTweets || null,
      twImpressions: data.twImpressions || null,
      twEngagementRate: data.twEngagementRate || null,
      
      // Content Deliverables
      contentBlogPosts: data.contentBlogPosts || null,
      contentSocialPosts: data.contentSocialPosts || null,
      contentEmailsSent: data.contentEmailsSent || null,
      contentVideosProduced: data.contentVideosProduced || null,
      contentGraphicsCreated: data.contentGraphicsCreated || null,
      contentLandingPages: data.contentLandingPages || null,
      
      // Hours Worked
      hoursSeo: data.hoursSeo || null,
      hoursContent: data.hoursContent || null,
      hoursPaidMedia: data.hoursPaidMedia || null,
      hoursSocial: data.hoursSocial || null,
      hoursDesign: data.hoursDesign || null,
      hoursMaintenance: data.hoursMaintenance || null,
      hoursStrategy: data.hoursStrategy || null,
      
      notes: data.notes || null,
      updatedAt: new Date(),
    };

    if (existing) {
      const metrics = await prisma.clientMetrics.update({
        where: { id: existing.id },
        data: metricsData,
      });
      return NextResponse.json(metrics);
    }

    const metrics = await prisma.clientMetrics.create({
      data: {
        clientId: params.id,
        month: new Date(data.month),
        ...metricsData,
      },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to save metrics:", error);
    return NextResponse.json({ error: "Failed to save metrics" }, { status: 500 });
  }
}
