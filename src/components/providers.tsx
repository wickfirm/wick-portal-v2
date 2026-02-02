"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { QueryProvider } from "@/providers/query-provider";
import { TenantProvider } from "@/providers/tenant-provider";
import type { TenantConfig } from "@/lib/tenant";
import dynamic from "next/dynamic";

const FloatingTimerBubble = dynamic(() => import("./FloatingTimerBubble"), {
  ssr: false,
});

const FloatingPinnedNotes = dynamic(() => import("./FloatingPinnedNotes"), {
  ssr: false,
});

function AuthenticatedFloatingTimer() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return <FloatingTimerBubble />;
}

function AuthenticatedFloatingNotes() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return <FloatingPinnedNotes />;
}

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
        <QueryProvider>
          {children}
          <AuthenticatedFloatingTimer />
          <AuthenticatedFloatingNotes />
        </QueryProvider>
      </TenantProvider>
    </SessionProvider>
  );
}
