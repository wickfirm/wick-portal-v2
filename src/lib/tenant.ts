// Tenant context and subdomain utilities

export type TenantConfig = {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  logoLetter: string;
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
};

// Tenant configuration mapping
export const TENANTS: Record<string, TenantConfig> = {
  wick: {
    id: "agency-wick",
    name: "The Wick Firm",
    slug: "wick",
    subdomain: "wick",
    logoLetter: "W",
    colors: {
      primary: "#76527c",    // Purple
      secondary: "#d8ee91",  // Light green
      accent: "#289847",     // Dark green
    },
  },
  udms: {
    id: "agency-udms",
    name: "UDMS",
    slug: "udms",
    subdomain: "udms",
    logoLetter: "U",
    colors: {
      primary: "#e85a4f",    // Orange/red (current default)
      secondary: "#f8b739",  // Yellow (current accent)
    },
  },
  acme: {
    id: "cmkjoac340000lgsbybm54e72",
    name: "Acme Corp",
    slug: "acme",
    subdomain: "acme",
    logoLetter: "A",
    colors: {
      primary: "#e85a4f",    // Orange/red (current default)
      secondary: "#f8b739",  // Yellow (current accent)
    },
  },
};

// Platform/Omnixia config
export const PLATFORM_CONFIG: TenantConfig = {
  id: "platform",
  name: "Omnixia",
  slug: "platform",
  subdomain: "dash",
  logoLetter: "O",
  colors: {
    primary: "#8B5CF6",      // Omnixia purple
    secondary: "#7C3AED",    // Darker purple
    accent: "#a78bfa",       // Light purple
  },
};

/**
 * Extract subdomain from hostname
 * Examples:
 *   wick.omnixia.ai -> "wick"
 *   dash.omnixia.ai -> "dash"
 *   localhost:3000 -> "dash" (default for development)
 */
export function getSubdomainFromHost(hostname: string): string {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Development: default to dash
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'dash';
  }
  
  // Extract subdomain
  const parts = host.split('.');
  
  // If omnixia.ai or omnixia.vercel.app
  if (parts.length >= 2) {
    // Check if it's a known subdomain
    const subdomain = parts[0];
    if (subdomain === 'dash' || subdomain === 'wick' || subdomain === 'udms' || subdomain === 'acme') {
      return subdomain;
    }
  }
  
  // Default to dash (platform)
  return 'dash';
}

/**
 * Get tenant config by subdomain
 */
export function getTenantBySubdomain(subdomain: string): TenantConfig | null {
  if (subdomain === 'dash') {
    return PLATFORM_CONFIG;
  }
  
  return TENANTS[subdomain] || null;
}

/**
 * Get tenant config by agency ID
 */
export function getTenantByAgencyId(agencyId: string | null): TenantConfig | null {
  if (!agencyId) return PLATFORM_CONFIG;
  
  for (const tenant of Object.values(TENANTS)) {
    if (tenant.id === agencyId) {
      return tenant;
    }
  }
  
  return null;
}

/**
 * Get expected subdomain for a user based on their agencyId and role
 */
export function getExpectedSubdomain(agencyId: string | null, role: string): string {
  // Platform admin always goes to dash
  if (role === 'PLATFORM_ADMIN') {
    return 'dash';
  }
  
  // Find tenant by agencyId
  const tenant = getTenantByAgencyId(agencyId);
  return tenant?.subdomain || 'dash';
}

/**
 * Check if user should have access to current subdomain
 */
export function canAccessSubdomain(
  currentSubdomain: string,
  userAgencyId: string | null,
  userRole: string
): boolean {
  const expectedSubdomain = getExpectedSubdomain(userAgencyId, userRole);
  return currentSubdomain === expectedSubdomain;
}

/**
 * Get redirect URL for user based on their agency
 */
export function getRedirectUrlForUser(
  userAgencyId: string | null,
  userRole: string,
  baseDomain: string = 'omnixia.ai'
): string {
  const subdomain = getExpectedSubdomain(userAgencyId, userRole);
  
  if (subdomain === 'dash') {
    return `https://dash.${baseDomain}`;
  }
  
  return `https://${subdomain}.${baseDomain}`;
}

/**
 * Legacy function for backward compatibility with existing API routes
 * Returns tenant info based on current subdomain (from headers)
 * Used in API routes that need to know which tenant they're serving
 */
export async function requireTenant(): Promise<{ agencyId: string; subdomain: string }> {
  // In API routes, we need to get subdomain from request headers
  // This will be set by middleware
  if (typeof window === 'undefined') {
    // Server-side: Get from headers (set by middleware)
    const { headers } = await import('next/headers');
    const headersList = headers();
    const subdomain = headersList.get('x-tenant-subdomain') || 'dash';
    
    const tenant = getTenantBySubdomain(subdomain);
    if (!tenant || tenant.subdomain === 'dash') {
      throw new Error('Tenant context required for this operation');
    }
    
    return {
      agencyId: tenant.id,
      subdomain: tenant.subdomain,
    };
  }
  
  // Client-side: Get from window.location
  const subdomain = getSubdomainFromHost(window.location.hostname);
  const tenant = getTenantBySubdomain(subdomain);
  
  if (!tenant || tenant.subdomain === 'dash') {
    throw new Error('Tenant context required for this operation');
  }
  
  return {
    agencyId: tenant.id,
    subdomain: tenant.subdomain,
  };
}

/**
 * Alias for requireTenant() - used by some older code
 */
export const getCurrentTenant = requireTenant;
