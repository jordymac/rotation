import { NextRequest, NextResponse } from 'next/server';

interface MatchDecisionBody {
  platform: 'youtube' | 'soundcloud';
  candidateId: string;
  url: string;
  approved: boolean;
  confidence?: number;
  notes?: string;
}

// POST /api/admin/releases/[releaseId]/tracks/[trackId]/match
// Record a manual decision for a track match
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string; trackId: string }> }
) {
  try {
    const { releaseId, trackId } = await params;
    const body: MatchDecisionBody = await request.json();

    const { platform, candidateId, url, approved, confidence, notes } = body;

    // Validate required fields
    if (!platform || !candidateId || !url || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: platform, candidateId, url, approved' },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ['youtube', 'soundcloud'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be one of: youtube, soundcloud' },
        { status: 400 }
      );
    }

    console.log(`[API] Recording match decision for release ${releaseId}, track ${trackId}`);
    console.log(`[API] Platform: ${platform}, Approved: ${approved}, URL: ${url}`);

    // In a real implementation, you would:
    // 1. Validate that the release and track exist
    // 2. Store the decision in the database
    // 3. Update the track's verification status
    // 4. Log the decision for audit purposes
    // 5. Trigger any downstream processes (notifications, etc.)

    // Mock database storage
    const matchDecision = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      releaseId: parseInt(releaseId),
      trackId,
      platform,
      candidateId,
      url,
      approved,
      confidence: confidence || null,
      notes: notes || null,
      decidedBy: 'admin', // In real app, get from auth
      decidedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Simulate database save
    console.log('[API] Saving match decision:', matchDecision);

    // If approved, mark this track as having audio for this platform
    if (approved) {
      console.log(`[API] Track ${trackId} now has verified audio on ${platform}`);
      
      // Update track verification status
      // This would update your tracks table/collection
    }

    return NextResponse.json({
      success: true,
      data: matchDecision,
      message: `Match decision recorded successfully. Track ${approved ? 'approved' : 'rejected'} for ${platform}.`
    });

  } catch (error) {
    console.error('[API] Error recording match decision:', error);
    return NextResponse.json(
      { error: 'Failed to record match decision', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/releases/[releaseId]/tracks/[trackId]/match
// Get all match decisions for a specific track
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ releaseId: string; trackId: string }> }
) {
  try {
    const { releaseId, trackId } = await params;

    console.log(`[API] Fetching match decisions for release ${releaseId}, track ${trackId}`);

    // In a real implementation, you would query the database for all match decisions
    // for this specific track
    
    // Mock response
    const mockDecisions = [
      {
        id: 'match_1',
        releaseId: parseInt(releaseId),
        trackId,
        platform: 'youtube',
        candidateId: 'yt_mock123',
        url: 'https://youtube.com/watch?v=mock123',
        approved: true,
        confidence: 95,
        notes: 'Perfect match',
        decidedBy: 'admin',
        decidedAt: '2024-01-15T10:30:00.000Z',
        createdAt: '2024-01-15T10:30:00.000Z'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockDecisions,
      count: mockDecisions.length
    });

  } catch (error) {
    console.error('[API] Error fetching match decisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match decisions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}