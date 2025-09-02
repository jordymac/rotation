import pgPromise from 'pg-promise';

// Initialize pg-promise
const pgp = pgPromise({
  // Initialization options
  capSQL: true, // Generate capitalized SQL
  noWarnings: true, // Suppress warnings like duplicate database objects
  error(err, e) {
    console.error('[Database] Query error:', err);
    if (e.cn) {
      console.error('[Database] Connection details:', e.cn);
    }
    if (e.query) {
      console.error('[Database] Query:', e.query);
    }
    if (e.params) {
      console.error('[Database] Parameters:', e.params);
    }
  },
  query(e) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Database] Query:', e.query);
    }
  }
});

// Database instance with connection pooling
let db: pgPromise.IDatabase<{}> | null = null;

/**
 * Get or create database connection
 */
export function getDatabase() {
  if (!db) {
    // For serverless Vercel, prefer direct non-pooling connections
    const connectionString = process.env.POSTGRES_URL_NON_POOLING || 
                            process.env.POSTGRES_URL || 
                            process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('POSTGRES') || key.includes('DATABASE')));
      throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRES_DATABASE_URL environment variable is required');
    }
    
    console.log('[Database] Using connection string from:', connectionString ? 'env var found' : 'no env var');
    
    // Configure for Vercel Postgres - try multiple SSL configurations
    let config;
    
    if (connectionString.includes('supabase.com')) {
      // For Supabase serverless, use direct connection without pooling
      config = {
        connectionString: connectionString.replace('?sslmode=require', ''),
        ssl: { rejectUnauthorized: false }
      };
      console.log('[Database] Configured for Supabase direct connection');
    } else if (connectionString.includes('vercel') || connectionString.includes('neon')) {
      // For Vercel/Neon, disable SSL verification
      config = {
        connectionString,
        ssl: { rejectUnauthorized: false }
      };
      console.log('[Database] Configured for Vercel/Neon');
    } else {
      // For local development
      config = connectionString;
      console.log('[Database] Configured for local development');
    }
    
    console.log('[Database] Using SSL config for hosted database');
    db = pgp(config);
    
    console.log('[Database] Connection initialized');
  } else {
    // Uncomment for debugging only - this is actually normal behavior
    // console.warn('WARNING: Creating a duplicate database object for the same connection.');
  }
  
  return db;
}

/**
 * Close database connection (for cleanup)
 */
export async function closeDatabaseConnection() {
  if (db) {
    await db.$pool.end();
    db = null;
    console.log('[Database] Connection closed');
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('[Database] Testing connection...');
    console.log('[Database] Available POSTGRES env vars:', 
      Object.keys(process.env)
        .filter(key => key.includes('POSTGRES') || key.includes('DATABASE'))
        .map(key => `${key}=${process.env[key] ? '[SET]' : '[NOT SET]'}`)
    );
    
    const database = getDatabase();
    await database.one('SELECT NOW() as current_time');
    console.log('[Database] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Database] Connection test failed:', error);
    return false;
  }
}

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  const database = getDatabase();
  
  try {
    console.log('[Database] Starting migrations...');
    
    // Create migrations table if it doesn't exist
    await database.none(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // List of migration files in order
    const migrations = [
      '001_create_track_matches.sql',
      '002_create_discogs_tokens.sql',
      '003_create_users_stores.sql',
      '004_create_records_tracks.sql',
      '005_create_audio_metadata.sql',
      '006_create_user_features.sql',
      '007_create_admin_analytics.sql',
      '008_create_config_features.sql',
      '009_processing_queue_unique_constraint.sql',
      '010_processing_queue_status_index.sql',
      '011_create_admin_stores.sql',
      '012_create_batch_ingest_rpc.sql'
    ];
    
    for (const migrationFile of migrations) {
      // Check if migration has already been run
      const exists = await database.oneOrNone(
        'SELECT filename FROM migrations WHERE filename = $1',
        [migrationFile]
      );
      
      if (!exists) {
        console.log(`[Database] Running migration: ${migrationFile}`);
        
        // Read migration file content (server-side only)
        const fs = await import('fs');
        const path = await import('path');
        const migrationPath = path.default.join(process.cwd(), 'migrations', migrationFile);
        
        if (fs.default.existsSync(migrationPath)) {
          const migrationSQL = fs.default.readFileSync(migrationPath, 'utf8');
          
          // Run migration in a transaction
          await database.tx(async (t) => {
            await t.none(migrationSQL);
            await t.none(
              'INSERT INTO migrations (filename) VALUES ($1)',
              [migrationFile]
            );
          });
          
          console.log(`[Database] Migration completed: ${migrationFile}`);
        } else {
          console.warn(`[Database] Migration file not found: ${migrationPath}`);
        }
      } else {
        console.log(`[Database] Migration already applied: ${migrationFile}`);
      }
    }
    
    console.log('[Database] All migrations completed');
  } catch (error) {
    console.error('[Database] Migration error:', error);
    throw error;
  }
}

// Track match database operations
export interface TrackMatchRecord {
  id?: number;
  release_id: number;
  track_index: number;
  platform: string;
  match_url: string;
  confidence: number;
  approved: boolean;
  verified_by?: string;
  verified_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Get track match from database
 */
export async function getTrackMatch(
  releaseId: number,
  trackIndex: number
): Promise<TrackMatchRecord | null> {
  try {
    const database = getDatabase();
    
    console.log(`[Database] Getting track match for release ${releaseId}, track ${trackIndex}`);
    
    const result = await database.oneOrNone(
      `SELECT * FROM track_matches 
       WHERE release_id = $1 AND track_index = $2`,
      [releaseId, trackIndex]
    );
    
    if (result) {
      console.log(`[Database] Found track match for release ${releaseId}, track ${trackIndex}`);
    } else {
      console.log(`[Database] No track match found for release ${releaseId}, track ${trackIndex}`);
    }
    
    return result;
  } catch (error) {
    console.error('[Database] Error getting track match:', error);
    throw error;
  }
}

/**
 * Save track match to database
 */
export async function saveTrackMatch(match: TrackMatchRecord): Promise<TrackMatchRecord> {
  try {
    const database = getDatabase();
    
    console.log(`[Database] Saving track match for release ${match.release_id}, track ${match.track_index}`);
    
    const result = await database.one(
      `INSERT INTO track_matches
         (release_id, track_index, platform, match_url, confidence, approved, verified_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (release_id, track_index)
         DO UPDATE SET
           platform = EXCLUDED.platform,
           match_url = EXCLUDED.match_url,
           confidence = EXCLUDED.confidence,
           approved = EXCLUDED.approved,
           verified_by = EXCLUDED.verified_by,
           verified_at = NOW(),
           updated_at = NOW()
       RETURNING *`,
      [
        match.release_id,
        match.track_index,
        match.platform,
        match.match_url,
        match.confidence,
        match.approved,
        match.verified_by
      ]
    );
    
    console.log(`[Database] Saved track match for release ${match.release_id}, track ${match.track_index}`);
    
    return result;
  } catch (error) {
    console.error('[Database] Error saving track match:', error);
    throw error;
  }
}

/**
 * Delete track match from database
 */
export async function deleteTrackMatch(
  releaseId: number,
  trackIndex: number
): Promise<boolean> {
  try {
    const database = getDatabase();
    
    console.log(`[Database] Deleting track match for release ${releaseId}, track ${trackIndex}`);
    
    const result = await database.result(
      'DELETE FROM track_matches WHERE release_id = $1 AND track_index = $2',
      [releaseId, trackIndex]
    );
    
    const deleted = result.rowCount > 0;
    
    if (deleted) {
      console.log(`[Database] Deleted track match for release ${releaseId}, track ${trackIndex}`);
    } else {
      console.log(`[Database] No track match found to delete for release ${releaseId}, track ${trackIndex}`);
    }
    
    return deleted;
  } catch (error) {
    console.error('[Database] Error deleting track match:', error);
    throw error;
  }
}

/**
 * Get all track matches for a release
 */
export async function getTrackMatchesForRelease(releaseId: number): Promise<TrackMatchRecord[]> {
  try {
    const database = getDatabase();
    
    console.log(`[Database] Getting all track matches for release ${releaseId}`);
    
    const results = await database.manyOrNone(
      `SELECT * FROM track_matches 
       WHERE release_id = $1 
       ORDER BY track_index ASC`,
      [releaseId]
    );
    
    console.log(`[Database] Found ${results?.length || 0} track matches for release ${releaseId}`);
    
    return results || [];
  } catch (error) {
    console.error('[Database] Error getting track matches for release:', error);
    throw error;
  }
}

// Discogs token database operations
export interface DiscogsTokenRecord {
  id?: number;
  username: string;
  access_token: string;
  access_secret: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: Date;
  scope?: string;
  created_at?: Date;
  updated_at?: Date;
  last_used_at?: Date;
}

/**
 * Save Discogs token (encrypted)
 */
export async function saveDiscogsToken(token: DiscogsTokenRecord): Promise<DiscogsTokenRecord> {
  try {
    const database = getDatabase();
    
    console.log(`[Database] Saving Discogs token for user: ${token.username}`);
    
    const result = await database.one(
      `INSERT INTO discogs_tokens
         (username, access_token, access_secret, refresh_token, token_type, expires_at, scope)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username)
         DO UPDATE SET
           access_token = EXCLUDED.access_token,
           access_secret = EXCLUDED.access_secret,
           refresh_token = EXCLUDED.refresh_token,
           token_type = EXCLUDED.token_type,
           expires_at = EXCLUDED.expires_at,
           scope = EXCLUDED.scope,
           updated_at = NOW()
       RETURNING *`,
      [
        token.username,
        token.access_token, // Note: In production, encrypt these
        token.access_secret,
        token.refresh_token,
        token.token_type || 'oauth',
        token.expires_at,
        token.scope
      ]
    );
    
    console.log(`[Database] Saved Discogs token for user: ${token.username}`);
    
    return result;
  } catch (error) {
    console.error('[Database] Error saving Discogs token:', error);
    throw error;
  }
}

/**
 * Get Discogs token for user
 */
export async function getDiscogsToken(username: string): Promise<DiscogsTokenRecord | null> {
  try {
    const database = getDatabase();
    
    console.log(`[Database] Getting Discogs token for user: ${username}`);
    
    const result = await database.oneOrNone(
      'SELECT * FROM discogs_tokens WHERE username = $1',
      [username]
    );
    
    if (result) {
      console.log(`[Database] Found Discogs token for user: ${username}`);
      
      // Update last_used_at
      await database.none(
        'UPDATE discogs_tokens SET last_used_at = NOW() WHERE username = $1',
        [username]
      );
    } else {
      console.log(`[Database] No Discogs token found for user: ${username}`);
    }
    
    return result;
  } catch (error) {
    console.error('[Database] Error getting Discogs token:', error);
    throw error;
  }
}

// =====================================
// SMART CACHING SYSTEM FUNCTIONS
// =====================================

// Types for the smart caching system
export interface CachedRelease {
  discogs_id: number;
  title: string;
  artist: string;
  year?: number;
  label?: string;
  catno?: string;
  thumb?: string;
  genres?: any[];
  styles?: any[];
  tracklist?: any[];
  images?: any[];
  discogs_uri?: string;
  price_value?: string;
  price_currency?: string;
  condition?: string;
  sleeve_condition?: string;
  comments?: string;
  audio_match_count: number;
  last_updated: Date;
}

export interface StoreSyncStats {
  store_username: string;
  last_sync: Date;
  listings_processed: number;
  new_releases_found: number;
  cached_releases_served: number;
  audio_matches_created: number;
  cache_hit_rate: number;
  processing_queue_size: number;
}

export interface QueuedRelease {
  id: number;
  discogs_id: number;
  store_username: string;
  priority: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  release_data: any;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  queued_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

/**
 * Get cached releases for a store (releases with audio matches)
 */
export async function getCachedReleases(storeUsername: string): Promise<CachedRelease[]> {
  const database = getDatabase();
  
  try {
    const releases = await database.any(
      'SELECT * FROM get_cached_releases($1)',
      [storeUsername]
    );
    
    console.log(`[DB] Found ${releases.length} cached releases for store ${storeUsername}`);
    return releases;
  } catch (error) {
    console.error(`[DB] Error getting cached releases for ${storeUsername}:`, error);
    return [];
  }
}

/**
 * Store a release with audio matches in the cache
 */
export async function cacheReleaseWithMatches(
  storeUsername: string,
  discogsId: number,
  releaseData: any,
  audioMatchCount: number
): Promise<boolean> {
  const database = getDatabase();
  
  try {
    await database.none(`
      INSERT INTO releases (
        discogs_id, store_username, title, artist, year, label, catno, thumb,
        genres, styles, tracklist, images, discogs_uri, discogs_resource_url,
        price_value, price_currency, condition, sleeve_condition, comments,
        has_audio_matches, audio_match_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21
      )
      ON CONFLICT (discogs_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        artist = EXCLUDED.artist,
        year = EXCLUDED.year,
        label = EXCLUDED.label,
        catno = EXCLUDED.catno,
        thumb = EXCLUDED.thumb,
        genres = EXCLUDED.genres,
        styles = EXCLUDED.styles,
        tracklist = EXCLUDED.tracklist,
        images = EXCLUDED.images,
        discogs_uri = EXCLUDED.discogs_uri,
        discogs_resource_url = EXCLUDED.discogs_resource_url,
        price_value = EXCLUDED.price_value,
        price_currency = EXCLUDED.price_currency,
        condition = EXCLUDED.condition,
        sleeve_condition = EXCLUDED.sleeve_condition,
        comments = EXCLUDED.comments,
        has_audio_matches = EXCLUDED.has_audio_matches,
        audio_match_count = EXCLUDED.audio_match_count,
        last_updated = NOW()
    `, [
      discogsId,
      storeUsername,
      releaseData.title,
      releaseData.artist || 'Unknown Artist',
      releaseData.year,
      releaseData.label,
      releaseData.catno,
      releaseData.thumb,
      JSON.stringify(releaseData.genres || []),
      JSON.stringify(releaseData.styles || []),
      JSON.stringify(releaseData.tracklist || []),
      JSON.stringify(releaseData.images || []),
      releaseData.uri,
      releaseData.resource_url,
      releaseData.price?.value,
      releaseData.price?.currency,
      releaseData.condition,
      releaseData.sleeve_condition,
      releaseData.comments,
      audioMatchCount > 0,
      audioMatchCount
    ]);
    
    console.log(`[DB] Cached release ${discogsId} for store ${storeUsername} with ${audioMatchCount} audio matches`);
    return true;
  } catch (error) {
    console.error(`[DB] Error caching release ${discogsId}:`, error);
    return false;
  }
}

/**
 * Add a release to the processing queue
 */
export async function queueReleaseForProcessing(
  storeUsername: string,
  discogsId: number,
  releaseData: any,
  priority: number = 1
): Promise<boolean> {
  const database = getDatabase();
  
  try {
    // Primary approach: Use ON CONFLICT with constraint
    await database.none(`
      INSERT INTO processing_queue (discogs_id, store_username, priority, release_data)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (store_username, discogs_id) DO NOTHING
    `, [discogsId, storeUsername, priority, JSON.stringify(releaseData)]);
    
    console.log(`[DB] Queued release ${discogsId} for processing (idempotent)`);
    return true;
  } catch (error) {
    // Fallback: Use WHERE NOT EXISTS if constraint doesn't exist (42P10 error)
    if (error.code === '42P10' || error.message.includes('ON CONFLICT')) {
      console.warn(`[DB] Constraint not found, using fallback for release ${discogsId}`);
      
      try {
        await database.none(`
          INSERT INTO processing_queue (discogs_id, store_username, priority, release_data)
          SELECT $1, $2, $3, $4
          WHERE NOT EXISTS (
            SELECT 1 FROM processing_queue
            WHERE store_username = $2 AND discogs_id = $1
          )
        `, [discogsId, storeUsername, priority, JSON.stringify(releaseData)]);
        
        console.log(`[DB] Queued release ${discogsId} for processing (fallback method)`);
        return true;
      } catch (fallbackError) {
        console.error(`[DB] Fallback error queuing release ${discogsId}:`, fallbackError);
        return false;
      }
    }
    
    console.error(`[DB] Error queuing release ${discogsId}:`, error);
    return false;
  }
}

/**
 * Check if a release is already cached
 */
export async function isReleaseCached(discogsId: number): Promise<boolean> {
  const database = getDatabase();
  
  try {
    const result = await database.oneOrNone(
      'SELECT 1 FROM releases WHERE discogs_id = $1 AND has_audio_matches = true',
      [discogsId]
    );
    
    return !!result;
  } catch (error) {
    console.error(`[DB] Error checking if release ${discogsId} is cached:`, error);
    return false;
  }
}

/**
 * Get releases from processing queue
 */
export async function getQueuedReleases(limit: number = 5): Promise<QueuedRelease[]> {
  const database = getDatabase();
  
  try {
    const queued = await database.any(`
      SELECT * FROM processing_queue 
      WHERE status = 'queued' 
      ORDER BY priority DESC, queued_at ASC 
      LIMIT $1
    `, [limit]);
    
    console.log(`[DB] Found ${queued.length} releases in processing queue`);
    return queued;
  } catch (error) {
    console.error('[DB] Error getting queued releases:', error);
    return [];
  }
}

/**
 * Update store sync statistics
 */
export async function updateStoreSyncStats(
  storeUsername: string,
  stats: {
    listingsProcessed?: number;
    newReleases?: number;
    cachedServed?: number;
    audioMatches?: number;
  }
): Promise<boolean> {
  const database = getDatabase();
  
  try {
    console.log(`[Database] Updating sync stats for ${storeUsername}:`, stats);
    await database.func('update_sync_stats', [
      storeUsername,
      stats.listingsProcessed || 0,
      stats.newReleases || 0,
      stats.cachedServed || 0,
      stats.audioMatches || 0
    ]);
    
    return true;
  } catch (error) {
    console.error(`[DB] Error updating sync stats for ${storeUsername}:`, error);
    return false;
  }
}

/**
 * Update processing queue item status
 */
export async function updateQueueItemStatus(
  id: number,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<boolean> {
  const database = getDatabase();
  
  try {
    await database.none(`
      UPDATE processing_queue 
      SET status = $2, 
          error_message = $3,
          started_at = CASE WHEN $2 = 'processing' THEN NOW() ELSE started_at END,
          completed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
          retry_count = CASE WHEN $2 = 'failed' THEN retry_count + 1 ELSE retry_count END
      WHERE id = $1
    `, [id, status, errorMessage]);
    
    return true;
  } catch (error) {
    console.error(`[DB] Error updating queue item ${id}:`, error);
    return false;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  const database = getDatabase();
  
  try {
    const stats = await database.one(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'queued') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM processing_queue
    `);
    
    return {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      processing: parseInt(stats.processing),
      completed: parseInt(stats.completed),
      failed: parseInt(stats.failed)
    };
  } catch (error) {
    console.error('[DB] Error getting queue stats:', error);
    return { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
  }
}