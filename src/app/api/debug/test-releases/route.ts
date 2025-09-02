import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = getDatabase();
    
    // Get full details of releases in the releases table
    const releases = await database.manyOrNone(`
      SELECT id, discogs_id, title, artist, store_username, tracklist 
      FROM releases 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    return NextResponse.json({
      success: true,
      releases: releases.map(r => ({
        ...r,
        track_count: r.tracklist ? (Array.isArray(r.tracklist) ? r.tracklist.length : JSON.parse(r.tracklist)?.length || 0) : 0
      }))
    });
    
  } catch (error) {
    console.error('Test releases error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const database = getDatabase();
    
    // Create a test processing_queue entry for a release that exists
    const release = await database.oneOrNone(`
      SELECT id, discogs_id, title, artist, store_username 
      FROM releases 
      WHERE tracklist IS NOT NULL 
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    if (!release) {
      throw new Error('No suitable release found');
    }
    
    // Insert into processing_queue with dummy release_data  
    await database.none(`
      INSERT INTO processing_queue (discogs_id, store_username, priority, status, release_data, queued_at)
      VALUES ($1, $2, 1, 'queued', $3, NOW())
      ON CONFLICT (discogs_id, store_username) DO UPDATE SET 
        status = 'queued', started_at = NULL
    `, [
      release.discogs_id,
      release.store_username, 
      JSON.stringify({
        release: {
          id: release.discogs_id,
          title: release.title,
          artist: release.artist,
          tracklist: [
            { title: "Test Track 1", position: "A1", duration: "3:45" },
            { title: "Test Track 2", position: "A2", duration: "4:12" }
          ]
        }
      })
    ]);
    
    return NextResponse.json({
      success: true,
      message: `Created test processing_queue entry for ${release.title}`,
      release: {
        discogs_id: release.discogs_id,
        title: release.title,
        artist: release.artist,
        store_username: release.store_username
      }
    });
    
  } catch (error) {
    console.error('Create test queue entry error:', error);
    return NextResponse.json(
      { error: 'Create failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}