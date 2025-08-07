import { NextRequest, NextResponse } from 'next/server';
import { adminStores } from '@/lib/storage';
import { createDiscogsService } from '@/lib/discogs-service';
import { 
  getCachedReleases, 
  queueReleaseForProcessing, 
  updateStoreSyncStats,
  getTrackMatchesForRelease,
  getDatabase,
  type CachedRelease
} from '@/lib/db';

const DISCOGS_API_BASE = 'https://api.discogs.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId: storeUsername } = await params;
    
    console.log(`[Smart Cache] Starting inventory fetch for store: ${storeUsername}`);
    
    // Handle general feed case - now uses real Discogs data (keep existing logic)
    if (storeUsername === 'general-feed') {
      return await handleGeneralFeed();
    }

    // Check if store exists in admin stores (optional validation)
    const stores = adminStores.getAll();
    const store = stores.find(s => s.username === storeUsername);
    
    // For direct username access, create store object if not in admin list
    const storeInfo = store || {
      id: storeUsername,
      username: storeUsername,
      addedAt: new Date().toISOString()
    };

    // === SMART CACHING IMPLEMENTATION ===
    
    // STEP 1: Get cached releases (with audio matches) from database
    console.log(`[Smart Cache] Step 1: Getting cached releases for ${storeInfo.username}`);
    const cachedReleases = await getCachedReleases(storeInfo.username);
    console.log(`[Smart Cache] Found ${cachedReleases.length} cached releases`);

    // STEP 2: Get fresh listings from Discogs API
    console.log(`[Smart Cache] Step 2: Fetching fresh listings from Discogs API`);
    const freshListings = await fetchDiscogsInventory(storeInfo.username);
    console.log(`[Smart Cache] Found ${freshListings.length} fresh listings from API`);

    // STEP 3: Identify new releases (not in cache)
    const newReleases = freshListings.filter((listing: any) => 
      !cachedReleases.some((cached: CachedRelease) => 
        parseInt(cached.discogs_id.toString()) === parseInt(listing.release.id.toString())
      )
    );
    console.log(`[Smart Cache] Identified ${newReleases.length} new releases needing processing`);

    // STEP 4: Queue new releases for background audio matching
    if (newReleases.length > 0) {
      console.log(`[Smart Cache] Step 4: Queuing ${newReleases.length} releases for background processing`);
      
      await Promise.all(
        newReleases.map(async (listing) => {
          try {
            // Fetch full release data for queuing
            const fullReleaseData = await fetchFullReleaseData(listing.release.id);
            await queueReleaseForProcessing(
              storeInfo.username,
              listing.release.id,
              {
                ...listing,
                release: {
                  ...listing.release,
                  ...fullReleaseData
                }
              },
              1 // Standard priority
            );
          } catch (error) {
            console.error(`[Smart Cache] Error queuing release ${listing.release.id}:`, error);
          }
        })
      );
    }

    // STEP 5: Transform cached releases to inventory format with track matches
    const transformedCachedReleases = await Promise.all(
      cachedReleases.map(async (cached: CachedRelease) => {
        // Fetch track matches for this cached release
        let trackMatches: Array<{
          trackIndex: number;
          approved: boolean;
          candidates: Array<{ confidence: number; platform: string; url: string; }>;
        }> = [];

        try {
          const dbTrackMatches = await getTrackMatchesForRelease(cached.discogs_id);
          if (dbTrackMatches && dbTrackMatches.length > 0) {
            trackMatches = dbTrackMatches.map(match => ({
              trackIndex: match.track_index,
              approved: match.approved,
              candidates: [{
                confidence: match.confidence,
                platform: match.platform,
                url: match.match_url
              }]
            }));
          } else {
            // No track matches found in database - this release was cached incorrectly
            // Return empty array to indicate processing complete but no matches
            trackMatches = [];
          }
        } catch (error) {
          console.error(`[Smart Cache] Error fetching track matches for release ${cached.discogs_id}:`, error);
          // On error, assume no matches found
          trackMatches = [];
        }

        return {
          id: cached.discogs_id,
          title: cached.title,
          artist: cached.artist,
          year: cached.year,
          label: cached.label || 'Unknown Label',
          country: '', // Not stored in cache
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
          // Smart cache metadata
          isCached: true,
          audioMatchCount: cached.audio_match_count,
          lastUpdated: cached.last_updated,
          // Track match data for UI
          trackMatches: trackMatches
        };
      })
    );

    // STEP 6: Transform new releases to inventory format (with enhanced track data)
    // First, check which releases have been processed in the queue
    const database = getDatabase();
    const processedReleaseIds = await database.manyOrNone(`
      SELECT discogs_id FROM processing_queue 
      WHERE store_username = $1 AND status = 'completed'
    `, [storeInfo.username]).then(results => 
      new Set(results.map(r => parseInt(r.discogs_id)))
    ).catch(() => new Set());

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
          console.error(`[Smart Cache] Error fetching full release data for ${item.release.id}:`, error);
          // Fall back to whatever track data we have
        }

        // Determine trackMatches state based on processing status
        const hasBeenProcessed = processedReleaseIds.has(parseInt(item.release.id));
        const trackMatches = hasBeenProcessed ? [] : undefined; // Empty array = processed but no matches, undefined = still processing

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
          tracks: fullTrackData, // Now includes full track data
          price: item.price?.value ? `${item.price.currency} ${item.price.value}` : null,
          condition: item.condition,
          sleeve_condition: item.sleeve_condition,
          comments: item.comments,
          store: {
            id: storeInfo.id,
            username: storeInfo.username
          },
          // Smart cache metadata
          isCached: false,
          processingStatus: hasBeenProcessed ? 'completed' : 'queued',
          audioMatchCount: 0,
          // Track match data for UI - undefined means still processing, empty array means no matches found  
          trackMatches: trackMatches
        };
      })
    );

    // STEP 7: Merge cached + new releases (cached first for better UX)
    const mergedReleases = [
      ...transformedCachedReleases,
      ...transformedNewReleases
    ];

    // STEP 8: Update sync statistics
    await updateStoreSyncStats(storeInfo.username, {
      listingsProcessed: freshListings.length,
      newReleases: newReleases.length,
      cachedServed: cachedReleases.length,
      audioMatches: 0 // Will be updated by background processing
    });

    const cacheHitRate = freshListings.length > 0 
      ? Math.round((cachedReleases.length / freshListings.length) * 100) 
      : 0;

    console.log(`[Smart Cache] Completed inventory fetch:`);
    console.log(`  - Cached releases: ${cachedReleases.length}`);
    console.log(`  - New releases: ${newReleases.length}`);
    console.log(`  - Total releases: ${mergedReleases.length}`);
    console.log(`  - Cache hit rate: ${cacheHitRate}%`);

    return NextResponse.json({
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
      // Smart cache metadata
      cacheStats: {
        cached: cachedReleases.length,
        fresh: newReleases.length,
        total: mergedReleases.length,
        cacheHitRate: cacheHitRate,
        processingQueueSize: newReleases.length
      }
    });

  } catch (error) {
    console.error('[Smart Cache] Error in inventory fetch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// === HELPER FUNCTIONS ===

async function handleGeneralFeed() {
  const generalFeed = {
    id: 'general-feed',
    username: 'Rotation Feed'
  };
  
  try {
    // Use DiscogsService to fetch real curated feed data
    const discogsService = createDiscogsService();
    const curatedData = await discogsService.getCuratedFeed(20);
    
    console.log('Curated feed data fetched:', {
      listingsLength: curatedData.listings?.length,
      pagination: curatedData.pagination
    });

    // Fetch full release details for first few items to get track data
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
          console.error(`Error fetching release ${item.release.id}:`, error);
          return item; // Return original item if fetch fails
        }
      })
    );

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

    return NextResponse.json({
      results: transformedReleases,
      pagination: curatedData.pagination || {
        page: 1,
        pages: 1,
        per_page: 20,
        items: transformedReleases.length,
        urls: {}
      },
      store: generalFeed
    });
  } catch (error) {
    console.error('Error fetching curated feed:', error);
    // Return empty results if real API fails - no mock data
    return NextResponse.json({
      results: [],
      pagination: {
        page: 1,
        pages: 0,
        per_page: 20,
        items: 0,
        urls: {}
      },
      store: generalFeed
    });
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
      
      const data = JSON.parse(text);
      return data.listings || [];
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