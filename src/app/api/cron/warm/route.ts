import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 5

export async function GET(request: Request) {
  try {
    // Verify this is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Warm the Prisma client and keep serverless functions alive
    // This prevents cold starts by running every 5 minutes
    const warmingQueries = await Promise.all([
      // Basic Prisma client warming
      prisma.$queryRaw`SELECT 1`,
      
      // Warm ActiveTimer queries (most common for timer API)
      prisma.activeTimer.findFirst({
        where: { userId: 'warm-dummy-id' },
        include: {
          user: true,
        }
      }),
      
      // Warm Client/Project/Task lookups (used by timer API)
      prisma.client.findFirst({ 
        where: { id: 'warm-dummy-id' },
        select: { id: true, name: true, nickname: true }
      }),
    ])
    
    return NextResponse.json({ 
      warmed: true, 
      timestamp: new Date().toISOString(),
      queriesWarmed: warmingQueries.length
    })
  } catch (error) {
    console.error('Warm cron error:', error)
    return NextResponse.json(
      { error: 'Failed to warm functions' },
      { status: 500 }
    )
  }
}
