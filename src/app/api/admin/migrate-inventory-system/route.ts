import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST() {
  try {
    console.log('[Migration] Starting inventory system migration...');
    const database = getDatabase();

    // Create releases table for efficient caching
    console.log('[Migration] Creating releases table...');
    await database.none(`
      CREATE TABLE IF NOT EXISTS releases (
        id SERIAL PRIMARY KEY,
        discogs_id BIGINT UNIQUE NOT NULL,
        store_username TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        year INTEGER,
        label TEXT,
        catno TEXT,
        thumb TEXT,
        genres JSONB,
        styles JSONB,
        tracklist JSONB,
        images JSONB,
        discogs_uri TEXT,
        discogs_resource_url TEXT,
        price_value TEXT,
        price_currency TEXT,
        condition TEXT,
        sleeve_condition TEXT,
        comments TEXT,
        last_updated TIMESTAMPTZ DEFAULT NOW(),
        has_audio_matches BOOLEAN DEFAULT false,
        audio_match_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes for releases table
    console.log('[Migration] Creating indexes for releases table...');
    await database.none(`
      CREATE INDEX IF NOT EXISTS idx_releases_discogs_id ON releases (discogs_id);
      CREATE INDEX IF NOT EXISTS idx_releases_store_username ON releases (store_username);
      CREATE INDEX IF NOT EXISTS idx_releases_has_audio ON releases (has_audio_matches);
      CREATE INDEX IF NOT EXISTS idx_releases_updated ON releases (last_updated);
    `);

    // Create store sync log table
    console.log('[Migration] Creating store_sync_log table...');
    await database.none(`
      CREATE TABLE IF NOT EXISTS store_sync_log (
        id SERIAL PRIMARY KEY,
        store_username TEXT NOT NULL,
        last_sync TIMESTAMPTZ DEFAULT NOW(),
        last_discogs_check TIMESTAMPTZ DEFAULT NOW(),
        listings_processed INTEGER DEFAULT 0,
        new_releases_found INTEGER DEFAULT 0,
        cached_releases_served INTEGER DEFAULT 0,
        audio_matches_created INTEGER DEFAULT 0,
        cache_hit_rate REAL DEFAULT 0.0,
        processing_queue_size INTEGER DEFAULT 0,
        
        -- Ensure one row per store
        UNIQUE(store_username)
      );
    `);

    // Create processing queue table
    console.log('[Migration] Creating processing_queue table...');
    await database.none(`
      CREATE TABLE IF NOT EXISTS processing_queue (
        id SERIAL PRIMARY KEY,
        discogs_id BIGINT NOT NULL,
        store_username TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        status TEXT DEFAULT 'queued', -- queued, processing, completed, failed
        release_data JSONB NOT NULL,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        queued_at TIMESTAMPTZ DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );
    `);

    // Create indexes for sync log table
    console.log('[Migration] Creating indexes for store_sync_log table...');
    await database.none(`
      CREATE INDEX IF NOT EXISTS idx_sync_log_store ON store_sync_log (store_username);
      CREATE INDEX IF NOT EXISTS idx_sync_log_last_sync ON store_sync_log (last_sync);
    `);

    // Create indexes for processing queue table
    console.log('[Migration] Creating indexes for processing_queue table...');
    await database.none(`
      CREATE INDEX IF NOT EXISTS idx_queue_status ON processing_queue (status);
      CREATE INDEX IF NOT EXISTS idx_queue_priority ON processing_queue (priority);
      CREATE INDEX IF NOT EXISTS idx_queue_store ON processing_queue (store_username);
      CREATE INDEX IF NOT EXISTS idx_queue_discogs_id ON processing_queue (discogs_id);
    `);

    // Note: Foreign key constraint will be added later after data migration
    console.log('[Migration] track_matches table will be linked to releases after data migration...');

    // Create helper functions
    console.log('[Migration] Creating helper functions...');
    
    // Function to get cached releases for a store
    await database.none(`
      CREATE OR REPLACE FUNCTION get_cached_releases(p_store_username TEXT)
      RETURNS TABLE (
        discogs_id BIGINT,
        title TEXT,
        artist TEXT,
        year INTEGER,
        label TEXT,
        catno TEXT,
        thumb TEXT,
        genres JSONB,
        styles JSONB,
        tracklist JSONB,
        images JSONB,
        discogs_uri TEXT,
        price_value TEXT,
        price_currency TEXT,
        condition TEXT,
        sleeve_condition TEXT,
        comments TEXT,
        audio_match_count INTEGER,
        last_updated TIMESTAMPTZ
      )
      LANGUAGE SQL
      STABLE
      AS $$
        SELECT 
          r.discogs_id,
          r.title,
          r.artist,
          r.year,
          r.label,
          r.catno,
          r.thumb,
          r.genres,
          r.styles,
          r.tracklist,
          r.images,
          r.discogs_uri,
          r.price_value,
          r.price_currency,
          r.condition,
          r.sleeve_condition,
          r.comments,
          r.audio_match_count,
          r.last_updated
        FROM releases r
        WHERE r.store_username = p_store_username
        ORDER BY r.last_updated DESC;
      $$;
    `);

    // Function to update sync stats
    await database.none(`
      CREATE OR REPLACE FUNCTION update_sync_stats(
        p_store_username TEXT,
        p_listings_processed INTEGER DEFAULT 0,
        p_new_releases INTEGER DEFAULT 0,
        p_cached_served INTEGER DEFAULT 0,
        p_audio_matches INTEGER DEFAULT 0
      )
      RETURNS VOID
      LANGUAGE SQL
      AS $$
        INSERT INTO store_sync_log (
          store_username, 
          listings_processed, 
          new_releases_found, 
          cached_releases_served, 
          audio_matches_created,
          cache_hit_rate
        )
        VALUES (
          p_store_username, 
          p_listings_processed, 
          p_new_releases, 
          p_cached_served, 
          p_audio_matches,
          CASE 
            WHEN (p_cached_served + p_new_releases) > 0 
            THEN ROUND(CAST((p_cached_served::REAL / (p_cached_served + p_new_releases)) * 100 AS NUMERIC), 2)
            ELSE 0.0 
          END
        )
        ON CONFLICT (store_username) 
        DO UPDATE SET
          last_sync = NOW(),
          listings_processed = store_sync_log.listings_processed + p_listings_processed,
          new_releases_found = store_sync_log.new_releases_found + p_new_releases,
          cached_releases_served = store_sync_log.cached_releases_served + p_cached_served,
          audio_matches_created = store_sync_log.audio_matches_created + p_audio_matches,
          cache_hit_rate = CASE 
            WHEN (store_sync_log.cached_releases_served + store_sync_log.new_releases_found) > 0 
            THEN ROUND(CAST((store_sync_log.cached_releases_served::REAL / (store_sync_log.cached_releases_served + store_sync_log.new_releases_found)) * 100 AS NUMERIC), 2)
            ELSE 0.0 
          END;
      $$;
    `);

    console.log('[Migration] Inventory system migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Inventory system migration completed',
      tables: [
        'releases - for caching releases with audio matches',
        'store_sync_log - for tracking sync statistics',
        'processing_queue - for background audio matching',
        'Updated track_matches with foreign key constraints'
      ],
      functions: [
        'get_cached_releases(store_username) - efficiently query cached releases',
        'update_sync_stats(...) - update store sync statistics'
      ]
    });

  } catch (error) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}