import { NextRequest, NextResponse } from 'next/server';
import { withApiInstrumentation, getDevLimitFromEnv } from '@/lib/instrumentation';
import { getInventoryForStore } from '@/server/inventory';
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
async function handleFeed(
  request: NextRequest,
  _ctx: { params?: Record<string, string> },
  logger: any,
  tracker: any
) {
  const sp = request.nextUrl.searchParams;
  const storeId = sp.get('store') || 'general-feed';
  const cursor = parseInt(sp.get('cursor') || '0');
  const limit = Math.min(50, parseInt(sp.get('limit') || '20'));
  const devLimit = getDevLimitFromEnv(10);
  
  logger.info(`Getting feed data for store ${storeId} - cursor: ${cursor}, limit: ${limit}`);
  tracker.start('fetch_inventory');

  // Get releases from shared inventory logic
  const inventoryData = await getInventoryForStore(storeId, {
    revalidate: false,
    developmentLimit: devLimit,
    logger,
    tracker
  });
  
  tracker.end('fetch_inventory');
  tracker.start('apply_pagination');
  
  // Apply cursor pagination to results
  const allReleases = inventoryData.results || [];
  const startIndex = cursor;
  const endIndex = Math.min(startIndex + limit, allReleases.length);
  const paginatedReleases = allReleases.slice(startIndex, endIndex);
  
  tracker.end('apply_pagination');
  tracker.start('enhance_audio_matches');
  
  logger.info(`Found ${paginatedReleases.length} releases, fetching audio matches...`);

  // Skip audio matches temporarily to avoid database timeout issues
  // TODO: Re-enable once connection pooling is stable
  const enhancedReleases = paginatedReleases.map(release => ({
    ...release,
    audioMatches: []
  }));

  tracker.end('enhance_audio_matches');

  const totalMatches = enhancedReleases.reduce(
    (sum, release) => sum + (release.audioMatches?.length || 0), 
    0
  );

  logger.info(`Enhanced ${enhancedReleases.length} releases with ${totalMatches} total audio matches`);

  const response = NextResponse.json({
    success: true,
    results: enhancedReleases,
    pagination: {
      cursor,
      limit,
      hasNext: endIndex < allReleases.length,
      nextCursor: endIndex < allReleases.length ? endIndex.toString() : null,
      total: allReleases.length,
      developmentLimited: true,
      originalTotal: inventoryData.results?.length || 0
    },
    store: inventoryData.store,
    audioMatchesCount: totalMatches
  });

  // Add instrumentation headers
  response.headers.set('x-cache', inventoryData.cacheStats?.stale ? 'STALE' : 'FRESH');
  response.headers.set('x-feed-dev-limit', devLimit.toString());
  response.headers.set('x-audio-matches', totalMatches.toString());

  return response;
}

export const GET = withApiInstrumentation(handleFeed);