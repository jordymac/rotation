import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = getDatabase();
    
    // Check if track_matches table has any data
    const matchCount = await database.one('SELECT COUNT(*) as count FROM track_matches');
    
    // Get a sample of track_matches with working join
    const sampleMatches = await database.manyOrNone(`
      SELECT tm.*, r.title as release_title, r.artist 
      FROM track_matches tm 
      LEFT JOIN releases r ON tm.release_id::int = r.id 
      ORDER BY tm.created_at DESC 
      LIMIT 5
    `);
    
    // Check releases table for comparison  
    const releaseCount = await database.one('SELECT COUNT(*) as count FROM releases');
    
    // Check release ID ranges
    const sampleReleases = await database.manyOrNone(`
      SELECT id, title, artist FROM releases ORDER BY id DESC LIMIT 5
    `);
    
    const releaseIdRange = await database.one(`
      SELECT MIN(id) as min_id, MAX(id) as max_id FROM releases
    `);
    
    // Check if release_id types match
    const idTypeCheck = await database.manyOrNone(`
      SELECT 
        tm.release_id,
        pg_typeof(tm.release_id) as tm_type,
        r.id,
        pg_typeof(r.id) as r_type
      FROM track_matches tm 
      LEFT JOIN releases r ON tm.release_id::int = r.id 
      LIMIT 3
    `);
    
    return NextResponse.json({
      success: true,
      track_matches_count: parseInt(matchCount.count),
      releases_count: parseInt(releaseCount.count),
      sample_matches: sampleMatches,
      sample_releases: sampleReleases,
      release_id_range: releaseIdRange,
      id_type_check: idTypeCheck
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}