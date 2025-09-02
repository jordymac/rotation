import { NextRequest, NextResponse } from 'next/server';
import { supabaseStores } from '@/lib/db-supabase';

const DISCOGS_API_BASE = 'https://api.discogs.com';

interface StoreInfo {
  id: string;
  username: string;
  displayName: string;
  description?: string;
  avatar_url?: string;
  inventory_count: number;
  rating: string;
  location: string;
  html_url: string;
}

// GET /api/storefront/directory
// Get lightweight store directory with metadata only (no inventory data)
export async function GET(request: NextRequest) {
  try {
    console.log('[Store Directory] Fetching store directory...');
    
    // Get admin stores list
    const stores = await supabaseStores.getAll();
    console.log(`[Store Directory] Found ${stores.length} admin stores`);
    
    // Fetch basic store metadata from Discogs (no inventory)
    const storeInfos = await Promise.all(
      stores.map(async (store) => {
        try {
          console.log(`[Store Directory] Fetching metadata for ${store.username}`);
          
          // Get store profile from Discogs (lightweight call)
          const response = await fetch(
            `${DISCOGS_API_BASE}/users/${store.username}`,
            {
              headers: {
                'User-Agent': 'Rotation/1.0 +https://rotation.app',
                'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
              },
            }
          );

          if (response.ok) {
            const userData = await response.json();
            
            // Get just the inventory count (not the actual inventory)
            let inventoryCount = 0;
            try {
              const inventoryCountResponse = await fetch(
                `${DISCOGS_API_BASE}/users/${store.username}/inventory?per_page=1`,
                {
                  headers: {
                    'User-Agent': 'Rotation/1.0 +https://rotation.app',
                    'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
                  },
                }
              );
              
              if (inventoryCountResponse.ok) {
                const countData = await inventoryCountResponse.json();
                inventoryCount = countData.pagination?.items || 0;
              }
            } catch (error) {
              console.error(`[Store Directory] Error getting inventory count for ${store.username}:`, error);
            }

            const storeInfo: StoreInfo = {
              id: store.username,
              username: store.username,
              displayName: userData.name || store.username.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              description: userData.profile || 'Record store with curated vinyl selection',
              avatar_url: userData.avatar_url,
              inventory_count: inventoryCount,
              rating: userData.seller_rating_avg || '0',
              location: userData.location || 'Worldwide',
              html_url: userData.html_url || `https://www.discogs.com/user/${store.username}`
            };

            console.log(`[Store Directory] ✓ ${store.username}: ${inventoryCount} items`);
            return storeInfo;
          } else {
            console.warn(`[Store Directory] Failed to fetch data for ${store.username}: ${response.status}`);
            
            // Return minimal store info if API fails
            return {
              id: store.username,
              username: store.username,
              displayName: store.username.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              description: 'Record store with curated vinyl selection',
              inventory_count: 0,
              rating: '0',
              location: 'Worldwide',
              html_url: `https://www.discogs.com/user/${store.username}`
            } as StoreInfo;
          }
        } catch (error) {
          console.error(`[Store Directory] Error fetching store data for ${store.username}:`, error);
          
          // Return minimal store info on error
          return {
            id: store.username,
            username: store.username,
            displayName: store.username.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            description: 'Record store with curated vinyl selection',
            inventory_count: 0,
            rating: '0',
            location: 'Worldwide',
            html_url: `https://www.discogs.com/user/${store.username}`
          } as StoreInfo;
        }
      })
    );

    console.log(`[Store Directory] Successfully loaded ${storeInfos.length} stores`);

    return NextResponse.json({
      success: true,
      stores: storeInfos,
      total: storeInfos.length
    });

  } catch (error) {
    console.error('[Store Directory] Error getting store directory:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get store directory', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}