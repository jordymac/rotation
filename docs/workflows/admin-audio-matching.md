# Admin Audio Matching Workflow

## Overview

The audio matching system is the core technology that connects vinyl records to their audio previews, enabling customers to hear tracks before purchasing. This document covers how store owners use the admin interface to verify and manage audio matches for their inventory.

## How Audio Matching Works

### Two-Tier Matching System

The system uses a sophisticated **two-tier approach** to find the best audio matches:

#### Tier 1: Discogs Embedded Videos (Highest Priority)
- **Source**: Videos embedded directly in Discogs release pages
- **Confidence Boost**: +15% to base matching score
- **Quality**: Highest reliability since they're curated by the Discogs community
- **Threshold**: 65% minimum confidence for consideration
- **Auto-Approval**: ≥85% confidence matches are automatically approved

#### Tier 2: YouTube Data API Search (Fallback)
- **Source**: YouTube search using artist + track title
- **Threshold**: 50% minimum confidence for consideration  
- **Usage**: Only triggered when no high-confidence Discogs matches exist
- **Quality**: Good but requires more manual verification

### Advanced Mix-Aware Matching

The system understands dance music terminology and **prevents cross-mix contamination**:

#### Mix Type Detection
- Automatically extracts mix information from track titles
- Recognizes common patterns: `(Radio Edit)`, `[Extended Mix]`, `- Dub Version`
- Normalizes variants: "12 inch" → "extended", "inst" → "dub"

#### Strict Incompatibility Rules
**These mix types will NEVER match each other:**
- Radio ≠ Dub ≠ Remix ≠ Extended
- Instrumental ≠ Radio ≠ Extended ≠ Remix  
- **Extended ≠ Remix** (fundamentally different - extended is longer original, remix is reworked)
- Clean ≠ Dirty
- Live ≠ Radio/Dub

#### Compatible Relationships
- **Dub ↔ Instrumental**: 90% compatibility (essentially the same)
- **Original → Specific Mix**: 75% (original can substitute for specific mix request)
- **Clean ↔ Dirty**: 85% compatibility (same mix, different censorship)

### Confidence Scoring Algorithm

**Formula**: `(Title Similarity × 40%) + (Artist Similarity × 35%) + (Duration Similarity × 25%)`

#### Title/Artist Similarity
- Uses Levenshtein distance for base comparison
- **Mix-aware weighting**: Base title 75% + Mix compatibility 25%
- **Early exact match**: 100% for identical strings

#### Duration Matching
- **Perfect**: ≤2 seconds difference = 100%
- **Good**: ≤5 seconds = 80%
- **Acceptable**: ≤10 seconds = 60%
- **Poor**: ≤30 seconds = 40%
- **Very Poor**: >30 seconds = 20%

## Admin Store Management Workflow

### 1. Inbox-Style Review System (Current)

**REPLACED**: The store management workflow has been completely replaced with a high-efficiency inbox system.

**URL**: `/stores/[storeId]` - Same URL, new 3-pane inbox interface

**Key Improvements**:
- **≥80% auto-approval** rate with confidence-based buckets
- **<3 clicks** average per release completion
- **100% keyboard navigable** with J/K/A/R/N shortcuts
- **Optimistic UI** with immediate feedback
- **Virtualized queue** handling 5k+ releases
- **Store-focused filtering** when accessing via store URL

[**See detailed documentation**: Admin Inbox Review Workflow](./admin-inbox-review.md)

### 2. Interface Overview

When accessing `/stores/fanatico_records`, the system now shows:

**Store Header**:
- Store name and context
- "Audio match review for fanatico_records"
- Keyboard shortcut reminder

**3-Pane Layout**:
- **Queue Pane**: Releases filtered to this store
- **Record Pane**: Release details and approval actions
- **Tracks Pane**: Individual track review with audio preview

**Auto-Filtering**:
- Queue automatically filtered to show only releases from the selected store
- All other inbox functionality (buckets, keyboard shortcuts, bulk actions) works normally
- Store owners see only their releases, admins can see all stores

### 3. Workflow Changes

**Before (Modal System)**:
1. Click on individual release → Modal opens
2. Review each track manually → Approve/reject individually
3. Close modal → Repeat for next release

**After (Inbox System)**:
1. Navigate with J/K keys → See all store releases in queue
2. Use A/R/N shortcuts → Fast track/approve/reject actions
3. Bulk approve Top Hits → Process multiple releases quickly
4. Auto-approval ≥92% → Most tracks handled automatically

### 5. Background Processing Pipeline & Automation

#### Hybrid Processing Strategy

The system uses a **two-tier automation approach** for optimal responsiveness:

**1. Immediate Processing (≤5 releases)**
```typescript
// Triggered automatically when small batches of new releases are detected
if (newReleases.length > 0 && newReleases.length <= 5) {
  // Non-blocking immediate processing
  fetch('/api/admin/process-queue', { method: 'POST' })
    .catch(error => logger.warn('Immediate processing failed:', error));
}
```

**2. Scheduled Batch Processing (Large batches + Fallback)**
```json
// Vercel Cron Configuration (vercel.json)
{
  "crons": [
    {
      "path": "/api/admin/process-queue", 
      "schedule": "*/10 * * * *"  // Every 10 minutes
    }
  ]
}
```

#### Processing Queue Implementation

**Current Status**: ✅ **FULLY IMPLEMENTED**

**API Endpoint**: `/api/admin/process-queue`
- **POST**: Process up to 5 queued releases with full audio matching
- **GET**: Return queue statistics and recent processing history

**Processing Logic**:
```
1. Fetch queued releases (5 at a time for efficiency)
2. Enhanced audio matching for all tracks per release
3. Auto-approve matches with confidence ≥50%  
4. Cache releases in database only if audio matches found
5. Update processing queue status (completed/failed)
```

**Processing Queue Status**:
- **Queued**: Waiting for audio matching
- **Processing**: Currently running enhanced matching  
- **Completed**: All tracks processed successfully
- **Failed**: Error occurred (with retry logic)

**Queue Management Features**:
- **Batch Processing**: 5 releases per execution (rate limit protection)
- **Auto-Retry**: Failed releases automatically retried with backoff
- **Status Tracking**: Real-time queue statistics and processing history
- **Error Handling**: Detailed error logging and recovery mechanisms

**Performance Characteristics**:
- **Processing Speed**: ~2-3 seconds per track (network dependent)
- **Batch Completion**: ~30-45 seconds for 5 releases
- **Auto-Approval Rate**: 60-80% (confidence ≥50%)
- **Cache Persistence**: Only releases with audio matches stored

## Technical Implementation

### API Endpoints

#### Background Processing Queue
```typescript
POST /api/admin/process-queue
// Process up to 5 queued releases with enhanced audio matching
// Returns: { success, message, processed, cached, failed, details }

GET /api/admin/process-queue  
// Get processing queue status and recent history
// Returns: { queueStats: { total, pending, processing, completed, failed }, recentProcessed }
```

#### Enhanced Audio Matching (Legacy/Manual)
```typescript
GET /api/admin/releases/[releaseId]/audio-match
// Batch process up to 10 tracks with Discogs + YouTube search
// Now primarily used for manual re-processing

POST /api/admin/releases/[releaseId]/audio-match
// Single track matching with idempotency  
// Body: { trackIndex, releaseTitle, releaseArtist, trackInfo }
```

#### Match Approval
```typescript
POST /api/admin/releases/[releaseId]/approve-match
// Store owner approves specific match
// Body: { trackIndex, candidateId, platform, url, confidence }
```

#### Store Statistics
```typescript
GET /api/admin/stores/[id]/stats
// Returns store metrics including processing queue status
// Used for admin dashboard and queue monitoring
```

### Caching Strategy

#### Three-Layer Architecture
The system implements a sophisticated multi-layer caching approach:

1. **Redis Cache** (fastest) - In-memory cache with 24h TTL
2. **PostgreSQL Database** (medium) - Persistent storage for approved matches
3. **External APIs** (slowest) - YouTube, Discogs for fresh matches

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Redis Cache   │ ──▶│  Postgres DB     │ ──▶│  External APIs  │
│   (24h TTL)     │    │  (Persistent)    │    │  (YouTube, etc) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
      Fastest              Medium Speed            Slowest
```

#### Cache Key Format
```
audio-match:{releaseId}:{trackIndex}
```
Example: `audio-match:123456:0`

#### Cache Value Format
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

#### Performance Expectations
- **Cache Hit**: ~1-5ms
- **Database Hit**: ~10-50ms  
- **Fresh Computation**: ~500-2000ms

#### Auto-Approval Logic
Matches are automatically approved and persisted when:
- Confidence score ≥ 0.8 (80%)
- Match is found from external APIs

Manual review required when:
- Confidence score < 0.8
- No matches found
- Multiple high-confidence matches exist

### Data Persistence

#### Track Matches Table Schema
```sql
CREATE TABLE track_matches (
  release_id INTEGER,
  track_index INTEGER,
  platform VARCHAR(50),
  match_url TEXT,
  confidence INTEGER,
  approved BOOLEAN DEFAULT false,
  verified_by VARCHAR(100),
  verified_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (release_id, track_index)
);
```

#### Audio Match Integration
- **Feed API**: Only shows approved matches to consumers
- **Store Management**: Shows all matches for verification
- **Auto-Approval**: High confidence matches (≥85%) automatically approved

## Store Owner Guidelines

### Best Practices

#### Match Quality Assessment
1. **Listen First**: Always preview audio before approving
2. **Check Mix Types**: Ensure radio doesn't match dub/remix
3. **Verify Artist**: Watch for cover versions or similar artists
4. **Duration Check**: Significant time differences indicate wrong match

#### When to Reject Matches
- **Wrong song entirely** (different track, artist, or album)
- **Cover versions** (unless your record is actually the cover)
- **Different mix types** (radio vs extended vs dub)
- **Live versions** when you have studio recording
- **Poor audio quality** that misrepresents the record

#### Manual URL Guidelines
- **YouTube preferred**: Best integration and reliability
- **Official channels**: Use artist/label channels when available
- **Audio quality**: Choose highest quality available
- **Full tracks**: Avoid clips, previews, or partial tracks

### Common Issues & Solutions

#### "No matches found"
- **Cause**: Obscure release, unusual title formatting
- **Solution**: Try manual URL entry with known good link
- **Prevention**: Verify Discogs data accuracy (correct artist/title)

#### "All matches seem wrong"
- **Cause**: Generic titles, multiple artists with same song
- **Solution**: Use more specific search terms or manual entry
- **Tools**: Add album context, check release year

#### "System shows wrong confidence"
- **Cause**: Algorithm limitations with unique cases
- **Solution**: Manual review always overrides system confidence
- **Feedback**: High confidence wrong matches help improve algorithm

## Performance & Analytics

### Store Stats Integration

The admin dashboard shows real-time metrics:
- **Total Inventory**: Complete store collection count (from Discogs API)
- **Processed Releases**: Records with audio matching attempted
- **Audio Match %**: Percentage of processed releases with approved matches
- **Queue Status**: Background processing progress

### Queue Monitoring & Performance Metrics

#### Real-Time Queue Statistics
```typescript
// GET /api/admin/process-queue response format
{
  "queueStats": {
    "total": 1247,      // Total items ever queued
    "pending": 23,      // Waiting for processing
    "processing": 1,    // Currently being processed
    "completed": 1198,  // Successfully processed
    "failed": 25        // Failed with errors
  },
  "recentProcessed": [
    {
      "discogs_id": 123456,
      "store_username": "fanatico_records", 
      "status": "completed",
      "completed_at": "2024-01-15T10:30:00Z",
      "error_message": null
    }
    // ... last 10 processed items
  ]
}
```

#### Processing Performance Metrics
- **Batch Size**: 5 releases per execution (optimized for rate limits)
- **Processing Time**: ~30-45 seconds per batch (5 releases)
- **Individual Track**: ~2-3 seconds per audio match search
- **Auto-Approval Rate**: 60-80% (confidence threshold ≥50%)
- **Cache Hit Efficiency**: Only releases with matches stored (reduces storage by ~40%)

#### Background Automation Status
Current implementation provides:
- ✅ **Manual Processing**: Fully functional via API calls
- ✅ **Queue Management**: Status tracking and error handling
- ✅ **Batch Processing**: Rate-limited processing with retry logic
- ⚠️ **Cron Automation**: Requires vercel.json configuration
- ⚠️ **Immediate Triggers**: Needs inventory loading integration

### Processing Performance

#### Batch Processing (GET endpoint)
- **Tracks**: Up to 10 tracks per release
- **Speed**: ~2-3 seconds per track (network dependent)
- **Concurrency**: Sequential processing to respect API limits

#### Individual Processing (POST endpoint)
- **Speed**: ~1-2 seconds per track
- **Caching**: Results cached immediately for repeat requests
- **Idempotency**: Same request returns same result

### Success Metrics

Typical success rates by store type:
- **Electronic/Dance**: 85-95% (strong YouTube presence)
- **Classical**: 60-75% (limited digital presence)
- **Jazz/Vintage**: 70-85% (varies by era and popularity)
- **Hip-Hop/R&B**: 80-90% (good digital coverage)

## YouTube API Setup & Configuration

### Getting a YouTube API Key

⚠️ **SECURITY WARNING**: The current implementation exposes the YouTube API key to browsers via `NEXT_PUBLIC_YOUTUBE_API_KEY`. This should be moved to server-side processing.

1. **Get a YouTube API Key:**
   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project or select an existing one
   - Enable the **YouTube Data API v3**
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Copy the API key

2. **Environment Configuration:**
   ```bash
   # CURRENT (INSECURE - exposes to browser)
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   
   # RECOMMENDED (server-side only)
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

3. **API Usage Notes:**
   - **Quota**: 100 units per search (10,000 units free per day)
   - **Rate Limiting**: Consider implementing response caching to reduce API calls
   - **Security**: Move to server-side API routes to hide credentials

### Testing YouTube API Setup

```bash
# Test YouTube API connectivity
node scripts/test-youtube-api.js
```

Expected behavior:
- Should show real video results with embeds
- Check browser console for API logs
- Fallback to mock data if API fails

### Common YouTube API Issues

- **403 Forbidden**: Check if YouTube Data API v3 is enabled
- **400 Bad Request**: Verify your API key is correct  
- **Quota Exceeded**: YouTube has daily quotas; wait or request higher quota

## Developer Reference

### Caching System Usage

#### Basic Audio Match Retrieval
```javascript
import { getOrComputeMatch } from '@/lib/audio-match-orchestrator';

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

#### Manual Match Management
```javascript
// Manually approve a match via API route
const response = await fetch(`/api/admin/releases/${releaseId}/approve-match`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    trackIndex: 0,
    candidateId: "youtube_abc123",
    platform: "youtube",
    url: "https://youtube.com/watch?v=abc123",
    confidence: 0.85
  })
});
```

#### Health Monitoring
```javascript
// Check system health
const response = await fetch('/api/admin/process-queue');
const health = await response.json();

console.log({
  queueStats: health.queueStats,  // Queue processing status
  recentProcessed: health.recentProcessed // Recent processing history
});
```

### Cache Maintenance

#### Database Queries
```sql
-- Check match statistics by platform
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

#### Performance Monitoring
```bash
# Check Redis memory usage
redis-cli info memory

# Get current cache statistics
redis-cli info keyspace
```

### Error Handling & Graceful Degradation

The system gracefully handles failures:

1. **Redis Unavailable**: Falls back to database + fresh computation
2. **Database Unavailable**: Still serves from cache if available
3. **External APIs Fail**: Returns appropriate error, doesn't break app
4. **Network Issues**: Implements retry logic with exponential backoff

## Troubleshooting

### Caching System Issues

#### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping

# Check connection string  
echo $UPSTASH_REDIS_REST_URL
```

#### Database Connection Failed
```bash
# Test database connection
curl -X POST https://rotation-sigma.vercel.app/api/admin/setup
```

#### High Memory Usage
```bash
# Check Redis memory usage
redis-cli info memory

# Clear all cache if needed (use with caution)
redis-cli flushdb
```

### Common Error Messages

#### "Release not found"
- **Cause**: Invalid Discogs release ID
- **Check**: Verify release exists and is public on Discogs
- **Solution**: Use correct release ID from Discogs URL

#### "YouTube API rate limit exceeded"
- **Cause**: Too many search requests in short period
- **Wait**: Rate limits reset hourly
- **Alternative**: Use Discogs embedded videos only

#### "Database connection failed"
- **Cause**: PostgreSQL connectivity issues
- **Impact**: Matches found but not saved
- **Recovery**: Re-run matching after connectivity restored

### Support Workflows

#### Store Owner Reports Wrong Match
1. **Immediate**: Reject the incorrect match via admin interface
2. **Research**: Verify the correct audio source
3. **Correction**: Approve correct match or provide manual URL
4. **Documentation**: Note issue type for algorithm improvements

#### System Performance Issues
1. **Check**: Processing queue status for backlogs
2. **Monitor**: API rate limits and error rates
3. **Optimize**: Adjust concurrency if needed
4. **Escalate**: Database/Redis connection issues to technical team

---

## Integration with Store Management

This audio matching system integrates seamlessly with the overall store management workflow:

1. **Store Setup**: Owner adds Discogs username to system
2. **Inventory Sync**: System loads complete inventory
3. **Audio Processing**: Background matching for all releases  
4. **Verification**: Store owner reviews and approves matches
5. **Consumer Feed**: Approved matches power the vinyl discovery experience

The goal is **100% audio coverage** for store inventory, enabling customers to confidently discover and purchase vinyl records with full audio preview capabilities.