import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST() {
  try {
    const database = getDatabase();
    
    // Clear all track_matches to start fresh
    const result = await database.result('DELETE FROM track_matches');
    
    return NextResponse.json({
      success: true,
      deleted_count: result.rowCount,
      message: 'All track matches cleared'
    });
    
  } catch (error) {
    console.error('Clear matches error:', error);
    return NextResponse.json(
      { error: 'Clear failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}