import { supabase, executeRPC, batchExecute } from './supabase';

// Store management using Supabase client
export interface Store {
  id: string;
  username: string;
  addedAt: string;
}

export const supabaseStores = {
  async getAll(): Promise<Store[]> {
    try {
      const { data, error } = await supabase
        .from('admin_stores')
        .select('id, username, added_at')
        .order('added_at', { ascending: false });
      
      if (error) {
        console.error('[Supabase] Error getting stores:', error);
        return [];
      }
      
      return (data || []).map(store => ({
        id: store.id.toString(),
        username: store.username,
        addedAt: store.added_at
      }));
    } catch (error) {
      console.error('[Supabase] Error getting stores:', error);
      return [];
    }
  },

  async add(username: string): Promise<Store> {
    const { data, error } = await supabase
      .from('admin_stores')
      .upsert({ username })
      .select('id, username, added_at')
      .single();
    
    if (error) {
      console.error('[Supabase] Error adding store:', error);
      throw new Error(`Failed to add store: ${error.message}`);
    }
    
    return {
      id: data.id.toString(),
      username: data.username,
      addedAt: data.added_at
    };
  },

  async remove(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_stores')
        .delete()
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('[Supabase] Error removing store:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[Supabase] Error removing store:', error);
      return false;
    }
  }
};

// Track match operations using Supabase client
export interface TrackMatch {
  id?: number;
  release_id: number;
  track_index: number;
  platform: string;
  match_url: string;
  confidence: number;
  approved: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const supabaseTrackMatches = {
  async getForRelease(releaseId: number): Promise<TrackMatch[]> {
    try {
      const { data, error } = await supabase
        .from('track_matches')
        .select('*')
        .eq('release_id', releaseId)
        .order('track_index', { ascending: true });
      
      if (error) {
        console.error('[Supabase] Error getting track matches:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[Supabase] Error getting track matches:', error);
      return [];
    }
  },

  async save(match: Omit<TrackMatch, 'id' | 'created_at' | 'updated_at'>): Promise<TrackMatch | null> {
    try {
      const { data, error } = await supabase
        .from('track_matches')
        .upsert({
          release_id: match.release_id,
          track_index: match.track_index,
          platform: match.platform,
          match_url: match.match_url,
          confidence: match.confidence,
          approved: match.approved,
          verified_by: match.verified_by,
          verified_at: match.verified_at || new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('[Supabase] Error saving track match:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('[Supabase] Error saving track match:', error);
      return null;
    }
  }
};

// Batch operations using RPC
export const supabaseBatch = {
  async ingestListings(storeUsername: string, listings: any[]): Promise<{
    success: boolean;
    stats?: {
      inserted: number;
      updated: number;
      errors: number;
      total_processed: number;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await executeRPC('ingest_listings', {
        store_username: storeUsername,
        listings: listings
      });
      
      if (error) {
        return {
          success: false,
          error: error.message || 'RPC execution failed'
        };
      }
      
      return data;
    } catch (error) {
      console.error('[Supabase] Batch ingest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Cached releases using Supabase client  
export const supabaseCachedReleases = {
  async getForStore(storeUsername: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('releases')
        .select(`
          discogs_id, title, artist, year, label, catno, thumb,
          genres, styles, tracklist, images, discogs_uri,
          price_value, price_currency, condition, sleeve_condition, comments,
          audio_match_count, last_updated
        `)
        .eq('store_username', storeUsername)
        .eq('has_audio_matches', true)
        .order('last_updated', { ascending: false });
      
      if (error) {
        console.error('[Supabase] Error getting cached releases:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[Supabase] Error getting cached releases:', error);
      return [];
    }
  }
};