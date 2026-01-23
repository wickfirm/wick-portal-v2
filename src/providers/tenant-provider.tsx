"use client";

import { createContext, useContext } from "react";
import type { TenantConfig } from "@/lib/tenant";
import { PLATFORM_CONFIG } from "@/lib/tenant";

const TenantContext = createContext<TenantConfig>(PLATFORM_CONFIG);

export function TenantProvider({ 
  tenantConfig, 
  children 
}: { 
  tenantConfig: TenantConfig;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={tenantConfig}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant configuration
 * No more client-side subdomain detection - config comes from server!
 */
export function useTenant() {
  return useContext(TenantContext);
}
