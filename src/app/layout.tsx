import { Providers } from "@/components/providers";
import { headers } from "next/headers";
import { getSubdomainFromHost, getTenantBySubdomain, PLATFORM_CONFIG } from "@/lib/tenant";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Get tenant config from middleware header (server-side, no flash!)
  const headersList = headers();
  const tenantSubdomain = headersList.get('x-tenant-subdomain');
  
  // Fallback: If middleware didn't set it, detect from host header
  const hostname = headersList.get('host') || '';
  const subdomain = tenantSubdomain || getSubdomainFromHost(hostname);
  const tenantConfig = getTenantBySubdomain(subdomain) || PLATFORM_CONFIG;
  
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f5f5f5" }}>
        <Providers tenantConfig={tenantConfig}>{children}</Providers>
      </body>
    </html>
  );
}
