import { Redis } from '@upstash/redis';

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 */
export async function getRedisClient() {
  if (!redisClient) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      // Use Upstash Redis with REST API
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      // Fallback to local Redis (for development)
      const { createClient } = await import('redis');
      const client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      client.on('error', (err) => {
        console.error('[Redis] Connection error:', err);
      });

      client.on('connect', () => {
        console.log('[Redis] Connected successfully');
      });

      client.on('disconnect', () => {
        console.log('[Redis] Disconnected');
      });

      await client.connect();
      redisClient = client as any; // Type compatibility
      }
    }
    
    if (!redisClient) {
      throw new Error('Failed to initialize Redis client');
    }

  return redisClient;
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedisConnection() {
  if (redisClient) {
    if ('quit' in redisClient) {
      await (redisClient as any).quit();
    }
    redisClient = null;
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.ping();
    console.log('[Redis] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Redis] Connection test failed:', error);
    return false;
  }
}

/**
 * Cache utilities for audio matches
 */
export interface CachedMatch {
  platform: string;
  match_url: string;
  confidence: number;
  approved: boolean;
  verified_by?: string;
  verified_at?: string;
}

/**
 * Get cached match from Redis
 */
export async function getCachedMatch(
  releaseId: number,
  trackIndex: number
): Promise<CachedMatch | null> {
  try {
    const client = await getRedisClient();
    const key = `match:${releaseId}:${trackIndex}`;
    
    console.log(`[Redis] Getting cached match for key: ${key}`);
    const cached = await client.get(key);
    
    if (cached) {
      console.log(`[Redis] Cache hit for key: ${key}`);
      try {
        // Handle both string and already parsed responses
        const data = typeof cached === 'string' ? cached : JSON.stringify(cached);
        return JSON.parse(data) as CachedMatch;
      } catch (err) {
        console.warn(`[Redis] Failed to parse cached data for key ${key}:`, err);
        // Clear the corrupted cache entry
        await client.del(key);
        return null;
      }
    }
    
    console.log(`[Redis] Cache miss for key: ${key}`);
    return null;
  } catch (error) {
    console.error('[Redis] Error getting cached match:', error);
    return null; // Graceful fallback if Redis is unavailable
  }
}

/**
 * Set cached match in Redis with TTL
 */
export async function setCachedMatch(
  releaseId: number,
  trackIndex: number,
  match: CachedMatch,
  ttlSeconds: number = 86400 // 24 hours default
): Promise<void> {
  try {
    const client = await getRedisClient();
    const key = `match:${releaseId}:${trackIndex}`;
    
    console.log(`[Redis] Caching match for key: ${key} (TTL: ${ttlSeconds}s)`);
    
    // Handle both Upstash and standard Redis clients
    if ('setex' in client) {
      await (client as any).setex(key, ttlSeconds, JSON.stringify(match));
    } else {
      // Upstash client - use set with EX option
      await client.set(key, JSON.stringify(match), { ex: ttlSeconds });
    }
    
    console.log(`[Redis] Successfully cached match for key: ${key}`);
  } catch (error) {
    console.error('[Redis] Error setting cached match:', error);
    // Don't throw - caching failure shouldn't break the flow
  }
}

/**
 * Delete cached match from Redis
 */
export async function deleteCachedMatch(
  releaseId: number,
  trackIndex: number
): Promise<void> {
  try {
    const client = await getRedisClient();
    const key = `match:${releaseId}:${trackIndex}`;
    
    console.log(`[Redis] Deleting cached match for key: ${key}`);
    await client.del(key);
    
    console.log(`[Redis] Successfully deleted cached match for key: ${key}`);
  } catch (error) {
    console.error('[Redis] Error deleting cached match:', error);
  }
}

/**
 * Clear all cached matches for a release
 */
export async function clearCachedMatchesForRelease(releaseId: number): Promise<void> {
  try {
    const client = await getRedisClient();
    const pattern = `match:${releaseId}:*`;
    
    console.log(`[Redis] Clearing all cached matches for release: ${releaseId}`);
    
    // Get all keys matching the pattern
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`[Redis] Cleared ${keys.length} cached matches for release: ${releaseId}`);
    } else {
      console.log(`[Redis] No cached matches found for release: ${releaseId}`);
    }
  } catch (error) {
    console.error('[Redis] Error clearing cached matches for release:', error);
  }
}

/**
 * Single-flight pattern implementation using Redis locks
 * Prevents concurrent execution of the same operation across instances
 */
export async function singleFlight<T>(
  key: string,
  operation: () => Promise<T>,
  lockTtlSeconds: number = 60
): Promise<T> {
  const lockKey = `lock:${key}`;
  const client = await getRedisClient();
  
  try {
    // Try to acquire lock
    const acquired = await client.set(lockKey, "1", { nx: true, ex: lockTtlSeconds });
    
    if (!acquired) {
      // Lock not acquired - operation already in progress
      // Wait briefly and return cached result if available
      console.log(`[Redis] Lock not acquired for ${key}, checking for cached result`);
      
      const cacheKey = `cache:${key}`;
      const cached = await client.get(cacheKey);
      
      if (cached) {
        console.log(`[Redis] Returning cached result for ${key}`);
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
      
      // No cached result, wait for lock and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retryResult = await client.get(cacheKey);
      if (retryResult) {
        return typeof retryResult === 'string' ? JSON.parse(retryResult) : retryResult;
      }
      
      throw new Error(`Operation in progress for ${key}, no cached result available`);
    }
    
    console.log(`[Redis] Lock acquired for ${key}, executing operation`);
    
    // Execute operation
    const result = await operation();
    
    // Cache the result for other requests
    const cacheKey = `cache:${key}`;
    await client.set(cacheKey, JSON.stringify(result), { ex: 300 }); // 5 min cache
    
    return result;
    
  } finally {
    // Always release the lock
    try {
      await client.del(lockKey);
      console.log(`[Redis] Lock released for ${key}`);
    } catch (error) {
      console.error(`[Redis] Error releasing lock for ${key}:`, error);
    }
  }
}

/**
 * Acquire a Redis lock for inventory refresh operations
 * Ensures only one inventory refresh per store at a time
 */
export async function acquireInventoryLock(storeUsername: string, ttlSeconds: number = 60): Promise<boolean> {
  const lockKey = `inventory-lock:${storeUsername}`;
  const client = await getRedisClient();
  
  try {
    // Use NX (only set if not exists) and EX (expire) options
    const acquired = await client.set(lockKey, "1", { nx: true, ex: ttlSeconds });
    
    if (acquired) {
      console.log(`[Redis] Acquired inventory lock for ${storeUsername} (TTL: ${ttlSeconds}s)`);
      return true;
    } else {
      console.log(`[Redis] Inventory lock already held for ${storeUsername}`);
      return false;
    }
  } catch (error) {
    console.error(`[Redis] Error acquiring inventory lock for ${storeUsername}:`, error);
    return false;
  }
}

/**
 * Release a Redis lock for inventory refresh operations
 */
export async function releaseInventoryLock(storeUsername: string): Promise<boolean> {
  const lockKey = `inventory-lock:${storeUsername}`;
  const client = await getRedisClient();
  
  try {
    const released = await client.del(lockKey);
    
    if (released > 0) {
      console.log(`[Redis] Released inventory lock for ${storeUsername}`);
      return true;
    } else {
      console.log(`[Redis] No inventory lock found for ${storeUsername}`);
      return false;
    }
  } catch (error) {
    console.error(`[Redis] Error releasing inventory lock for ${storeUsername}:`, error);
    return false;
  }
}

/**
 * Check if an inventory lock is currently held for a store
 */
export async function isInventoryLocked(storeUsername: string): Promise<boolean> {
  const lockKey = `inventory-lock:${storeUsername}`;
  const client = await getRedisClient();
  
  try {
    const exists = await client.exists(lockKey);
    return exists > 0;
  } catch (error) {
    console.error(`[Redis] Error checking inventory lock for ${storeUsername}:`, error);
    return false;
  }
}

/**
 * Execute operation with inventory lock protection
 * Automatically acquires and releases lock
 */
export async function withInventoryLock<T>(
  storeUsername: string,
  operation: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const lockAcquired = await acquireInventoryLock(storeUsername, ttlSeconds);
  
  if (!lockAcquired) {
    throw new Error(`Inventory refresh already in progress for store: ${storeUsername}`);
  }
  
  try {
    const result = await operation();
    return result;
  } finally {
    await releaseInventoryLock(storeUsername);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  matchKeys: number;
  memoryUsage?: string;
}> {
  try {
    const client = await getRedisClient();
    
    // Get all match keys
    const matchKeys = await client.keys('match:*');
    
    // Get total keys (if accessible)
    let totalKeys = 0;
    try {
      const info = await client.info('keyspace');
      const dbMatch = info.match(/db0:keys=(\d+)/);
      totalKeys = dbMatch ? parseInt(dbMatch[1]) : 0;
    } catch {
      // Fallback if keyspace info is not available
      totalKeys = matchKeys.length;
    }
    
    // Get memory usage (if accessible)
    let memoryUsage: string | undefined;
    try {
      const info = await client.info('memory');
      const memMatch = info.match(/used_memory_human:([^\r\n]+)/);
      memoryUsage = memMatch ? memMatch[1].trim() : undefined;
    } catch {
      // Memory info not available
    }
    
    return {
      totalKeys,
      matchKeys: matchKeys.length,
      memoryUsage
    };
  } catch (error) {
    console.error('[Redis] Error getting cache stats:', error);
    return {
      totalKeys: 0,
      matchKeys: 0
    };
  }
}