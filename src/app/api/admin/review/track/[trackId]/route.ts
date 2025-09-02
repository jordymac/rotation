import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { TrackStatus, ReviewActionResponse } from '@/types/admin-review';

/**
 * PATCH /api/admin/review/track/[trackId]
 * Update track status (approve/reject/needs_review)
 * Idempotent operation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    const body = await request.json();
    const { status } = body as { status: TrackStatus };

    if (!['approved', 'rejected', 'needs_review'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, rejected, or needs_review' },
        { status: 400 }
      );
    }

    // Parse trackId format: "releaseId-trackIndex"
    const [releaseId, trackIndexStr] = trackId.split('-');
    const trackIndex = parseInt(trackIndexStr);

    if (!releaseId || isNaN(trackIndex)) {
      return NextResponse.json(
        { error: 'Invalid track ID format. Expected: releaseId-trackIndex' },
        { status: 400 }
      );
    }

    const database = getDatabase();

    // Check if track match exists
    const existingMatch = await database.oneOrNone(`
      SELECT * FROM track_matches 
      WHERE release_id = $1 AND track_index = $2
    `, [parseInt(releaseId), trackIndex]);

    if (!existingMatch) {
      return NextResponse.json(
        { error: 'Track match not found' },
        { status: 404 }
      );
    }

    // Update track status (idempotent)
    const approved = status === 'approved';
    const needsReview = status === 'needs_review';

    const updatedMatch = await database.one(`
      UPDATE track_matches 
      SET 
        approved = $1,
        verified_by = $2,
        verified_at = NOW()
      WHERE release_id = $3 AND track_index = $4
      RETURNING *
    `, [approved, 'system', parseInt(releaseId), trackIndex]); // TODO: Get actual user ID

    // Log the activity
    await database.none(`
      INSERT INTO review_activities (
        release_id, 
        track_id, 
        action, 
        user_id, 
        metadata
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (release_id, track_id, action, user_id) DO NOTHING
    `, [
      releaseId,
      trackId,
      status,
      'system', // TODO: Get actual user ID
      JSON.stringify({ 
        confidence: updatedMatch.confidence,
        platform: updatedMatch.platform,
        actionAt: new Date().toISOString()
      })
    ]);

    // Check if release can now be auto-approved
    if (approved) {
      const allTracksQuery = await database.one(`
        SELECT 
          COUNT(*) as total_tracks,
          COUNT(*) FILTER (WHERE approved = true OR confidence >= 0.92) as approved_tracks
        FROM track_matches 
        WHERE release_id = $1
      `, [parseInt(releaseId)]);

      // Auto-approve release if all tracks are approved
      if (allTracksQuery.approved_tracks === allTracksQuery.total_tracks) {
        await database.none(`
          UPDATE releases 
          SET status = 'completed', updated_at = NOW()
          WHERE id = $1 AND status != 'completed'
        `, [releaseId]);
      }
    }

    const response: ReviewActionResponse = {
      ok: true,
      version: 1, // TODO: Implement proper versioning
      updatedAt: updatedMatch.verified_at.toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to update track status:', error);
    return NextResponse.json(
      { error: 'Failed to update track status' },
      { status: 500 }
    );
  }
}