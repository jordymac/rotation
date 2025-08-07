import { NextRequest, NextResponse } from 'next/server';
import { EnhancedAudioMatchingService } from '@/lib/enhanced-audio-matching-service';
import { getOrComputeMatch } from '@/lib/match-service';

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
        'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
      },
    });

    if (!discogsResponse.ok) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const releaseText = await discogsResponse.text();
    if (!releaseText.trim()) {
      return NextResponse.json({ error: 'Empty response from Discogs API' }, { status: 502 });
    }
    
    const releaseData = JSON.parse(releaseText);

    // Extract release information
    const releaseTitle = releaseData.title;
    const releaseArtist = Array.isArray(releaseData.artists) 
      ? releaseData.artists[0]?.name 
      : releaseData.artists_sort || 'Unknown Artist';

    // Convert Discogs tracklist to our format
    const tracks = (releaseData.tracklist || []).map((track: any) => ({
      position: track.position,
      type_: track.type_ || 'track',
      title: track.title,
      duration: track.duration || '3:00',
      artists: track.artists?.map((a: any) => ({ name: a.name, id: a.id || 0 })) || []
    }));

    console.log(`[API] Starting audio matching for "${releaseTitle}" by ${releaseArtist}`);
    console.log(`[API] Processing ${Math.min(tracks.length, 10)} of ${tracks.length} tracks`);

    // Extract videos from Discogs data
    const discogsVideos = releaseData.videos || [];
    console.log(`[API] Found ${discogsVideos.length} embedded videos from Discogs`);

    // Perform enhanced audio matching (Discogs embeds + YouTube search fallback)
    const matchResult = await EnhancedAudioMatchingService.findMatches(
      releaseIdNum,
      releaseArtist,
      tracks,
      discogsVideos
    );

    // In a real implementation, you would:
    // 1. Store the auto-approved matches in the database
    // 2. Queue medium confidence matches for manual review
    // 3. Log all decisions for audit purposes

    console.log(`[API] Audio matching completed for release ${releaseIdNum}`);
    console.log(`[API] Discogs matches: ${matchResult.summary.discogsMatches}, Search matches: ${matchResult.summary.searchMatches}, No matches: ${matchResult.summary.noMatches}`);

    return NextResponse.json({
      success: true,
      data: matchResult,
      message: `Enhanced audio matching completed. ${matchResult.summary.discogsMatches} from Discogs embeds, ${matchResult.summary.searchMatches} from search, ${matchResult.summary.noMatches} unmatched.`
    });

  } catch (error) {
    console.error('[API] Error in audio matching:', error);
    return NextResponse.json(
      { error: 'Failed to perform audio matching', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/releases/[releaseId]/audio-match
// Get or compute audio match for a specific track
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
    const { trackIndex, releaseTitle, releaseArtist, trackInfo } = body;

    if (trackIndex === undefined || !releaseTitle || !releaseArtist || !trackInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: trackIndex, releaseTitle, releaseArtist, trackInfo' },
        { status: 400 }
      );
    }

    console.log(`[API] Getting audio match for track ${trackIndex} of "${releaseTitle}" by ${releaseArtist}`);

    // Fetch full Discogs release data to get embedded videos
    const discogsResponse = await fetch(`https://api.discogs.com/releases/${releaseIdNum}`, {
      headers: {
        'User-Agent': 'Rotation/1.0 +https://rotation.app',
        'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
      },
    });

    let discogsVideos = [];
    if (discogsResponse.ok) {
      const releaseText = await discogsResponse.text();
    if (!releaseText.trim()) {
      return NextResponse.json({ error: 'Empty response from Discogs API' }, { status: 502 });
    }
    
    const releaseData = JSON.parse(releaseText);
      discogsVideos = releaseData.videos || [];
      console.log(`[API] Found ${discogsVideos.length} embedded videos from Discogs`);
    }

    // Use the match service to get or compute the match
    const match = await getOrComputeMatch(
      releaseIdNum,
      trackIndex,
      'system', // admin user ID for auto-approval
      releaseTitle,
      releaseArtist,
      trackInfo,
      discogsVideos
    );

    console.log(`[API] Match result for track ${trackIndex}: ${match.platform} (confidence: ${match.confidence})`);

    return NextResponse.json({
      success: true,
      match: match,
      message: match.approved 
        ? `Audio match found and approved for track ${trackIndex + 1}`
        : `Audio match found but needs review for track ${trackIndex + 1}`
    });

  } catch (error) {
    console.error('[API] Error getting audio match:', error);
    return NextResponse.json(
      { error: 'Failed to get audio match', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}