import { NextRequest, NextResponse } from 'next/server';
import { withApiInstrumentation } from '@/lib/instrumentation';
import { getStoreInventory, type DiscogsRelease } from '@/utils/discogs';

/**
 * Admin inventory endpoint - returns FULL Discogs inventory for management
 * Unlike the public inventory API, this shows ALL releases regardless of audio match status
 */
async function handleAdminInventory(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  logger: any,
  tracker: any
) {
  const { id: storeUsername } = await params;
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('per_page') || '50'), 100); // Max 100 for admin
  
  logger.info(`Admin inventory request for store: ${storeUsername} (page ${page}, ${perPage} per page)`);
  
  try {
    // Direct Discogs API call - no caching, no filtering
    const result = await getStoreInventory(storeUsername);

    if (!result.results) {
      return NextResponse.json({
        error: 'No inventory found',
        store: { id: storeUsername, username: storeUsername },
        results: [],
        pagination: {
          page: 1,
          pages: 1,
          per_page: perPage,
          items: 0
        }
      });
    }

    logger.info(`Admin inventory: Found ${result.results.length} releases for ${storeUsername}`);

    // Transform releases to match expected format
    const transformedReleases: DiscogsRelease[] = result.results.map((item: any) => ({
      id: item.release.id,
      title: item.release.title,
      artist: item.release.artist,
      year: item.release.year,
      label: item.release.labels?.[0]?.name || '',
      catno: item.release.labels?.[0]?.catno || '',
      thumb: item.release.thumb || item.release.images?.[0]?.uri || '',
      genre: item.release.genres || [],
      style: item.release.styles || [],
      tracks: [], // Will be loaded individually for audio matching
      audioMatches: [], // Will be populated when needed
      price: item.price?.value ? `${item.price.currency} ${item.price.value}` : '',
      condition: item.condition || '',
      uri: item.release.resource_url,
      listingUri: item.uri,
      images: item.release.images || []
    }));

    return NextResponse.json({
      success: true,
      store: {
        id: storeUsername,
        username: storeUsername
      },
      results: transformedReleases,
      pagination: {
        page: result.pagination?.page || page,
        pages: result.pagination?.pages || 1,
        per_page: result.pagination?.per_page || perPage,
        items: result.pagination?.items || transformedReleases.length
      }
    });

  } catch (error) {
    logger.error('Admin inventory error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch admin inventory',
        details: error instanceof Error ? error.message : 'Unknown error',
        store: { id: storeUsername, username: storeUsername },
        results: [],
        pagination: { page: 1, pages: 1, per_page: perPage, items: 0 }
      },
      { status: 500 }
    );
  }
}

export const GET = withApiInstrumentation(handleAdminInventory);