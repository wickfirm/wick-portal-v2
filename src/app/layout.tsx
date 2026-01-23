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
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5f5f5" }}>
        <Providers tenantConfig={tenantConfig}>{children}</Providers>
      </body>
    </html>
  );
}
