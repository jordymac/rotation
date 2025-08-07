import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// POST /api/admin/migrate
// Run database migrations directly
export async function POST(request: NextRequest) {
  try {
    console.log('[Migrate] Starting database migrations...');
    
    const database = getDatabase();
    
    // Create migrations table if it doesn't exist
    await database.none(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    console.log('[Migrate] Created migrations table');
    
    // Create track_matches table directly (from migration file)
    await database.none(`
      CREATE TABLE IF NOT EXISTS track_matches (
          id SERIAL PRIMARY KEY,
          release_id BIGINT NOT NULL,
          track_index INTEGER NOT NULL,
          platform TEXT NOT NULL,
          match_url TEXT NOT NULL,
          confidence REAL NOT NULL,
          approved BOOLEAN NOT NULL DEFAULT false,
          verified_by TEXT,
          verified_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('[Migrate] Created track_matches table');
    
    // Add unique constraint (ignore error if already exists)
    try {
      await database.none(`
        ALTER TABLE track_matches 
        ADD CONSTRAINT unique_track_match 
        UNIQUE (release_id, track_index);
      `);
    } catch (err) {
      // Constraint likely already exists, continue
      console.log('[Migrate] Unique constraint already exists, continuing...');
    }
    
    console.log('[Migrate] Added unique constraint');
    
    // Create indexes
    await database.none(`
      CREATE INDEX IF NOT EXISTS idx_track_matches_release_track 
      ON track_matches (release_id, track_index);
      
      CREATE INDEX IF NOT EXISTS idx_track_matches_platform 
      ON track_matches (platform);
      
      CREATE INDEX IF NOT EXISTS idx_track_matches_approved 
      ON track_matches (approved);
    `);
    
    console.log('[Migrate] Created indexes');
    
    // Create update trigger function
    await database.none(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger
    await database.none(`
      DROP TRIGGER IF EXISTS update_track_matches_updated_at ON track_matches;
      CREATE TRIGGER update_track_matches_updated_at 
          BEFORE UPDATE ON track_matches 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('[Migrate] Created triggers');
    
    // Record migration as completed
    await database.none(`
      INSERT INTO migrations (filename) 
      VALUES ('001_create_track_matches.sql') 
      ON CONFLICT (filename) DO NOTHING;
    `);
    
    console.log('[Migrate] Database migrations completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database migrations completed successfully'
    });
    
  } catch (error) {
    console.error('[Migrate] Database migration failed:', error);
    return NextResponse.json(
      { 
        error: 'Database migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}