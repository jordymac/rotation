# Caching & Persistent Storage for Audio Matches

This document describes the implementation of the multi-layer caching and persistence system for audio matches in Rotation.

## Overview

The system implements a three-tier architecture to optimize audio match lookups:

1. **Redis Cache** (fastest) - In-memory cache with 24h TTL
2. **Postgres Database** (medium) - Persistent storage for approved matches
3. **External APIs** (slowest) - YouTube, SoundCloud for fresh matches

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Redis Cache   │ ──▶│  Postgres DB     │ ──▶│  External APIs  │
│   (24h TTL)     │    │  (Persistent)    │    │  (YouTube, SC)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
      Fastest              Medium Speed            Slowest
```

## Database Schema

### track_matches Table
```sql
CREATE TABLE track_matches (
    id SERIAL PRIMARY KEY,
    release_id BIGINT NOT NULL,
    track_index INTEGER NOT NULL,
    platform TEXT NOT NULL,
    match_url TEXT NOT NULL,
    confidence REAL NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false,
    verified_by TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(release_id, track_index)
);
```

### discogs_tokens Table
```sql
CREATE TABLE discogs_tokens (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    access_secret TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'oauth',
    expires_at TIMESTAMPTZ,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/rotation

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Encryption key for storing sensitive data
ENCRYPTION_KEY=your_32_character_hex_encryption_key_here

# Discogs API
DISCOGS_USER_TOKEN=your_discogs_token_here
```

### 2. Install Dependencies

```bash
npm install
```

The following packages are installed:
- `redis` - Redis client
- `pg` - PostgreSQL client
- `pg-promise` - PostgreSQL promise-based interface

### 3. Setup Database and Cache

```bash
# Run migrations and setup
npm run setup-cache-db

# Test the system
npm run test-match-service
```

### 4. Run Tests

```bash
# Unit tests
npm test

# With coverage
npm test:coverage

# Watch mode
npm test:watch
```

## Usage

### Basic Usage

```javascript
import { getOrComputeMatch } from '@/lib/match-service';

// Get or compute a match (handles all caching layers automatically)
const match = await getOrComputeMatch(
  123456,     // releaseId
  0,          // trackIndex
  "admin",    // adminUserId
  "Album Title", // releaseTitle (for fresh computation)
  "Artist Name", // releaseArtist (for fresh computation)
  {           // trackInfo (for fresh computation)
    position: "A1",
    title: "Track Title",
    duration: "3:45",
    artists: []
  }
);

console.log(match.source); // "cache", "database", or "computed"
```

### Manual Match Management

```javascript
import { approveMatch, rejectMatch, clearMatch } from '@/lib/match-service';

// Manually approve a match
const approved = await approveMatch(
  123456, 0,
  "youtube",
  "https://youtube.com/watch?v=abc123",
  0.85,
  "admin"
);

// Reject and optionally provide better match
await rejectMatch(123456, 0, "admin", {
  platform: "soundcloud",
  matchUrl: "https://soundcloud.com/better-match",
  confidence: 0.9
});

// Clear a match completely
await clearMatch(123456, 0);
```

### Health Monitoring

```javascript
import { healthCheck } from '@/lib/match-service';

const health = await healthCheck();
console.log({
  database: health.database,  // boolean
  redis: health.redis,        // boolean
  cacheStats: health.cacheStats // { totalKeys, matchKeys, memoryUsage }
});
```

## Caching Strategy

### Cache Key Format
```
match:{releaseId}:{trackIndex}
```

Example: `match:123456:0`

### Cache Value Format
```json
{
  "platform": "youtube",
  "match_url": "https://youtube.com/watch?v=abc123",
  "confidence": 0.85,
  "approved": true,
  "verified_by": "admin",
  "verified_at": "2024-01-01T00:00:00.000Z"
}
```

### Auto-Approval Logic

Matches are automatically approved and persisted when:
- Confidence score ≥ 0.8 (80%)
- Match is found from external APIs

Manual review required when:
- Confidence score < 0.8
- No matches found
- Multiple high-confidence matches exist

## Performance Optimization

### Expected Performance
- **Cache Hit**: ~1-5ms
- **Database Hit**: ~10-50ms  
- **Fresh Computation**: ~500-2000ms

### Cache Statistics

Monitor cache performance:

```bash
# Get current cache stats
npm run cache:test

# Or programmatically
const { getCacheStats } = require('./src/lib/redis');
const stats = await getCacheStats();
```

## Error Handling

The system gracefully degrades:

1. **Redis Unavailable**: Falls back to database + fresh computation
2. **Database Unavailable**: Still serves from cache if available
3. **External APIs Fail**: Returns appropriate error, doesn't break app

## Monitoring & Maintenance

### Database Maintenance

```sql
-- Check match statistics
SELECT 
  platform,
  COUNT(*) as total_matches,
  AVG(confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE approved = true) as approved_count
FROM track_matches 
GROUP BY platform;

-- Clean up old unapproved matches
DELETE FROM track_matches 
WHERE approved = false 
  AND created_at < NOW() - INTERVAL '30 days';
```

### Cache Maintenance

```javascript
// Clear specific release matches
await clearAllMatchesForRelease(releaseId);

// Get cache statistics
const stats = await getCacheStats();
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check Redis is running
   redis-cli ping
   
   # Check connection string
   echo $REDIS_URL
   ```

2. **Database Connection Failed**
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT NOW();"
   ```

3. **Migrations Failed**
   ```bash
   # Manual migration
   psql $DATABASE_URL -f migrations/001_create_track_matches.sql
   psql $DATABASE_URL -f migrations/002_create_discogs_tokens.sql
   ```

4. **High Memory Usage**
   ```bash
   # Check Redis memory usage
   redis-cli info memory
   
   # Clear all cache if needed
   redis-cli flushdb
   ```

### Debug Mode

Enable detailed logging:

```bash
NODE_ENV=development npm run test-match-service
```

## Integration with Existing APIs

The caching system integrates with existing audio match API endpoints:

- `GET /api/admin/releases/[releaseId]/audio-match`
- `POST /api/admin/releases/[releaseId]/tracks/[trackId]/match`

These endpoints now automatically use the caching layer for improved performance.

## Future Enhancements

- **Cache Warming**: Pre-populate cache for popular releases
- **Analytics**: Track cache hit rates and performance metrics
- **Distributed Caching**: Redis Cluster for horizontal scaling
- **Background Jobs**: Async match computation for large catalogs
- **ML Improvements**: Better confidence scoring algorithms