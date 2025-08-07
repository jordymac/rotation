#!/usr/bin/env node

/**
 * Setup script for caching and database system
 * Runs migrations and tests connections
 */

const { runMigrations, testDatabaseConnection, closeDatabaseConnection } = require('../src/lib/db');
const { getRedisClient, closeRedisConnection, getCacheStats } = require('../src/lib/redis');
const { healthCheck } = require('../src/lib/match-service');

async function setupSystem() {
  console.log('🚀 Setting up caching and persistence system...\n');
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful\n');
    
    // Run migrations
    console.log('🔄 Running database migrations...');
    await runMigrations();
    console.log('✅ Migrations completed\n');
    
    // Test Redis connection
    console.log('🔄 Testing Redis connection...');
    try {
      const redisClient = await getRedisClient();
      await redisClient.ping();
      console.log('✅ Redis connection successful\n');
      
      // Get cache stats
      const stats = await getCacheStats();
      console.log('📈 Cache Statistics:');
      console.log(`   Total keys: ${stats.totalKeys}`);
      console.log(`   Match keys: ${stats.matchKeys}`);
      if (stats.memoryUsage) {
        console.log(`   Memory usage: ${stats.memoryUsage}`);
      }
      console.log();
    } catch (redisError) {
      console.warn('⚠️  Redis connection failed:', redisError.message);
      console.warn('   System will work without Redis but caching will be disabled\n');
    }
    
    // System health check
    console.log('🔍 Running system health check...');
    const health = await healthCheck();
    console.log('✅ Health Check Results:');
    console.log(`   Database: ${health.database ? '✅ Healthy' : '❌ Failed'}`);
    console.log(`   Redis: ${health.redis ? '✅ Healthy' : '❌ Failed'}`);
    
    if (health.cacheStats) {
      console.log(`   Cache keys: ${health.cacheStats.matchKeys}`);
    }
    console.log();
    
    console.log('🎉 Setup completed successfully!');
    console.log();
    console.log('📝 Next steps:');
    console.log('   1. Set up your environment variables (.env.local)');
    console.log('   2. Ensure Redis is running (if using caching)');
    console.log('   3. Test the system with: npm run test-match-service');
    console.log();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error();
    console.error('💡 Troubleshooting:');
    console.error('   1. Check your DATABASE_URL environment variable');
    console.error('   2. Ensure PostgreSQL is running');
    console.error('   3. Verify database credentials and permissions');
    console.error('   4. Check Redis connection (REDIS_URL)');
    process.exit(1);
  } finally {
    // Clean up connections
    await closeDatabaseConnection();
    await closeRedisConnection();
  }
}

// Example usage function
async function exampleUsage() {
  console.log('💡 Example Usage:');
  console.log();
  console.log('// Import the service');
  console.log("const { getOrComputeMatch } = require('./src/lib/match-service');");
  console.log();
  console.log('// Get or compute a match');
  console.log('const match = await getOrComputeMatch(');
  console.log('  123456,     // releaseId');
  console.log('  0,          // trackIndex');
  console.log('  "admin",    // adminUserId');
  console.log('  "Album Title", // releaseTitle (for fresh computation)');
  console.log('  "Artist Name", // releaseArtist (for fresh computation)');
  console.log('  {           // trackInfo (for fresh computation)');
  console.log('    position: "A1",');
  console.log('    title: "Track Title",');
  console.log('    duration: "3:45",');
  console.log('    artists: []');
  console.log('  }');
  console.log(');');
  console.log();
  console.log('console.log(match.source); // "cache", "database", or "computed"');
  console.log();
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupSystem().then(() => {
    if (process.argv.includes('--example')) {
      exampleUsage();
    }
  });
}

module.exports = { setupSystem };