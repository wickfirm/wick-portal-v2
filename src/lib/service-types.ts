// Shared utility for service type display names and icons
// Used across components that display service type labels

type ServiceTypeInfo = {
  name: string;
  slug: string;
  icon: string;
  color: string;
};

// Cache for service types (avoids multiple API calls per page)
let cachedServiceTypes: ServiceTypeInfo[] | null = null;
let cachePromise: Promise<ServiceTypeInfo[]> | null = null;

export async function fetchServiceTypes(): Promise<ServiceTypeInfo[]> {
  if (cachedServiceTypes) return cachedServiceTypes;

  if (cachePromise) return cachePromise;

  cachePromise = fetch("/api/service-types")
    .then(res => res.json())
    .then(data => {
      cachedServiceTypes = Array.isArray(data) ? data : [];
      return cachedServiceTypes;
    })
    .catch(() => {
      cachedServiceTypes = [];
      return [];
    });

  return cachePromise;
}

// Clear cache (call when service types are updated in settings)
export function clearServiceTypeCache() {
  cachedServiceTypes = null;
  cachePromise = null;
}

// Build a lookup map from slug to display info
export function buildServiceTypeMap(types: ServiceTypeInfo[]): Record<string, ServiceTypeInfo> {
  const map: Record<string, ServiceTypeInfo> = {};
  types.forEach(t => {
    map[t.slug] = t;
  });
  return map;
}

// Fallback label formatter: "WEB_DEVELOPMENT" -> "Web Development"
export function formatServiceTypeSlug(slug: string): string {
  return slug.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Get display name for a service type slug
export function getServiceTypeName(slug: string, map?: Record<string, ServiceTypeInfo>): string {
  if (map && map[slug]) return map[slug].name;
  // Fallback: format the slug
  return formatServiceTypeSlug(slug);
}

// Get icon for a service type slug
export function getServiceTypeIcon(slug: string, map?: Record<string, ServiceTypeInfo>): string {
  if (map && map[slug]) return map[slug].icon || "📋";
  // Fallback defaults
  const defaults: Record<string, string> = {
    GENERAL: "⚙️", SEO: "🔍", AEO: "🤖", WEB_DEVELOPMENT: "💻",
    PAID_MEDIA: "📢", SOCIAL_MEDIA: "📱", CONTENT: "✍️",
    BRANDING: "🎨", CONSULTING: "💼",
  };
  return defaults[slug] || "📋";
}
