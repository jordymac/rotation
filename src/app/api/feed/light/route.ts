import { NextRequest, NextResponse } from 'next/server';
import { withApiInstrumentation, getDevLimitFromEnv } from '@/lib/instrumentation';
import { getInventoryForStore } from '@/server/inventory';

interface LightRelease {
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
  trackCount?: number;
  hasAudioMatches?: boolean;
}

// GET /api/feed/light
// Fast endpoint that returns minimal record data for initial feed loading
async function handleLightFeed(
  request: NextRequest,
  _ctx: { params?: Record<string, string> },
  logger: any,
  tracker: any
) {
  const sp = request.nextUrl.searchParams;
  const storeId = sp.get('store');
  const cursor = sp.get('cursor') || '0';
  const limit = Math.min(50, parseInt(sp.get('limit') || '20'));
  
  if (!storeId) {
    return NextResponse.json({ error: 'Missing ?store parameter' }, { status: 400 });
  }
  
  logger.info(`Getting light feed data for store ${storeId} - cursor: ${cursor}, limit: ${limit}`);
  tracker.start('fetch_inventory');

  // Get releases from shared inventory logic
  const inventoryData = await getInventoryForStore(storeId, {
    revalidate: false, // Light endpoint never revalidates
    logger,
    tracker
  });
  
  const allReleases = inventoryData.results || [];
  tracker.end('fetch_inventory');
  
  // Development limit: cap at configurable limit
  const developmentLimit = getDevLimitFromEnv(10);
  const limitedReleases = allReleases.slice(0, developmentLimit);
  
  tracker.start('process_releases');
    
  // Apply cursor pagination
  const startIndex = parseInt(cursor);
  const endIndex = Math.min(startIndex + limit, limitedReleases.length);
  const paginatedReleases = limitedReleases.slice(startIndex, endIndex);
  
  // Convert to light format - minimal data for fast loading
  const lightReleases: LightRelease[] = paginatedReleases.map(release => ({
    id: release.id,
    title: release.title,
    artist: release.artist,
    year: release.year,
    label: release.label,
    catno: release.catno,
    thumb: release.thumb,
    price: release.price,
    condition: release.condition,
    uri: release.uri,
    listingUri: release.listingUri,
    genre: release.genre,
    trackCount: release.tracks?.length || 0,
    hasAudioMatches: false // Will be populated in stage 2
  }));
  
  tracker.end('process_releases');

  logger.info(`Light feed: returning ${lightReleases.length} releases (${startIndex}-${endIndex} of ${allReleases.length})`);
  logger.info(`Development limit applied: ${limitedReleases.length} of ${allReleases.length} total releases`);

  const response = NextResponse.json({
    success: true,
    results: lightReleases,
    pagination: {
      cursor: startIndex,
      limit,
      hasNext: endIndex < limitedReleases.length,
      nextCursor: endIndex < limitedReleases.length ? endIndex.toString() : null,
      total: limitedReleases.length,
      developmentLimited: true,
      originalTotal: allReleases.length
    },
    store: inventoryData.store,
    isLight: true // Flag to indicate this is light data
  });

  // Add instrumentation headers
  response.headers.set('x-cache', 'MISS'); // Light data is always fresh
  response.headers.set('x-feed-dev-limit', developmentLimit.toString());
  response.headers.set('x-releases-total', allReleases.length.toString());
  response.headers.set('x-releases-limited', limitedReleases.length.toString());

  return response;
}

export const GET = withApiInstrumentation(handleLightFeed);