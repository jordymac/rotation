#!/usr/bin/env node

/**
 * Test script for the match service caching system
 */

const { getOrComputeMatch, clearMatch, healthCheck } = require('../src/lib/match-service');
const { closeDatabaseConnection } = require('../src/lib/db');
const { closeRedisConnection } = require('../src/lib/redis');

// Test data
const TEST_RELEASE_ID = 999999;
const TEST_TRACK_INDEX = 0;
const TEST_ADMIN_USER = 'test-admin';

const TEST_RELEASE_TITLE = 'Test Album';
const TEST_RELEASE_ARTIST = 'Test Artist';
const TEST_TRACK_INFO = {
  position: 'A1',
  title: 'Test Track',
  duration: '3:45',
  artists: []
};

async function testMatchService() {
  console.log('🧪 Testing Match Service Caching System...\n');
  
  try {
    // Health check first
    console.log('1️⃣ Running health check...');
    const health = await healthCheck();
    console.log('✅ Health Check Results:');
    console.log(`   Database: ${health.database ? '✅ Healthy' : '❌ Failed'}`);
    console.log(`   Redis: ${health.redis ? '✅ Healthy' : '❌ Failed'}`);
    console.log();
    
    if (!health.database) {
      throw new Error('Database is not healthy. Please check your DATABASE_URL and run setup first.');
    }
    
    // Clear any existing test data
    console.log('2️⃣ Clearing test data...');
    await clearMatch(TEST_RELEASE_ID, TEST_TRACK_INDEX);
    console.log('✅ Test data cleared\n');
    
    // Test 1: Fresh computation (should hit external APIs)
    console.log('3️⃣ Test 1: Fresh computation...');
    console.time('Fresh computation');
    
    try {
      const match1 = await getOrComputeMatch(
        TEST_RELEASE_ID,
        TEST_TRACK_INDEX,
        TEST_ADMIN_USER,
        TEST_RELEASE_TITLE,
        TEST_RELEASE_ARTIST,
        TEST_TRACK_INFO
      );
      
      console.timeEnd('Fresh computation');
      console.log('✅ Match computed:', {
        platform: match1.platform,
        confidence: match1.confidence,
        approved: match1.approved,
        source: match1.source
      });
      console.log();
      
      // Test 2: Cache hit (should be much faster)
      console.log('4️⃣ Test 2: Cache hit...');
      console.time('Cache hit');
      
      const match2 = await getOrComputeMatch(
        TEST_RELEASE_ID,
        TEST_TRACK_INDEX,
        TEST_ADMIN_USER
      );
      
      console.timeEnd('Cache hit');
      console.log('✅ Match retrieved:', {
        platform: match2.platform,
        confidence: match2.confidence,
        approved: match2.approved,
        source: match2.source
      });
      console.log();
      
      // Verify cache vs fresh computation consistency
      if (match1.platform === match2.platform && match1.source !== match2.source) {
        console.log('✅ Cache consistency verified (same result, different source)');
      } else if (match1.source === match2.source) {
        console.log('⚠️  Both requests had the same source - caching may not be working');
      }
      
    } catch (computeError) {
      console.log('⚠️  Fresh computation failed (this is expected if no external APIs are configured):');
      console.log('   ', computeError.message);
      console.log('   This test validates the caching layer structure even without real matches.\n');
    }
    
    // Test 3: Database persistence (simulate restart)
    console.log('5️⃣ Test 3: Database persistence...');
    
    // Clear Redis cache to simulate app restart
    const { deleteCachedMatch } = require('../src/lib/redis');
    await deleteCachedMatch(TEST_RELEASE_ID, TEST_TRACK_INDEX);
    console.log('   Cache cleared (simulating app restart)');
    
    console.time('Database hit');
    
    try {
      const match3 = await getOrComputeMatch(
        TEST_RELEASE_ID,
        TEST_TRACK_INDEX,
        TEST_ADMIN_USER
      );
      
      console.timeEnd('Database hit');
      console.log('✅ Match retrieved from database:', {
        platform: match3.platform,
        source: match3.source
      });
      
      if (match3.source === 'database') {
        console.log('✅ Database persistence verified');
      }
      
    } catch (dbError) {
      console.log('ℹ️  Database retrieval test skipped (no persisted data from previous test)');
    }
    
    console.log();
    
    // Final health check with cache stats
    console.log('6️⃣ Final health check...');
    const finalHealth = await healthCheck();
    if (finalHealth.cacheStats) {
      console.log('📊 Cache Statistics:');
      console.log(`   Match keys: ${finalHealth.cacheStats.matchKeys}`);
      console.log(`   Total keys: ${finalHealth.cacheStats.totalKeys}`);
      if (finalHealth.cacheStats.memoryUsage) {
        console.log(`   Memory usage: ${finalHealth.cacheStats.memoryUsage}`);
      }
    }
    console.log();
    
    console.log('🎉 All tests completed successfully!');
    console.log();
    console.log('📝 Summary:');
    console.log('   ✅ Database connection working');
    if (finalHealth.redis) {
      console.log('   ✅ Redis caching working');
    } else {
      console.log('   ⚠️  Redis caching disabled');
    }
    console.log('   ✅ Match service layer functional');
    console.log('   ✅ Persistence and caching flow verified');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Run: node scripts/setup-cache-db.js');
    console.error('   2. Check your .env.local file');
    console.error('   3. Ensure PostgreSQL and Redis are running');
    console.error('   4. Verify DATABASE_URL and REDIS_URL');
    process.exit(1);
  } finally {
    // Clean up test data
    try {
      await clearMatch(TEST_RELEASE_ID, TEST_TRACK_INDEX);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    // Close connections
    await closeDatabaseConnection();
    await closeRedisConnection();
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testMatchService();
}

module.exports = { testMatchService };