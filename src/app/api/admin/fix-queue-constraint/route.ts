import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// POST /api/admin/fix-queue-constraint
// Fix the processing_queue unique constraint issue
export async function POST(request: NextRequest) {
  try {
    console.log('[Admin] Starting processing_queue constraint fix...');
    
    const database = getDatabase();
    
    // Step 1: De-duplicate existing rows
    console.log('[Admin] Step 1: Removing duplicate rows...');
    const dedupeResult = await database.result(`
      DELETE FROM processing_queue pq
      USING (
        SELECT MIN(ctid) AS keep_tid, store_username, discogs_id
        FROM processing_queue
        GROUP BY store_username, discogs_id
      ) keep
      WHERE pq.store_username = keep.store_username
        AND pq.discogs_id = keep.discogs_id
        AND pq.ctid <> keep.keep_tid
    `);
    console.log(`[Admin] Removed ${dedupeResult.rowCount} duplicate rows`);

    // Step 2: Add unique constraint (with error handling in case it exists)
    console.log('[Admin] Step 2: Adding unique constraint...');
    try {
      await database.none(`
        ALTER TABLE processing_queue
        ADD CONSTRAINT uq_processing_queue_store_discogs
        UNIQUE (store_username, discogs_id)
      `);
      console.log('[Admin] Unique constraint added successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('[Admin] Constraint already exists, skipping');
      } else {
        throw error;
      }
    }

    // Step 3: Verify constraint exists
    console.log('[Admin] Step 3: Verifying constraint...');
    const constraintCheck = await database.oneOrNone(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'processing_queue'::regclass
        AND conname = 'uq_processing_queue_store_discogs'
    `);
    
    if (!constraintCheck) {
      throw new Error('Constraint verification failed - constraint not found');
    }

    // Check indexes
    const indexCheck = await database.manyOrNone(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'processing_queue'
    `);

    // Step 4: Test the ON CONFLICT clause
    console.log('[Admin] Step 4: Testing ON CONFLICT...');
    const testDiscogsId = Math.floor(Math.random() * 1000000);
    const testStore = 'constraint_test_store';
    
    await database.none(`
      INSERT INTO processing_queue (discogs_id, store_username, priority, release_data)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (store_username, discogs_id) DO NOTHING
    `, [testDiscogsId, testStore, JSON.stringify({ test: true })]);

    // Try inserting the same row again - should be ignored
    await database.none(`
      INSERT INTO processing_queue (discogs_id, store_username, priority, release_data)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (store_username, discogs_id) DO NOTHING
    `, [testDiscogsId, testStore, JSON.stringify({ test: true })]);

    // Clean up test data
    await database.none(`
      DELETE FROM processing_queue 
      WHERE discogs_id = $1 AND store_username = $2
    `, [testDiscogsId, testStore]);

    console.log('[Admin] Processing queue constraint fix completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Processing queue constraint fix completed',
      details: {
        duplicatesRemoved: dedupeResult.rowCount,
        constraint: constraintCheck,
        indexes: indexCheck,
        testPassed: true
      }
    });

  } catch (error) {
    console.error('[Admin] Error fixing processing queue constraint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix processing queue constraint', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}