/**
 * Supabase-based inventory management with batch RPC operations
 */

import { createDiscogsService } from '@/lib/discogs-service';
import { supabaseCachedReleases, supabaseBatch } from '@/lib/db-supabase';
import { singleFlight } from '@/lib/redis';
import { batchExecute } from '@/lib/supabase';

const DISCOGS_API_BASE = 'https://api.discogs.com';

export interface InventoryOptions {
  revalidate?: boolean;
  developmentLimit?: number;
  logger?: {
    info: (msg: string, ...args: any[]) => void;
    warn: (msg: string, ...args: any[]) => void;
    error: (msg: string, ...args: any[]) => void;
  };
  tracker?: {
    start: (op: string) => void;
    end: (op: string) => number;
  };
}

export interface StoreInventoryResult {
  results: any[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    urls: {};
  };
  store: {
    id: string;
    username: string;
  };
  cacheStats: {
    cached: number;
    fresh: number;
    total: number;
    cacheHitRate: number;
    processingQueueSize: number;
    stale: boolean;
  };
}

/**
 * Get inventory for a store using Supabase client and batch RPC
 */
export async function getInventoryForStoreSupabase(
  storeUsername: string, 
  options: InventoryOptions = {}
): Promise<StoreInventoryResult> {
  const {
    revalidate = false,
    developmentLimit,
    logger = console,
    tracker = { start: () => {}, end: () => 0 }
  } = options;

  // Handle general feed case
  if (storeUsername === 'general-feed') {
    return await handleGeneralFeedSupabase(logger, tracker);
  }

  tracker.start('store_setup');
  
  const storeInfo = {
    id: storeUsername,
    username: storeUsername,
    addedAt: new Date().toISOString()
  };
  
  tracker.end('store_setup');
  tracker.start('cache_fetch');

  // STEP 1: Get cached releases (fast Supabase query)
  logger.info(`Step 1: Getting cached releases for ${storeInfo.username}`);
  const cachedReleases = await supabaseCachedReleases.getForStore(storeInfo.username);
  logger.info(`Found ${cachedReleases.length} cached releases`);
  
  tracker.end('cache_fetch');
  tracker.start('fresh_data_decision');

  // STEP 2: Fetch fresh data if needed
  let freshListings: any[] = [];
  
  if (revalidate || cachedReleases.length === 0) {
    logger.info(`Step 2: Fetching fresh listings from Discogs API`);
    tracker.end('fresh_data_decision');
    tracker.start('discogs_api_fetch');
    
    try {
      freshListings = await singleFlight(
        `inventory:${storeInfo.username}`,
        () => fetchDiscogsInventory(storeInfo.username),
        60
      );
      tracker.end('discogs_api_fetch');
      logger.info(`Found ${freshListings.length} fresh listings from API`);
    } catch (error) {
      tracker.end('discogs_api_fetch');
      logger.warn(`Fresh data fetch failed, using cached data:`, error);
      freshListings = [];
    }
  } else {
    tracker.end('fresh_data_decision');
    logger.info(`Using cached data only`);
  }
  
  tracker.start('process_new_releases');

  // STEP 3: Transform data for response (no database writes during response)
  const transformedCachedReleases = cachedReleases.map((cached: any) => ({
    id: cached.discogs_id,
    title: cached.title,
    artist: cached.artist,
    year: cached.year,
    label: cached.label || 'Unknown Label',
    genre: cached.genres || [],
    style: cached.styles || [],
    thumb: cached.thumb,
    resource_url: cached.discogs_uri,
    uri: cached.discogs_uri || `/release/${cached.discogs_id}`,
    tracks: cached.tracklist || [],
    price: cached.price_value ? `${cached.price_currency} ${cached.price_value}` : null,
    condition: cached.condition,
    sleeve_condition: cached.sleeve_condition,
    comments: cached.comments,
    store: {
      id: storeInfo.id,
      username: storeInfo.username
    },
    isCached: true,
    audioMatchCount: cached.audio_match_count
  }));

  const transformedNewReleases = await batchExecute(
    freshListings.slice(0, developmentLimit || 10),
    async (item: any) => {
      let fullTrackData = item.release.tracklist || [];
      
      try {
        if (!fullTrackData || fullTrackData.length === 0) {
          const fullRelease = await fetchFullReleaseData(item.release.id);
          fullTrackData = fullRelease.tracklist || [];
        }
      } catch (error) {
        logger.error(`Error fetching full release data for ${item.release.id}:`, error);
      }

      return {
        id: item.release.id,
        title: item.release.title,
        artist: item.release.artist || 'Unknown Artist',
        year: item.release.year,
        label: Array.isArray(item.release.label) ? item.release.label[0] : (item.release.label || 'Unknown Label'),
        country: item.release.country,
        genre: item.release.genre || [],
        style: item.release.style || [],
        thumb: item.release.thumb,
        resource_url: item.release.resource_url,
        uri: item.release.uri || `/release/${item.release.id}`,
        tracks: fullTrackData,
        price: item.price?.value ? `${item.price.currency} ${item.price.value}` : null,
        condition: item.condition,
        sleeve_condition: item.sleeve_condition,
        comments: item.comments,
        listingId: item.id,
        listingUri: item.uri,
        store: {
          id: storeInfo.id,
          username: storeInfo.username
        },
        isCached: false,
        processingStatus: 'pending',
        audioMatchCount: 0,
        trackMatches: []
      };
    },
    3 // Limit concurrency
  );

  // STEP 4: Background batch ingest (don't wait for it)
  const newReleases = transformedNewReleases;
  if (newReleases.length > 0) {
    logger.info(`Step 4: Triggering background batch ingest for ${newReleases.length} releases`);
    
    // Fire and forget - don't block the response
    setImmediate(async () => {
      try {
        const result = await supabaseBatch.ingestListings(storeInfo.username, newReleases);
        console.log(`[Background] Batch ingest result:`, result);
      } catch (error) {
        console.error(`[Background] Batch ingest failed:`, error);
      }
    });
  }

  // STEP 5: Merge and return
  let mergedReleases = [
    ...transformedCachedReleases,
    ...transformedNewReleases
  ];

  if (developmentLimit && developmentLimit > 0) {
    mergedReleases = mergedReleases.slice(0, developmentLimit);
  }

  tracker.end('process_new_releases');
  
  const cacheHitRate = freshListings.length > 0 
    ? Math.round((cachedReleases.length / freshListings.length) * 100) 
    : 0;

  logger.info(`Completed inventory fetch: ${cachedReleases.length} cached + ${newReleases.length} fresh = ${mergedReleases.length} total`);

  return {
    results: mergedReleases,
    pagination: {
      page: 1,
      pages: 1,
      per_page: mergedReleases.length,
      items: mergedReleases.length,
      urls: {}
    },
    store: {
      id: storeInfo.id,
      username: storeInfo.username
    },
    cacheStats: {
      cached: cachedReleases.length,
      fresh: newReleases.length,
      total: mergedReleases.length,
      cacheHitRate: cacheHitRate,
      processingQueueSize: 0,
      stale: false
    }
  };
}

async function handleGeneralFeedSupabase(logger: any, tracker: any): Promise<StoreInventoryResult> {
  // Use existing general feed logic but without database calls
  const generalFeed = {
    id: 'general-feed',
    username: 'Rotation Feed'
  };
  
  try {
    tracker.start('general_feed_fetch');
    
    const discogsService = createDiscogsService();
    const curatedData = await discogsService.getCuratedFeed(10);
    
    tracker.end('general_feed_fetch');

    const transformedReleases = (curatedData.listings || []).map((item: any) => ({
      id: item.release.id,
      title: item.release.title,
      artist: item.release.artist || 'Unknown Artist',
      year: item.release.year,
      label: Array.isArray(item.release.label) ? item.release.label[0] : (item.release.label || 'Unknown Label'),
      genre: item.release.genre || [],
      style: item.release.style || [],
      thumb: item.release.thumb,
      tracks: item.release.tracklist || [],
      price: item.price?.value ? `${item.price.currency} ${item.price.value}` : null,
      condition: item.condition,
      store: generalFeed
    }));

    return {
      results: transformedReleases,
      pagination: curatedData.pagination || {
        page: 1,
        pages: 1,
        per_page: 10,
        items: transformedReleases.length,
        urls: {}
      },
      store: generalFeed,
      cacheStats: {
        cached: 0,
        fresh: transformedReleases.length,
        total: transformedReleases.length,
        cacheHitRate: 0,
        processingQueueSize: 0,
        stale: false
      }
    };
  } catch (error) {
    logger.error('Error fetching curated feed:', error);
    return {
      results: [],
      pagination: { page: 1, pages: 0, per_page: 10, items: 0, urls: {} },
      store: generalFeed,
      cacheStats: { cached: 0, fresh: 0, total: 0, cacheHitRate: 0, processingQueueSize: 0, stale: false }
    };
  }
}

async function fetchDiscogsInventory(username: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${DISCOGS_API_BASE}/users/${username}/inventory?status=For%20Sale&per_page=10&sort=listed&sort_order=desc`,
      {
        headers: {
          'User-Agent': 'Rotation/1.0 +https://rotation.app',
          'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.listings || [];
    } else {
      console.warn(`[Discogs] API returned ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error('[Discogs] Error fetching inventory:', error);
    return [];
  }
}

async function fetchFullReleaseData(releaseId: number): Promise<any> {
  try {
    const discogsService = createDiscogsService();
    const fullRelease = await discogsService.getRelease(releaseId);
    return fullRelease;
  } catch (error) {
    console.error(`[Discogs] Error fetching release ${releaseId}:`, error);
    return {};
  }
}