/**
 * Fix processing_queue constraint issue
 * Executes SQL to deduplicate and add unique constraint
 */

const { getDatabase } = require('../src/lib/db.ts');

async function fixProcessingQueueConstraint() {
  console.log('🔧 Starting processing_queue constraint fix...');
  
  const database = getDatabase();
  
  try {
    // Step 1: De-duplicate existing rows
    console.log('📝 Step 1: Removing duplicate rows...');
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
    console.log(`✅ Removed ${dedupeResult.rowCount} duplicate rows`);

    // Step 2: Add unique constraint
    console.log('📝 Step 2: Adding unique constraint...');
    await database.none(`
      ALTER TABLE processing_queue
      ADD CONSTRAINT uq_processing_queue_store_discogs
      UNIQUE (store_username, discogs_id)
    `);
    console.log('✅ Unique constraint added successfully');

    // Step 3: Verify constraint exists
    console.log('📝 Step 3: Verifying constraint...');
    const constraintCheck = await database.oneOrNone(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'processing_queue'::regclass
        AND conname = 'uq_processing_queue_store_discogs'
    `);
    
    if (constraintCheck) {
      console.log('✅ Constraint verified:', constraintCheck);
    } else {
      console.log('❌ Constraint not found!');
    }

    // Check indexes
    const indexCheck = await database.manyOrNone(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'processing_queue'
    `);
    console.log('📋 Current indexes:', indexCheck);

    // Test the ON CONFLICT clause
    console.log('📝 Step 4: Testing ON CONFLICT...');
    await database.none(`
      INSERT INTO processing_queue (discogs_id, store_username, priority, release_data)
      VALUES (99999, 'test_store', 1, '{"test": true}')
      ON CONFLICT (store_username, discogs_id) DO NOTHING
    `);
    console.log('✅ ON CONFLICT test passed');

    // Clean up test data
    await database.none(`
      DELETE FROM processing_queue 
      WHERE discogs_id = 99999 AND store_username = 'test_store'
    `);
    console.log('✅ Test data cleaned up');

    console.log('🎉 Processing queue constraint fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing processing queue constraint:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixProcessingQueueConstraint()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { fixProcessingQueueConstraint };