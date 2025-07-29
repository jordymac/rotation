import { NextRequest, NextResponse } from 'next/server';
import { AudioMatchingService } from '@/lib/audio-matching-service';

// GET /api/admin/releases/[releaseId]/audio-match
// Initiate audio matching for a release (up to 10 tracks)
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

    // Get release details from Discogs API or database
    // For now, we'll fetch from the Discogs API
    const discogsResponse = await fetch(`https://api.discogs.com/releases/${releaseIdNum}`, {
      headers: {
        'User-Agent': 'Rotation/1.0 +https://rotation.app',
        'Authorization': `Discogs token=${process.env.DISCOGS_TOKEN}`,
      },
    });

    if (!discogsResponse.ok) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const releaseData = await discogsResponse.json();

    // Extract release information
    const releaseTitle = releaseData.title;
    const releaseArtist = Array.isArray(releaseData.artists) 
      ? releaseData.artists[0]?.name 
      : releaseData.artists_sort || 'Unknown Artist';

    // Convert Discogs tracklist to our format
    const tracks = (releaseData.tracklist || []).map((track: any) => ({
      position: track.position,
      title: track.title,
      duration: track.duration || '3:00',
      artists: track.artists || []
    }));

    console.log(`[API] Starting audio matching for "${releaseTitle}" by ${releaseArtist}`);
    console.log(`[API] Processing ${Math.min(tracks.length, 10)} of ${tracks.length} tracks`);

    // Perform audio matching
    const matchResult = await AudioMatchingService.findMatches(
      releaseIdNum,
      releaseTitle,
      releaseArtist,
      tracks
    );

    // In a real implementation, you would:
    // 1. Store the auto-approved matches in the database
    // 2. Queue medium confidence matches for manual review
    // 3. Log all decisions for audit purposes

    console.log(`[API] Audio matching completed for release ${releaseIdNum}`);
    console.log(`[API] Auto-approved: ${matchResult.summary.autoApproved}, Need review: ${matchResult.summary.needsReview}`);

    return NextResponse.json({
      success: true,
      data: matchResult,
      message: `Audio matching completed. ${matchResult.summary.autoApproved} matches auto-approved, ${matchResult.summary.needsReview} need manual review.`
    });

  } catch (error) {
    console.error('[API] Error in audio matching:', error);
    return NextResponse.json(
      { error: 'Failed to perform audio matching', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}