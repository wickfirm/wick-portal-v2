"use client";

import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/providers/query-provider";
import { TenantProvider } from "@/providers/tenant-provider";
import type { TenantConfig } from "@/lib/tenant";

export function Providers({ 
  tenantConfig, 
  children 
}: { 
  tenantConfig: TenantConfig;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <TenantProvider tenantConfig={tenantConfig}>
        <QueryProvider>{children}</QueryProvider>
      </TenantProvider>
    </SessionProvider>
  );
}
