import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = getDatabase();
    
    // Get a few queued releases
    const queuedReleases = await database.manyOrNone(`
      SELECT discogs_id, store_username, status 
      FROM processing_queue 
      WHERE status IN ('queued', 'processing') 
      ORDER BY queued_at DESC 
      LIMIT 5
    `);
    
    // Check which ones exist in releases table
    const results = [];
    for (const queued of queuedReleases) {
      const releaseExists = await database.oneOrNone(`
        SELECT id, title, artist 
        FROM releases 
        WHERE discogs_id = $1 AND store_username = $2
      `, [queued.discogs_id, queued.store_username]);
      
      results.push({
        queue_discogs_id: queued.discogs_id,
        queue_store: queued.store_username,
        queue_status: queued.status,
        release_exists: !!releaseExists,
        release_data: releaseExists || null
      });
    }
    
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Check queue releases error:', error);
    return NextResponse.json(
      { error: 'Check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}