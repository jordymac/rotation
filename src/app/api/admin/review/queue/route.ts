import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { 
  ReleaseQueueItem, 
  QueueResponse, 
  ReleaseStatus,
  classifyConfidence,
  CONFIDENCE_THRESHOLDS 
} from '@/types/admin-review';

/**
 * GET /api/admin/review/queue
 * Returns paginated list of releases for admin review
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as ReleaseStatus | 'all' | null;
    const search = searchParams.get('search');
    const store = searchParams.get('store');

    const database = getDatabase();

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Status filter - for the simplified version, we'll map statuses to has_audio_matches
    if (status && status !== 'all') {
      if (status === 'completed') {
        conditions.push(`r.has_audio_matches = true`);
      } else if (status === 'auto_approved') {
        conditions.push(`r.has_audio_matches = true`);
      } else if (status === 'rejected') {
        conditions.push(`(r.has_audio_matches = false OR r.has_audio_matches IS NULL)`);
      } else if (status === 'needs_review') {
        // Show releases that don't have audio matches yet (need review)
        conditions.push(`(r.has_audio_matches = false OR r.has_audio_matches IS NULL)`);
      }
    }

    // Search filter
    if (search) {
      conditions.push(`(r.title ILIKE $${paramIndex} OR r.artist ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Store filter
    if (store) {
      conditions.push(`r.store_username = $${paramIndex}`);
      values.push(store);
      paramIndex++;
    }

    // Cursor pagination
    if (cursor) {
      conditions.push(`r.updated_at < (SELECT updated_at FROM releases WHERE id = $${paramIndex})`);
      values.push(cursor);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Simple test query first - let's see if we can get basic releases data
    const query = `
      SELECT 
        r.id::text as id,
        r.discogs_id,
        r.title,
        r.artist,
        COALESCE(r.thumb, '') as cover_url,
        r.store_username as store,
        CASE 
          WHEN r.has_audio_matches = true THEN 'auto_approved'
          ELSE 'needs_review'
        END as status,
        r.last_updated as updated_at,
        r.created_at,
        COALESCE(r.audio_match_count, 0) as total_tracks,
        0 as needs_review_count,
        CASE 
          WHEN r.created_at >= NOW() - INTERVAL '1 day' THEN 'new'
          WHEN r.created_at >= NOW() - INTERVAL '7 days' THEN 'recent'
          ELSE 'old'
        END as freshness
      FROM releases r
      ${whereClause}
      ORDER BY r.last_updated DESC
      LIMIT $${paramIndex}
    `;

    values.push(limit + 1); // Get one extra to check for more results

    const results = await database.any(query, values);
    
    // Check if there are more results
    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, -1) : results;

    // Transform to queue items
    const queueItems: ReleaseQueueItem[] = items.map((row: any) => ({
      id: row.id,
      discogsId: parseInt(row.discogs_id),
      title: row.title,
      artist: row.artist,
      coverUrl: row.cover_url,
      store: row.store,
      freshness: row.freshness as 'new' | 'recent' | 'old',
      needsReviewCount: parseInt(row.needs_review_count || '0'),
      totalTracks: parseInt(row.total_tracks || '0'),
      status: row.status as ReleaseStatus,
      updatedAt: row.updated_at.toISOString()
    }));

    const response: QueueResponse = {
      items: queueItems,
      pagination: {
        cursor: hasMore ? items[items.length - 2]?.id : undefined,
        limit,
        hasMore
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to fetch review queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review queue' },
      { status: 500 }
    );
  }
}