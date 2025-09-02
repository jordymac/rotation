import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ReviewActionResponse } from '@/types/admin-review';

/**
 * POST /api/admin/review/release/[id]/approve
 * Approve entire release (validates all tracks are approved)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: releaseId } = await params;
    const database = getDatabase();

    // Verify all tracks are approved or auto-approved
    const unapprovedTracks = await database.any(`
      SELECT track_index, confidence
      FROM track_matches 
      WHERE release_id = $1 AND approved = false AND confidence < 0.92
    `, [parseInt(releaseId)]);

    if (unapprovedTracks.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot approve release with unapproved tracks',
          unapprovedTracks: unapprovedTracks.map(t => t.track_index)
        },
        { status: 400 }
      );
    }

    // Update release status
    const updatedRelease = await database.one(`
      UPDATE releases 
      SET 
        status = 'completed',
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, updated_at
    `, [releaseId]);

    // Log the approval activity
    await database.none(`
      INSERT INTO review_activities (
        release_id, 
        action, 
        user_id, 
        metadata
      ) VALUES ($1, $2, $3, $4)
    `, [
      releaseId,
      'approved',
      'system', // TODO: Get actual user ID from auth
      JSON.stringify({ 
        totalTracks: await database.one('SELECT COUNT(*) FROM track_matches WHERE release_id = $1', [parseInt(releaseId)]).then(r => r.count),
        approvedAt: new Date().toISOString()
      })
    ]);

    const response: ReviewActionResponse = {
      ok: true,
      version: 1, // TODO: Implement proper versioning
      updatedAt: updatedRelease.updated_at.toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to approve release:', error);
    return NextResponse.json(
      { error: 'Failed to approve release' },
      { status: 500 }
    );
  }
}