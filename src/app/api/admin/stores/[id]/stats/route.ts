import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

const DISCOGS_API_BASE = 'https://api.discogs.com';

/**
 * Get total inventory count from Discogs (what store owners care about)
 */
async function getStoreInventoryCount(storeUsername: string) {
  try {
    const response = await fetch(
      `${DISCOGS_API_BASE}/users/${storeUsername}/inventory?status=For%20Sale&per_page=1&page=1`,
      {
        headers: {
          'User-Agent': 'Rotation/1.0 +https://rotation.app',
          'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      total_inventory: data.pagination?.items || 0,
      success: true
    };
  } catch (error) {
    console.warn(`[Admin Stats] Failed to get inventory count for ${storeUsername}:`, error);
    return {
      total_inventory: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Lightweight admin stats endpoint - NO heavy processing
 * Returns basic store metrics without triggering inventory refresh
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeUsername } = await params;
    const database = getDatabase();

    // Get store stats - total inventory from Discogs (what store owner cares about)
    const [inventoryStats, queueStats, syncStats] = await Promise.all([
      // Total store inventory count (call Discogs API directly)
      getStoreInventoryCount(storeUsername),
      
      // Processing queue status
      database.oneOrNone(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'queued') as pending,
          COUNT(*) FILTER (WHERE status = 'processing') as processing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) as total
        FROM processing_queue 
        WHERE store_username = $1
      `, [storeUsername]),
      
      // Sync statistics
      database.oneOrNone(`
        SELECT 
          listings_processed,
          new_releases_found as new_releases,
          cached_releases_served as cached_served,
          audio_matches_created as audio_matches,
          last_sync
        FROM store_sync_log 
        WHERE store_username = $1
        ORDER BY last_sync DESC 
        LIMIT 1
      `, [storeUsername])
    ]);

    // Audio match percentage (based on processed releases only)
    const audioMatchStats = await database.oneOrNone(`
      SELECT 
        COUNT(*) as processed_releases,
        COUNT(*) FILTER (WHERE has_audio_matches = true) as releases_with_matches,
        SUM(audio_match_count) as total_matches
      FROM releases 
      WHERE store_username = $1
    `, [storeUsername]);

    // Calculate audio match percentage of processed releases
    const audioMatchPercentage = audioMatchStats?.processed_releases > 0 
      ? Math.round((audioMatchStats.releases_with_matches / audioMatchStats.processed_releases) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        // Store inventory (what store owners care about)
        collectionCount: inventoryStats.total_inventory,
        inventoryStatus: inventoryStats.success ? 'active' : 'error',
        
        // Processing status
        queue: {
          pending: parseInt(queueStats?.pending || '0'),
          processing: parseInt(queueStats?.processing || '0'),
          completed: parseInt(queueStats?.completed || '0'),
          failed: parseInt(queueStats?.failed || '0'),
          total: parseInt(queueStats?.total || '0')
        },
        
        // Audio matching progress (for processed releases)
        audioMatchPercentage,
        processedReleases: parseInt(audioMatchStats?.processed_releases || '0'),
        totalMatches: parseInt(audioMatchStats?.total_matches || '0'),
        
        // System info (for troubleshooting)
        lastSync: syncStats?.last_sync || null,
        listingsProcessed: parseInt(syncStats?.listings_processed || '0'),
        
        // Business metrics (future)
        views: 0,
        wishlists: 0, 
        sales: 0
      }
    });

  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin stats', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}