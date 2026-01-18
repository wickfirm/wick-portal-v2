import prisma from './prisma';
import { getCurrentTenant } from './tenant';

/**
 * Get a Prisma client with automatic agency filtering
 * This ensures all queries are scoped to the current tenant
 */
export async function getScopedPrisma() {
  const tenant = await getCurrentTenant();
  
  if (!tenant) {
    throw new Error('No tenant context available');
  }
  
  // Create a wrapper that adds agencyId filter to all queries
  return {
    agencyId: tenant.agencyId,
    
    // Conversations
    conversation: {
      findMany: (args?: any) => prisma.conversation.findMany({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      findUnique: (args: any) => prisma.conversation.findFirst({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
      findFirst: (args?: any) => prisma.conversation.findFirst({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      create: (args: any) => prisma.conversation.create({
        ...args,
        data: { ...args.data, agencyId: tenant.agencyId },
      }),
      update: (args: any) => prisma.conversation.update({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
      delete: (args: any) => prisma.conversation.delete({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
      count: (args?: any) => prisma.conversation.count({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
    },
    
    // Leads
    lead: {
      findMany: (args?: any) => prisma.lead.findMany({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      findUnique: (args: any) => prisma.lead.findFirst({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
      findFirst: (args?: any) => prisma.lead.findFirst({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      create: (args: any) => prisma.lead.create({
        ...args,
        data: { ...args.data, agencyId: tenant.agencyId },
      }),
      update: (args: any) => prisma.lead.update({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
      delete: (args: any) => prisma.lead.delete({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
      count: (args?: any) => prisma.lead.count({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
    },
    
    // Users (scoped to agency)
    user: {
      findMany: (args?: any) => prisma.user.findMany({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      findUnique: (args: any) => prisma.user.findFirst({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
      findFirst: (args?: any) => prisma.user.findFirst({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      create: (args: any) => prisma.user.create({
        ...args,
        data: { ...args.data, agencyId: tenant.agencyId },
      }),
      update: (args: any) => prisma.user.update({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
    },
    
    // AI Configuration
    aiConfiguration: {
      findFirst: (args?: any) => prisma.aIConfiguration.findFirst({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      create: (args: any) => prisma.aIConfiguration.create({
        ...args,
        data: { ...args.data, agencyId: tenant.agencyId },
      }),
      update: (args: any) => prisma.aIConfiguration.updateMany({
        ...args,
        where: { ...args.where, agencyId: tenant.agencyId },
      }),
    },
    
    // Bookings
    booking: {
      findMany: (args?: any) => prisma.booking.findMany({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      create: (args: any) => prisma.booking.create({
        ...args,
        data: { ...args.data, agencyId: tenant.agencyId },
      }),
    },
    
    // Conversation Analytics
    conversationAnalytics: {
      findMany: (args?: any) => prisma.conversationAnalytics.findMany({
        ...args,
        where: { ...args?.where, agencyId: tenant.agencyId },
      }),
      create: (args: any) => prisma.conversationAnalytics.create({
        ...args,
        data: { ...args.data, agencyId: tenant.agencyId },
      }),
    },
    
    // Messages (through conversation, so use with caution)
    message: prisma.message,
    
    // Raw access for complex queries (use with caution!)
    $raw: prisma,
  };
}
