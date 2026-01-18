// src/lib/agency-filter.ts
// Helper to get agency filter for multi-tenant data isolation

import { Session } from "next-auth";
import prisma from "./prisma";

/**
 * Get agencyId filter from session user
 * This ensures data is scoped to the user's agency
 */
export async function getAgencyFilter(session: Session | null) {
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { agencyId: true, role: true },
  });

  return user?.agencyId || null;
}

/**
 * Get agency filter for Prisma where clause
 * Returns empty object if no agency (shows nothing)
 */
export async function getAgencyWhereFilter(session: Session | null) {
  const agencyId = await getAgencyFilter(session);
  
  // If user has no agency, return impossible filter (show nothing)
  if (!agencyId) {
    return { agencyId: "no-agency" };
  }

  return { agencyId };
}
