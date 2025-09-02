import { NextRequest, NextResponse } from 'next/server';
import { approveMatch, rejectMatch } from '@/lib/audio-match-orchestrator';

// POST /api/admin/releases/[releaseId]/approve-match
// Approve an audio match for a track
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const { releaseId } = await params;
    const releaseIdNum = parseInt(releaseId);

    if (isNaN(releaseIdNum)) {
      return NextResponse.json({ error: 'Invalid release ID' }, { status: 400 });
    }

    const body = await request.json();
    const { trackIndex, platform, url, confidence, action } = body;

    if (trackIndex === undefined || !platform || !url || confidence === undefined || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: trackIndex, platform, url, confidence, action' },
        { status: 400 }
      );
    }

    console.log(`[API] ${action === 'approve' ? 'Approving' : 'Rejecting'} match for release ${releaseIdNum}, track ${trackIndex}`);

    let result;
    if (action === 'approve') {
      result = await approveMatch(
        releaseIdNum,
        trackIndex,
        platform,
        url,
        confidence,
        'system' // TODO: Use actual user ID when auth is implemented
      );
    } else if (action === 'reject') {
      result = await rejectMatch(
        releaseIdNum,
        trackIndex,
        'system' // TODO: Use actual user ID when auth is implemented
      );
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    console.log(`[API] Match ${action} completed for release ${releaseIdNum}, track ${trackIndex}`);

    return NextResponse.json({
      success: true,
      action: action,
      result: result,
      message: `Match ${action}d successfully`
    });

  } catch (error) {
    console.error('[API] Error managing match:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage match', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}