import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { TrackStatus, ReviewActionResponse } from '@/types/admin-review';

/**
 * POST /api/admin/review/tracks/[id]/action
 * Updates track status (approve/reject/needs_review)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trackId } = await params;
    const { action }: { action: TrackStatus } = await request.json();

    const database = getDatabase();

    // Validate action
    if (!['approved', 'rejected', 'needs_review'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update track match status
    const result = await database.oneOrNone(`
      UPDATE track_matches 
      SET 
        approved = CASE 
          WHEN $2 = 'approved' THEN true
          WHEN $2 = 'rejected' THEN false
          ELSE NULL
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, updated_at
    `, [parseInt(trackId), action]);

    if (!result) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    const response: ReviewActionResponse = {
      ok: true,
      version: 1,
      updatedAt: result.updated_at.toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to update track action:', error);
    return NextResponse.json(
      { error: 'Failed to update track' },
      { status: 500 }
    );
  }
}