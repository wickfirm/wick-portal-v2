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

    // Warm the Prisma client with a simple query
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({ 
      warmed: true, 
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    console.error('Warm cron error:', error)
    return NextResponse.json(
      { error: 'Failed to warm functions' },
      { status: 500 }
    )
  }
}
