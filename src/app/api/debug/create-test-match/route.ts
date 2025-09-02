import { NextResponse } from 'next/server';
import { saveTrackMatch } from '@/lib/db';

export async function POST() {
  try {
    // Create a test track match for the Experience EP (release_id = 21)
    const testMatch = await saveTrackMatch({
      release_id: 21, // Experience EP
      track_index: 0, // First track: "Electrical (Jimpster Dub)"
      platform: 'youtube',
      match_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Test YouTube URL
      confidence: 0.85, // 85% confidence (should show as "Fast-Track")
      approved: true,
      verified_by: 'test-system'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Created test track match',
      track_match: testMatch
    });
    
  } catch (error) {
    console.error('Create test match error:', error);
    return NextResponse.json(
      { error: 'Create failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}