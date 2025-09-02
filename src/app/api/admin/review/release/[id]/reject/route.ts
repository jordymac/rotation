import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ReviewActionResponse } from '@/types/admin-review';

/**
 * POST /api/admin/review/release/[id]/reject
 * Reject entire release
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: releaseId } = await params;
    const database = getDatabase();

    // Update release status
    const updatedRelease = await database.one(`
      UPDATE releases 
      SET 
        status = 'rejected',
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, updated_at
    `, [releaseId]);

    // Mark all track matches as rejected
    await database.none(`
      UPDATE track_matches 
      SET 
        approved = false,
        verified_by = 'system',
        verified_at = NOW()
      WHERE release_id = $1
    `, [parseInt(releaseId)]);

    // Log the rejection activity
    await database.none(`
      INSERT INTO review_activities (
        release_id, 
        action, 
        user_id, 
        metadata
      ) VALUES ($1, $2, $3, $4)
    `, [
      releaseId,
      'rejected',
      'system', // TODO: Get actual user ID from auth
      JSON.stringify({ 
        rejectedAt: new Date().toISOString(),
        reason: 'Manual rejection by admin'
      })
    ]);

    const response: ReviewActionResponse = {
      ok: true,
      version: 1, // TODO: Implement proper versioning
      updatedAt: updatedRelease.updated_at.toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to reject release:', error);
    return NextResponse.json(
      { error: 'Failed to reject release' },
      { status: 500 }
    );
  }
}