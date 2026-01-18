import { headers } from 'next/headers';
import prisma from './prisma';

export type TenantContext = {
  agencyId: string;
  agencySlug: string;
  agencyName: string;
};

/**
 * Extract subdomain from hostname
 * Examples:
 *   wick.omnixia.ai -> wick
 *   localhost:3000 -> null (uses DEV_TENANT_SLUG env var)
 *   omnixia.ai -> null (main site)
 */
export function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Local development
  if (host === 'localhost' || host === '127.0.0.1') {
    return process.env.DEV_TENANT_SLUG || null;
  }
  
  // Split by dots
  const parts = host.split('.');
  
  // If we have a subdomain (e.g., wick.omnixia.ai has 3 parts)
  if (parts.length >= 3) {
    return parts[0];
  }
  
  // Main domain or invalid
  return null;
}

/**
 * Get current tenant from request headers
 * This runs on the server only
 */
export async function getCurrentTenant(): Promise<TenantContext | null> {
  const headersList = headers();
  const hostname = headersList.get('host') || '';
  
  const subdomain = getSubdomain(hostname);
  
  if (!subdomain) {
    return null;
  }
  
  // Look up agency by slug
  const agency = await prisma.agency.findUnique({
    where: { slug: subdomain },
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
    },
  });
  
  if (!agency || !agency.isActive) {
    return null;
  }
  
  return {
    agencyId: agency.id,
    agencySlug: agency.slug,
    agencyName: agency.name,
  };
}

/**
 * Require tenant context or throw error
 */
export async function requireTenant(): Promise<TenantContext> {
  const tenant = await getCurrentTenant();
  
  if (!tenant) {
    throw new Error('No valid tenant found');
  }
  
  return tenant;
}
