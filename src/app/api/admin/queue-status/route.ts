import { NextResponse } from 'next/server';
import { getQueuedReleases } from '@/lib/db';

export async function GET() {
  try {
    const queuedReleases = await getQueuedReleases(20);
    
    return NextResponse.json({
      success: true,
      queueSize: queuedReleases.length,
      releases: queuedReleases.map(r => ({
        id: r.id,
        discogs_id: r.discogs_id,
        store_username: r.store_username,
        status: r.status,
        queued_at: r.queued_at
      }))
    });
  } catch (error) {
    console.error('[Queue Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}