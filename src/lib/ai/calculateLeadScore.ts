// /src/lib/ai/calculateLeadScore.ts
// Calculate lead qualification score based on BANT framework

import { AIConfiguration } from '@prisma/client';

export interface BANTData {
  budget?: string;      // "$5K-10K", "$10K-25K", etc.
  authority?: string;   // "Decision Maker", "Influencer", "End User"
  need?: string;        // Description of their needs
  timeline?: string;    // "Immediate", "1-3 months", etc.
}

/**
 * Calculate lead qualification score (0-100) based on BANT criteria
 */
export function calculateLeadScore(
  bantData: BANTData,
  config: AIConfiguration
): number {
  let score = 0;

  // Budget Score
  if (bantData.budget) {
    score += calculateBudgetScore(bantData.budget, config.minBudget, config.budgetWeight);
  }

  // Authority Score
  if (bantData.authority) {
    score += calculateAuthorityScore(bantData.authority, config.authorityWeight);
  }

  // Need Score
  if (bantData.need) {
    score += calculateNeedScore(
      bantData.need,
      config.services as string[],
      config.needWeight
    );
  }

  // Timeline Score
  if (bantData.timeline) {
    score += calculateTimelineScore(bantData.timeline, config.timelineWeight);
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculate budget component of score
 */
function calculateBudgetScore(
  budgetRange: string,
  minBudget: number,
  maxPoints: number
): number {
  // Extract numbers from budget range string
  const numbers = budgetRange.match(/\d+/g)?.map(Number) || [];
  
  if (numbers.length === 0) return 0;

  // Use the lower end of the range
  const budget = numbers[0] * 1000; // Assume in thousands

  if (budget >= minBudget) {
    return maxPoints; // Full points
  } else if (budget >= minBudget * 0.6) {
    return Math.round(maxPoints * 0.5); // Half points
  }
  return 0;
}

/**
 * Calculate authority component of score
 */
function calculateAuthorityScore(
  authority: string,
  maxPoints: number
): number {
  const normalizedAuthority = authority.toLowerCase();

  if (
    normalizedAuthority.includes('ceo') ||
    normalizedAuthority.includes('cmo') ||
    normalizedAuthority.includes('director') ||
    normalizedAuthority.includes('founder') ||
    normalizedAuthority.includes('decision maker')
  ) {
    return maxPoints; // Full points
  }

  if (
    normalizedAuthority.includes('manager') ||
    normalizedAuthority.includes('influencer') ||
    normalizedAuthority.includes('head')
  ) {
    return Math.round(maxPoints * 0.6); // 60% points
  }

  if (
    normalizedAuthority.includes('coordinator') ||
    normalizedAuthority.includes('specialist') ||
    normalizedAuthority.includes('end user')
  ) {
    return Math.round(maxPoints * 0.2); // 20% points
  }

  return Math.round(maxPoints * 0.4); // Default 40% if unclear
}

/**
 * Calculate need component of score
 * Checks if their needs align with services offered
 */
function calculateNeedScore(
  need: string,
  services: string[],
  maxPoints: number
): number {
  const normalizedNeed = need.toLowerCase();
  let matchCount = 0;

  const serviceKeywords: Record<string, string[]> = {
    'SEO': ['seo', 'search engine', 'organic', 'ranking', 'google'],
    'AEO': ['aeo', 'ai engine', 'chatgpt', 'perplexity', 'ai search'],
    'WEB_DEVELOPMENT': ['website', 'web development', 'web design', 'site', 'rebuild'],
    'PAID_MEDIA': ['paid', 'ads', 'advertising', 'ppc', 'meta', 'facebook', 'google ads'],
    'SOCIAL_MEDIA': ['social', 'instagram', 'facebook', 'linkedin', 'tiktok'],
    'CONTENT': ['content', 'blog', 'copywriting', 'articles'],
    'BRANDING': ['brand', 'design', 'logo', 'identity'],
    'CONSULTING': ['strategy', 'consulting', 'audit', 'planning'],
  };

  for (const service of services) {
    const keywords = serviceKeywords[service] || [];
    if (keywords.some(keyword => normalizedNeed.includes(keyword))) {
      matchCount++;
    }
  }

  // Score based on how many services match
  const matchRatio = services.length > 0 ? matchCount / services.length : 0;

  if (matchRatio >= 0.5) {
    return maxPoints; // Strong fit
  } else if (matchRatio >= 0.25) {
    return Math.round(maxPoints * 0.6); // Partial fit
  } else if (matchCount > 0) {
    return Math.round(maxPoints * 0.3); // Weak fit
  }

  return 0;
}

/**
 * Calculate timeline component of score
 */
function calculateTimelineScore(
  timeline: string,
  maxPoints: number
): number {
  const normalizedTimeline = timeline.toLowerCase();

  if (
    normalizedTimeline.includes('immediate') ||
    normalizedTimeline.includes('asap') ||
    normalizedTimeline.includes('urgent') ||
    normalizedTimeline.includes('1-2 weeks') ||
    normalizedTimeline.includes('now')
  ) {
    return maxPoints; // Immediate = full points
  }

  if (
    normalizedTimeline.includes('1-3 months') ||
    normalizedTimeline.includes('short term') ||
    normalizedTimeline.includes('soon')
  ) {
    return Math.round(maxPoints * 0.75); // Short term = 75%
  }

  if (
    normalizedTimeline.includes('3-6 months') ||
    normalizedTimeline.includes('medium term') ||
    normalizedTimeline.includes('quarter')
  ) {
    return Math.round(maxPoints * 0.5); // Medium term = 50%
  }

  if (
    normalizedTimeline.includes('6+ months') ||
    normalizedTimeline.includes('long term') ||
    normalizedTimeline.includes('exploring') ||
    normalizedTimeline.includes('future')
  ) {
    return 0; // Too far out = 0 points
  }

  return Math.round(maxPoints * 0.4); // Default if unclear
}

/**
 * Get recommendation based on score
 */
export function getRecommendation(
  score: number,
  threshold: number
): 'qualified' | 'warm' | 'cold' {
  if (score >= threshold) {
    return 'qualified';
  } else if (score >= threshold * 0.6) {
    return 'warm';
  }
  return 'cold';
}

/**
 * Get human-readable score description
 */
export function getScoreDescription(score: number, threshold: number): string {
  if (score >= threshold) {
    return 'Highly Qualified - Ready for discovery call';
  } else if (score >= threshold * 0.75) {
    return 'Good Fit - Minor qualification needed';
  } else if (score >= threshold * 0.6) {
    return 'Warm Lead - Needs nurturing';
  } else if (score >= threshold * 0.4) {
    return 'Low Priority - Poor fit';
  }
  return 'Disqualified - Not a fit';
}
