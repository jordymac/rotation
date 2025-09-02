import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { 
  ReleaseDetail, 
  TrackVM, 
  classifyConfidence, 
  calculateMatchSummary,
  canApproveRelease 
} from '@/types/admin-review';
import { getFeaturing } from '@/utils/featuring';

/**
 * GET /api/admin/review/release/[id]
 * Returns full release details for admin review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: releaseId } = await params;
    const database = getDatabase();

    // Get release basic info
    const release = await database.oneOrNone(`
      SELECT *
      FROM releases 
      WHERE id = $1
    `, [releaseId]);

    if (!release) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      );
    }

    // Get track matches
    const trackMatches = await database.any(`
      SELECT 
        track_index,
        platform,
        match_url,
        confidence,
        approved,
        verified_by,
        verified_at,
        created_at
      FROM track_matches
      WHERE release_id = $1
      ORDER BY track_index
    `, [parseInt(releaseId)]);

    // Parse tracks data from JSON - check if the column exists
    const tracksData = release.tracks_data || release.tracks || [];
    
    // Build track view models
    const tracks: TrackVM[] = tracksData.map((track: any, index: number) => {
      const match = trackMatches.find(tm => tm.track_index === index);
      
      // Extract featuring credits
      const featuring = getFeaturing({
        title: track.title,
        artists: track.artists || [],
        extraartists: track.extraartists || []
      });

      return {
        id: `${releaseId}-${index}`,
        position: track.position || (index + 1).toString(),
        title: track.title,
        featuring: featuring.length > 0 ? featuring : undefined,
        match: {
          confidence: match?.confidence || 0,
          source: match?.platform as any || null,
          url: match?.match_url,
          bucket: classifyConfidence(match?.confidence || 0)
        },
        status: match?.approved ? 'approved' : 
                match ? 'needs_review' : 'pending',
        duration: track.duration
      };
    });

    // Calculate match summary
    const matchSummary = calculateMatchSummary(tracks);

    // Build release detail
    const releaseDetail: ReleaseDetail = {
      id: release.id,
      discogsId: parseInt(release.discogs_id),
      title: release.title,
      artist: release.artist,
      coverUrl: release.thumb || release.cover_url || '',
      store: release.store_username,
      year: release.year,
      label: release.label,
      tracks,
      matchSummary,
      status: 'needs_review', // Default status since column doesn't exist
      canApprove: canApproveRelease(tracks)
    };

    return NextResponse.json(releaseDetail);

  } catch (error) {
    console.error('Failed to fetch release details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch release details' },
      { status: 500 }
    );
  }
}