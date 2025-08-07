import { NextRequest, NextResponse } from 'next/server';
import { getTrackMatchesForRelease } from '@/lib/db';

interface FeedRelease {
  id: number;
  title: string;
  artist: string;
  year?: number;
  label?: string;
  catno?: string;
  thumb?: string;
  tracks: Array<{
    position: string;
    title: string;
    duration?: string;
  }>;
  audioMatches?: Array<{
    trackIndex: number;
    platform: string;
    url: string;
    confidence: number;
  }>;
}

// GET /api/feed
// Get feed data with approved audio matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store');
    
    console.log(`[API] Getting feed data${storeId ? ` for store ${storeId}` : ' (general)'}`);

    // Get releases from store inventory (direct function call instead of HTTP)
    let inventoryData;
    
    if (storeId) {
      // Import and call store inventory function directly
      const { GET: getStoreInventory } = await import('@/app/api/stores/[storeId]/inventory/route');
      const mockRequest = new Request(`https://example.com/api/stores/${storeId}/inventory`);
      const response = await getStoreInventory(mockRequest, { params: Promise.resolve({ storeId }) });
      inventoryData = await response.json();
    } else {
      // Import and call general feed function directly
      const { GET: getStoreInventory } = await import('@/app/api/stores/[storeId]/inventory/route');
      const mockRequest = new Request('https://example.com/api/stores/general-feed/inventory');
      const response = await getStoreInventory(mockRequest, { params: Promise.resolve({ storeId: 'general-feed' }) });
      inventoryData = await response.json();
    }
    
    const releases: FeedRelease[] = inventoryData.results || [];
    
    console.log(`[API] Found ${releases.length} releases, fetching audio matches...`);

    // Enhance releases with approved audio matches
    const enhancedReleases = await Promise.all(
      releases.map(async (release) => {
        try {
          // Get approved matches for this release
          const matches = await getTrackMatchesForRelease(release.id);
          const approvedMatches = matches
            .filter(match => match.approved)
            .map(match => ({
              trackIndex: match.track_index,
              platform: match.platform,
              url: match.match_url,
              confidence: match.confidence
            }));

          return {
            ...release,
            audioMatches: approvedMatches
          };
        } catch (error) {
          console.error(`[API] Error getting matches for release ${release.id}:`, error);
          // Return release without audio matches if there's an error
          return {
            ...release,
            audioMatches: []
          };
        }
      })
    );

    const totalMatches = enhancedReleases.reduce(
      (sum, release) => sum + (release.audioMatches?.length || 0), 
      0
    );

    console.log(`[API] Enhanced ${enhancedReleases.length} releases with ${totalMatches} total audio matches`);

    return NextResponse.json({
      success: true,
      results: enhancedReleases,
      pagination: inventoryData.pagination,
      store: inventoryData.store,
      audioMatchesCount: totalMatches
    });

  } catch (error) {
    console.error('[API] Error getting feed data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get feed data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}