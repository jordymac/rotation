import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST() {
  try {
    const database = getDatabase();
    
    // Reset processing status to queued so they can be reprocessed
    const result = await database.result(`
      UPDATE processing_queue 
      SET status = 'queued', started_at = NULL 
      WHERE status = 'processing'
    `);
    
    return NextResponse.json({
      success: true,
      reset_count: result.rowCount,
      message: 'Reset processing releases to queued'
    });
    
  } catch (error) {
    console.error('Reset processing error:', error);
    return NextResponse.json(
      { error: 'Reset failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}