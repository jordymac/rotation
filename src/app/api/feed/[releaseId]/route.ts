import { NextRequest, NextResponse } from 'next/server';
import { getTrackMatchesForRelease } from '@/lib/db';

interface FullRelease {
  id: number;
  title: string;
  artist: string;
  year?: number;
  label?: string;
  catno?: string;
  thumb?: string;
  price?: string;
  condition?: string;
  uri?: string;
  listingUri?: string;
  genre?: string[];
  tracks: Array<{
    position: string;
    title: string;
    duration?: string;
  }>;
  audioMatches: Array<{
    trackIndex: number;
    platform: string;
    url: string;
    confidence: number;
  }>;
}

// GET /api/feed/[releaseId]
// Full endpoint that returns complete record data including tracks and audio matches
export async function GET(
  request: NextRequest,
  { params }: { params: { releaseId: string } }
) {
  try {
    const releaseId = parseInt(params.releaseId);
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store');
    
    console.log(`[API] Getting full data for release ${releaseId}${storeId ? ` from store ${storeId}` : ''}`);

    // Get the specific release from inventory
    let inventoryData;
    
    if (storeId) {
      const { GET: getStoreInventory } = await import('@/app/api/storefront/[storeId]/inventory/route');
      const mockRequest = new Request(`https://example.com/api/storefront/${storeId}/inventory`);
      const response = await getStoreInventory(mockRequest, { params: { storeId } });
      
      if (!response.ok) {
        throw new Error(`Store inventory API returned ${response.status}`);
      }
      
      const responseText = await response.text();
      if (!responseText.trim()) {
        inventoryData = { results: [], pagination: {}, store: { id: storeId, username: storeId } };
      } else {
        inventoryData = JSON.parse(responseText);
      }
    } else {
      const { GET: getStoreInventory } = await import('@/app/api/storefront/[storeId]/inventory/route');
      const mockRequest = new Request('https://example.com/api/storefront/general-feed/inventory');
      const response = await getStoreInventory(mockRequest, { params: { storeId: 'general-feed' } });
      
      if (!response.ok) {
        throw new Error(`General feed API returned ${response.status}`);
      }
      
      const responseText = await response.text();
      if (!responseText.trim()) {
        inventoryData = { results: [], pagination: {}, store: { id: 'general-feed', username: 'general-feed' } };
      } else {
        inventoryData = JSON.parse(responseText);
      }
    }
    
    const releases = inventoryData.results || [];
    const release = releases.find(r => r.id === releaseId);
    
    if (!release) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      );
    }

    // Get approved audio matches for this release
    let audioMatches = [];
    try {
      const matches = await getTrackMatchesForRelease(releaseId);
      audioMatches = matches
        .filter(match => match.approved)
        .map(match => ({
          trackIndex: match.track_index,
          platform: match.platform,
          url: match.match_url,
          confidence: match.confidence
        }));
    } catch (error) {
      console.error(`[API] Error getting matches for release ${releaseId}:`, error);
      // Continue without audio matches if there's an error
    }

    const fullRelease: FullRelease = {
      ...release,
      tracks: release.tracks || [],
      audioMatches
    };

    console.log(`[API] Full data for release ${releaseId}: ${fullRelease.tracks.length} tracks, ${audioMatches.length} audio matches`);

    return NextResponse.json({
      success: true,
      release: fullRelease,
      isLight: false
    });

  } catch (error) {
    console.error(`[API] Error getting full data for release ${params.releaseId}:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to get release data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}