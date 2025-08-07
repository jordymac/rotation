import { NextRequest, NextResponse } from 'next/server';
import { getTrackMatchesForRelease } from '@/lib/db';

// GET /api/releases/[releaseId]/matches
// Get approved audio matches for a release
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const { releaseId } = await params;
    const releaseIdNum = parseInt(releaseId);

    if (isNaN(releaseIdNum)) {
      return NextResponse.json({ error: 'Invalid release ID' }, { status: 400 });
    }

    console.log(`[API] Getting approved matches for release ${releaseIdNum}`);

    // Get all approved matches for this release
    const matches = await getTrackMatchesForRelease(releaseIdNum);
    
    // Filter to only approved matches and format for frontend
    const approvedMatches = matches
      .filter(match => match.approved)
      .map(match => ({
        trackIndex: match.track_index,
        platform: match.platform,
        url: match.match_url,
        confidence: match.confidence,
        verifiedBy: match.verified_by,
        verifiedAt: match.verified_at
      }));

    console.log(`[API] Found ${approvedMatches.length} approved matches for release ${releaseIdNum}`);

    return NextResponse.json({
      success: true,
      releaseId: releaseIdNum,
      matches: approvedMatches,
      totalMatches: approvedMatches.length
    });

  } catch (error) {
    console.error('[API] Error getting approved matches:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get approved matches', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}