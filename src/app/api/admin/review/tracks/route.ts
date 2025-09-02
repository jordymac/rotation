import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { 
  TrackQueueItem, 
  TrackQueueResponse,
  TrackStatus,
  classifyConfidence,
  MatchBucket
} from '@/types/admin-review';
// import { getFeaturing } from '@/utils/featuring'; // TODO: Use when track data includes full metadata

/**
 * GET /api/admin/review/tracks
 * Returns paginated list of tracks for admin review (track-level interface)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as TrackStatus | 'all' | null;
    const search = searchParams.get('search');
    const store = searchParams.get('store');
    const confidence = searchParams.get('confidence') as MatchBucket | 'all' | null;

    const database = getDatabase();

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Status filter - map to track match status
    if (status && status !== 'all') {
      if (status === 'auto_approved') {
        conditions.push(`r.has_audio_matches = true AND r.confidence >= 0.92`);
      } else if (status === 'approved') {
        conditions.push(`r.approved = true`);
      } else if (status === 'rejected') {
        conditions.push(`r.approved = false`);
      } else if (status === 'needs_review') {
        conditions.push(`(r.has_audio_matches IS NULL OR r.has_audio_matches = false)`);
      }
    }

    // Confidence bucket filter
    if (confidence && confidence !== 'all') {
      if (confidence === 'top') {
        conditions.push(`tm.confidence >= 0.92`);
      } else if (confidence === 'fast') {
        conditions.push(`tm.confidence >= 0.85 AND tm.confidence < 0.92`);
      } else if (confidence === 'review') {
        conditions.push(`tm.confidence >= 0.65 AND tm.confidence < 0.85`);
      } else if (confidence === 'hide') {
        conditions.push(`tm.confidence < 0.50`);
      }
    }

    // Search filter
    if (search) {
      conditions.push(`(r.title ILIKE $${paramIndex} OR r.artist ILIKE $${paramIndex} OR tracks_data->>idx->>'title' ILIKE $${paramIndex})`);
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
      conditions.push(`tm.created_at < (SELECT created_at FROM track_matches WHERE id = $${paramIndex})`);
      values.push(cursor);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query to get all tracks from releases with actual track data, with optional track_matches
    const query = `
      WITH release_tracks AS (
        SELECT 
          r.id as release_id,
          r.discogs_id,
          r.title as release_title,
          r.artist,
          r.thumb as cover_url,
          r.store_username,
          r.year,
          r.label,
          r.tracklist,
          r.created_at as release_created_at,
          r.has_audio_matches,
          r.audio_match_count,
          generate_series(0, GREATEST(COALESCE(jsonb_array_length(r.tracklist), 3) - 1, 2)) as track_index
        FROM releases r
        ${whereClause.replace('tm.', 'r.')}
      )
      SELECT 
        rt.*,
        CASE 
          WHEN rt.tracklist IS NOT NULL AND jsonb_array_length(rt.tracklist) > rt.track_index
          THEN rt.tracklist->rt.track_index->>'title'
          ELSE 'Track ' || (rt.track_index + 1)
        END as track_title,
        CASE 
          WHEN rt.tracklist IS NOT NULL AND jsonb_array_length(rt.tracklist) > rt.track_index
          THEN rt.tracklist->rt.track_index->>'position'
          ELSE (rt.track_index + 1)::text
        END as track_position,
        CASE 
          WHEN rt.tracklist IS NOT NULL AND jsonb_array_length(rt.tracklist) > rt.track_index
          THEN rt.tracklist->rt.track_index->>'duration'
          ELSE null
        END as track_duration,
        tm.id as match_id,
        tm.platform,
        tm.match_url,
        tm.confidence,
        tm.approved,
        tm.created_at as match_created_at,
        tm.updated_at as match_updated_at
      FROM release_tracks rt
      LEFT JOIN track_matches tm ON rt.release_id = tm.release_id AND rt.track_index = tm.track_index
      ORDER BY rt.release_created_at DESC, rt.track_index
      LIMIT $${paramIndex}
    `;

    values.push(limit + 1); // Get one extra to check for more results

    const results = await database.any(query, values);
    
    // Check if there are more results
    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, -1) : results;

    // Transform to track queue items
    const trackItems: TrackQueueItem[] = items.map((row: any) => {
      // Determine status
      let trackStatus: TrackStatus;
      if (row.approved === true) {
        trackStatus = 'approved';
      } else if (row.approved === false) {
        trackStatus = 'rejected';
      } else if (row.confidence && row.confidence >= 0.92) {
        trackStatus = 'approved'; // Auto-approved
      } else if (row.has_audio_matches && !row.match_id) {
        trackStatus = 'approved'; // Release has matches but this track doesn't have specific match
      } else {
        trackStatus = 'needs_review';
      }

      return {
        id: `${row.release_id}-${row.track_index}`,
        trackId: row.match_id?.toString() || `${row.release_id}-${row.track_index}`,
        releaseId: row.release_id.toString(),
        discogsId: parseInt(row.discogs_id),
        position: row.track_position || (row.track_index + 1).toString(),
        title: row.track_title || `Track ${row.track_index + 1}`,
        featuring: undefined, // TODO: Extract from track title if needed
        artist: row.artist,
        releaseTitle: row.release_title,
        coverUrl: row.cover_url,
        store: row.store_username,
        duration: row.track_duration || undefined,
        year: row.year,
        label: row.label,
        match: {
          confidence: Math.round((row.confidence || 0) * 100),
          source: row.platform as any || null,
          url: row.match_url,
          bucket: classifyConfidence(row.confidence || 0)
        },
        status: trackStatus,
        createdAt: row.match_created_at?.toISOString() || row.release_created_at?.toISOString() || new Date().toISOString(),
        updatedAt: row.match_updated_at?.toISOString() || row.release_created_at?.toISOString() || new Date().toISOString()
      };
    });

    const response: TrackQueueResponse = {
      items: trackItems,
      pagination: {
        cursor: hasMore ? items[items.length - 2]?.match_id?.toString() : undefined,
        limit,
        hasMore
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to fetch track queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track queue' },
      { status: 500 }
    );
  }
}