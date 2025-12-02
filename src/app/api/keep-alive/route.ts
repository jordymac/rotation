import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

/**
 * Keep-Alive endpoint to prevent Supabase from pausing
 * Should be pinged by external monitoring service (e.g., UptimeRobot, Cron-Job.org)
 */
export async function GET() {
  try {
    const database = getDatabase();

    // Simple query to keep connection active
    await database.one('SELECT NOW() as timestamp');

    return NextResponse.json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Keep-Alive] Database error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
