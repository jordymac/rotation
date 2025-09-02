import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = getDatabase();
    
    // Find releases that exist in both processing_queue and releases table
    const matchingReleases = await database.manyOrNone(`
      SELECT 
        pq.discogs_id,
        pq.store_username,
        pq.status as queue_status,
        r.id as release_id,
        r.title,
        r.artist
      FROM processing_queue pq
      INNER JOIN releases r ON pq.discogs_id = r.discogs_id AND pq.store_username = r.store_username
      WHERE pq.status = 'queued'
      LIMIT 5
    `);
    
    // If we found some, let's manually reset a few to test
    if (matchingReleases.length > 0) {
      const firstRelease = matchingReleases[0];
      await database.none(`
        UPDATE processing_queue 
        SET status = 'queued', started_at = NULL 
        WHERE discogs_id = $1 AND store_username = $2
      `, [firstRelease.discogs_id, firstRelease.store_username]);
    }
    
    return NextResponse.json({
      success: true,
      matching_releases: matchingReleases,
      found_count: matchingReleases.length
    });
    
  } catch (error) {
    console.error('Find matching releases error:', error);
    return NextResponse.json(
      { error: 'Find failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}