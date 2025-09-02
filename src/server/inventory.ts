/**
 * Shared inventory management logic
 * Handles smart caching, background refresh, and data transformation
 */

import { createDiscogsService } from '@/lib/discogs-service';
import { 
  getCachedReleases, 
  queueReleaseForProcessing, 
  updateStoreSyncStats,
  getTrackMatchesForRelease,
  getDatabase,
  type CachedRelease
} from '@/lib/db';
import { singleFlight } from '@/lib/redis';

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
 * Get inventory for a store with smart caching
 */
export async function getInventoryForStore(
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
    return await handleGeneralFeed(logger, tracker);
  }

  tracker.start('store_setup');
  
  // Create store info object
  const storeInfo = {
    id: storeUsername,
    username: storeUsername,
    addedAt: new Date().toISOString()
  };
  
  tracker.end('store_setup');
  tracker.start('cache_fetch');

  // === SIMPLIFIED IMPLEMENTATION (BYPASS DATABASE) ===
  
  // STEP 1: Skip cached releases temporarily to avoid database timeouts
  logger.info(`Step 1: Skipping cached releases (database bypass mode)`);
  const cachedReleases: CachedRelease[] = [];
  logger.info(`Found ${cachedReleases.length} cached releases`);
  
  tracker.end('cache_fetch');
  tracker.start('fresh_data_decision');

  // STEP 2: Use single-flight pattern for fresh data fetch (if not forced to revalidate)
  let freshListings: any[] = [];
  
  if (revalidate || cachedReleases.length === 0) {
    // Only fetch fresh data if explicitly requested or no cache exists
    logger.info(`Step 2: Fetching fresh listings from Discogs API (${revalidate ? 'forced' : 'no cache'})`);
    tracker.end('fresh_data_decision');
    tracker.start('discogs_api_fetch');
    
    try {
      freshListings = await singleFlight(
        `inventory:${storeInfo.username}`,
        () => fetchDiscogsInventory(storeInfo.username),
        60 // 60 second lock
      );
      tracker.end('discogs_api_fetch');
      logger.info(`Found ${freshListings.length} fresh listings from API`);
    } catch (error) {
      tracker.end('discogs_api_fetch');
      logger.warn(`Fresh data fetch failed, using cached data:`, error);
      freshListings = []; // Fall back to cached data only
    }
  } else {
    // Return cached data immediately, trigger background refresh
    tracker.end('fresh_data_decision');
    logger.info(`Using cached data, triggering background refresh`);
    triggerBackgroundRefresh(storeInfo.username);
  }
  
  tracker.start('process_new_releases');

  // STEP 3: Identify new releases (not in cache)
  const newReleases = freshListings.filter((listing: any) => 
    !cachedReleases.some((cached: CachedRelease) => 
      parseInt(cached.discogs_id.toString()) === parseInt(listing.release.id.toString())
    )
  );
  logger.info(`Identified ${newReleases.length} new releases needing processing`);

  // STEP 4: Skip queuing temporarily to avoid database connections
  if (newReleases.length > 0) {
    logger.info(`Step 4: Skipping background processing queue (database bypass mode)`);
  }

  tracker.end('process_new_releases');
  tracker.start('transform_data');

  // STEP 5: Skip cached releases (none since we bypassed the cache)
  const transformedCachedReleases: any[] = [];

  // STEP 6: Skip database lookup for processed releases (bypass mode)

  const transformedNewReleases = await Promise.all(
    newReleases.map(async (item) => {
      // Fetch full release data to get track information
      let fullTrackData = item.release.tracklist || [];
      
      try {
        if (!fullTrackData || fullTrackData.length === 0) {
          const fullRelease = await fetchFullReleaseData(item.release.id);
          fullTrackData = fullRelease.tracklist || [];
        }
      } catch (error) {
        logger.error(`Error fetching full release data for ${item.release.id}:`, error);
      }

      // Skip processing status check (bypass mode)
      const trackMatches: any[] = [];

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
        trackMatches: trackMatches
      };
    })
  );

  // STEP 7: Merge cached + new releases (cached first for better UX)
  let mergedReleases = [
    ...transformedCachedReleases,
    ...transformedNewReleases
  ];

  // Apply development limit if specified
  if (developmentLimit && developmentLimit > 0) {
    mergedReleases = mergedReleases.slice(0, developmentLimit);
  }

  // STEP 8: Skip sync statistics update (bypass mode)
  logger.info(`Skipping sync statistics update (database bypass mode)`);

  const cacheHitRate = freshListings.length > 0 
    ? Math.round((cachedReleases.length / freshListings.length) * 100) 
    : 0;

  const isStaleCache = freshListings.length === 0 && cachedReleases.length > 0;
  
  tracker.end('transform_data');
  
  logger.info(`Completed inventory fetch:`);
  logger.info(`  - Cached releases: ${cachedReleases.length}`);
  logger.info(`  - New releases: ${newReleases.length}`);
  logger.info(`  - Total releases: ${mergedReleases.length}`);
  logger.info(`  - Cache hit rate: ${cacheHitRate}%`);

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
      processingQueueSize: newReleases.length,
      stale: isStaleCache
    }
  };
}

/**
 * Trigger background refresh without blocking the response
 */
async function triggerBackgroundRefresh(storeUsername: string) {
  setTimeout(async () => {
    try {
      console.log(`[Smart Cache] Background refresh starting for ${storeUsername}`);
      
      const freshListings = await singleFlight(
        `inventory:${storeUsername}`,
        () => fetchDiscogsInventory(storeUsername),
        60
      );
      
      const cachedReleases = await getCachedReleases(storeUsername);
      const newReleases = freshListings.filter((listing: any) => 
        !cachedReleases.some((cached: CachedRelease) => 
          parseInt(cached.discogs_id.toString()) === parseInt(listing.release.id.toString())
        )
      );
      
      if (newReleases.length > 0) {
        console.log(`[Smart Cache] Background refresh found ${newReleases.length} new releases`);
        
        await Promise.all(
          newReleases.map(async (listing) => {
            try {
              const fullReleaseData = await fetchFullReleaseData(listing.release.id);
              await queueReleaseForProcessing(
                storeUsername,
                listing.release.id,
                {
                  id: listing.release.id,
                  title: listing.release.title,
                  artist: listing.release.artist,
                  tracklist: fullReleaseData?.tracklist || listing.release.tracklist || []
                },
                1
              );
            } catch (error) {
              console.error(`[Smart Cache] Background refresh error queuing ${listing.release.id}:`, error);
            }
          })
        );
      }
      
      console.log(`[Smart Cache] Background refresh completed for ${storeUsername}`);
    } catch (error) {
      console.error(`[Smart Cache] Background refresh failed for ${storeUsername}:`, error);
    }
  }, 100);
}

async function handleGeneralFeed(logger: any, tracker: any): Promise<StoreInventoryResult> {
  const generalFeed = {
    id: 'general-feed',
    username: 'Rotation Feed'
  };
  
  try {
    tracker.start('general_feed_fetch');
    
    const discogsService = createDiscogsService();
    const curatedData = await discogsService.getCuratedFeed(20);
    
    logger.info('Curated feed data fetched:', {
      listingsLength: curatedData.listings?.length,
      pagination: curatedData.pagination
    });

    tracker.end('general_feed_fetch');
    tracker.start('enhance_listings');

    const enhancedListings = await Promise.all(
      (curatedData.listings || []).slice(0, 10).map(async (item: any) => {
        try {
          const discogsService = createDiscogsService();
          const fullRelease = await discogsService.getRelease(item.release.id);
          return {
            ...item,
            release: {
              ...item.release,
              tracklist: fullRelease.tracklist || [],
              genres: fullRelease.genres || [],
              styles: fullRelease.styles || []
            }
          };
        } catch (error) {
          logger.error(`Error fetching release ${item.release.id}:`, error);
          return item;
        }
      })
    );

    tracker.end('enhance_listings');

    const transformedReleases = enhancedListings.map((item: any) => ({
      id: item.release.id,
      title: item.release.title,
      artist: item.release.artist || 'Unknown Artist',
      year: item.release.year,
      label: Array.isArray(item.release.label) ? item.release.label[0] : (item.release.label || 'Unknown Label'),
      country: item.release.country,
      genre: Array.isArray(item.release.genres) ? item.release.genres : (item.release.genres ? [item.release.genres] : (Array.isArray(item.release.genre) ? item.release.genre : (item.release.genre ? [item.release.genre] : []))),
      style: Array.isArray(item.release.styles) ? item.release.styles : (item.release.styles ? [item.release.styles] : (Array.isArray(item.release.style) ? item.release.style : (item.release.style ? [item.release.style] : []))),
      thumb: item.release.thumbnail || (item.release.images && item.release.images.length > 0 ? item.release.images[0].uri150 || item.release.images[0].uri : null),
      resource_url: item.release.resource_url,
      uri: item.release.uri || `/release/${item.release.id}`,
      tracks: item.release.tracklist || [],
      price: item.price?.value ? `${item.price.currency} ${item.price.value}` : null,
      condition: item.condition,
      sleeve_condition: item.sleeve_condition,
      comments: item.comments,
      store: {
        id: generalFeed.id,
        username: generalFeed.username
      }
    })) || [];

    return {
      results: transformedReleases,
      pagination: curatedData.pagination || {
        page: 1,
        pages: 1,
        per_page: 20,
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
      pagination: {
        page: 1,
        pages: 0,
        per_page: 20,
        items: 0,
        urls: {}
      },
      store: generalFeed,
      cacheStats: {
        cached: 0,
        fresh: 0,
        total: 0,
        cacheHitRate: 0,
        processingQueueSize: 0,
        stale: false
      }
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
      const text = await response.text();
      if (!text.trim()) {
        console.warn('[Smart Cache] Empty response from Discogs inventory API');
        return [];
      }
      
      try {
        const data = JSON.parse(text);
        return data.listings || [];
      } catch (parseError) {
        console.error('[Smart Cache] JSON parse error for Discogs inventory:', parseError);
        return [];
      }
    } else {
      console.warn(`[Smart Cache] Discogs API returned ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error('[Smart Cache] Error fetching Discogs inventory:', error);
    return [];
  }
}

async function fetchFullReleaseData(releaseId: number): Promise<any> {
  try {
    const discogsService = createDiscogsService();
    const fullRelease = await discogsService.getRelease(releaseId);
    return fullRelease;
  } catch (error) {
    console.error(`[Smart Cache] Error fetching full release data for ${releaseId}:`, error);
    return {};
  }
}