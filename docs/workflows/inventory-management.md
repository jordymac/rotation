# Inventory Management System

## Efficient Data Flow Architecture

### Problem Statement
The current system makes real-time Discogs API calls every time inventory is loaded, which is:
- Inefficient (unnecessary API calls)
- Slow (repeated network requests)
- Wasteful (re-processing known releases)

### Proposed Solution: Smart Caching with Database Priority

#### Data Flow Logic
```
1. New Listing Detection
   ├── Check Discogs API for new listings (since last sync)
   ├── Compare with database to identify truly new releases
   └── Queue new releases for audio matching

2. Audio Matching Pipeline  
   ├── Process queued releases through enhanced matching service
   ├── IF ≥1 track has confident match (≥50% confidence)
   │   ├── Store release metadata in database
   │   ├── Store all track matches (approved/pending)
   │   └── Cache full release data for fast retrieval
   └── ELSE: Don't persist (keep using API calls for unmatched releases)

3. Inventory Loading (Store/Feed)
   ├── Query database first for releases with audio matches
   ├── Fetch remaining releases from Discogs API (real-time)
   ├── Merge: DB releases (with audio) + API releases (without audio)
   └── Return unified inventory with optimal performance
```

#### Database Schema Requirements
```sql
-- Main releases table (only for releases with audio matches)
CREATE TABLE releases (
    id BIGINT PRIMARY KEY,
    discogs_id BIGINT UNIQUE NOT NULL,
    store_username TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    year INTEGER,
    label TEXT,
    catno TEXT,
    thumb TEXT,
    genres JSONB,
    styles JSONB,
    tracklist JSONB,
    images JSONB,
    discogs_uri TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    has_audio_matches BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track matches table (existing)
CREATE TABLE track_matches (
    id SERIAL PRIMARY KEY,
    release_id BIGINT REFERENCES releases(discogs_id),
    track_index INTEGER NOT NULL,
    platform TEXT NOT NULL,
    match_url TEXT NOT NULL,
    confidence REAL NOT NULL,
    approved BOOLEAN DEFAULT false,
    verified_by TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store sync tracking
CREATE TABLE store_sync_log (
    id SERIAL PRIMARY KEY,
    store_username TEXT NOT NULL,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    listings_processed INTEGER DEFAULT 0,
    new_releases_found INTEGER DEFAULT 0,
    audio_matches_created INTEGER DEFAULT 0
);
```

#### API Endpoint Redesign

**Enhanced `/api/stores/[storeId]/inventory` Logic:**
```typescript
export async function GET(request: NextRequest, { params }) {
  const { storeId } = await params;
  
  // 1. Get cached releases from database (with audio matches)
  const cachedReleases = await getStoreCachedReleases(storeId);
  
  // 2. Get fresh listings from Discogs API
  const freshListings = await fetchDiscogsInventory(storeId);
  
  // 3. Identify new releases (not in cache)
  const newReleases = freshListings.filter(
    listing => !cachedReleases.some(cached => cached.discogs_id === listing.release.id)
  );
  
  // 4. Queue new releases for background audio matching
  if (newReleases.length > 0) {
    await queueAudioMatching(storeId, newReleases);
  }
  
  // 5. Merge cached (with audio) + fresh (without audio) + processing status
  const mergedInventory = [
    ...cachedReleases, // Fast database retrieval with audio matches
    ...newReleases.map(listing => ({
      ...listing,
      audioMatches: [], // Empty until processing completes
      processingStatus: 'queued' // Indicates background processing
    }))
  ];
  
  return NextResponse.json({
    results: mergedInventory,
    cacheStats: {
      cached: cachedReleases.length,
      fresh: newReleases.length,
      total: mergedInventory.length
    }
  });
}
```

#### Background Processing Service & Automation

**Implementation Status**: ✅ **PROCESSING QUEUE IMPLEMENTED** | ⚠️ **CRON AUTOMATION PENDING**

**Current State**: 
- Processing queue API endpoint fully functional
- Manual triggering working (POST `/api/admin/process-queue`)
- Queue status monitoring available (GET `/api/admin/process-queue`)
- Cron automation configuration needed for full automation

**Hybrid Processing Strategy:**
The system is designed for a two-tier automation approach:

**1. Immediate Processing (≤5 releases)** ⚠️ **INTEGRATION PENDING**
```typescript
// TO BE IMPLEMENTED: In inventory loading logic
if (newReleases.length > 0 && newReleases.length <= 5) {
  logger.info(`Triggering immediate processing for ${newReleases.length} releases`);
  // Non-blocking immediate processing
  fetch('/api/admin/process-queue', { method: 'POST' })
    .catch(error => logger.warn('Immediate processing failed:', error));
}
```

**2. Scheduled Processing (Fallback + Large Batches)** ❌ **CRON CONFIG NEEDED**

**Required Configuration - vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/admin/process-queue",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**Current Processing Implementation - `/api/admin/process-queue`:**
```typescript
export async function POST() {
  const queuedReleases = await getQueuedReleases(5); // Process 5 at a time
  
  for (const release of queuedReleases) {
    // Enhanced audio matching for all tracks
    const tracklist = releaseData.release?.tracklist || [];
    let totalMatches = 0;
    
    for (let trackIndex = 0; trackIndex < tracklist.length; trackIndex++) {
      const matches = await matchService.findAudioMatches(/*...*/);
      
      if (matches.length > 0) {
        const confidentMatches = matches.filter(match => match.confidence >= 0.5);
        if (confidentMatches.length > 0) {
          await saveTrackMatch({
            // Auto-approve confident matches
            approved: true,
            verified_by: 'background-processor'
          });
          totalMatches++;
        }
      }
    }
    
    // Only cache releases with audio matches
    if (totalMatches > 0) {
      await cacheReleaseWithMatches(release.store_username, release.discogs_id, releaseData.release, totalMatches);
    }
  }
}
```

**Implementation Progress:**
- ✅ **Queue Management**: Fully implemented with status tracking
- ✅ **Audio Matching**: Enhanced matching service integrated
- ✅ **Database Persistence**: Track matches and release caching working
- ✅ **Error Handling**: Retry logic and failure tracking
- ⚠️ **Immediate Triggers**: Need inventory loading integration
- ❌ **Cron Scheduling**: Requires vercel.json configuration

**Next Steps for Full Automation:**
1. **Add vercel.json cron configuration** (5 minutes)
2. **Integrate immediate processing trigger** in inventory loading (15 minutes)  
3. **Test end-to-end automation** with sample releases (10 minutes)

#### Migration Strategy

**Phase 1: Implement New Schema**
```bash
# Production migration URL (not localhost)
curl -X POST https://rotation-sigma.vercel.app/api/admin/migrate-inventory-system
```

**Phase 2: Gradual Migration**
- Existing system continues to work (API-only)
- New releases automatically use smart caching
- Background job slowly processes historical releases
- Zero downtime migration

**Phase 3: Performance Monitoring**
- Track cache hit rates
- Monitor API call reduction
- Measure load time improvements

#### Expected Performance Improvements

**Before (Current System):**
- Every inventory load: 10+ Discogs API calls
- Every release: Full metadata fetch + track data
- Load time: ~5-10 seconds for store inventory

**After (Smart Caching):**
- Cache hit rate: 80-90% (for stores with audio matches)
- API calls reduced by 85%
- Load time: ~1-2 seconds for cached releases
- Real-time updates only for genuinely new listings

#### Configuration

**Environment Variables:**
```
# Background processing
BACKGROUND_PROCESSING_ENABLED=true
AUDIO_MATCHING_BATCH_SIZE=5
CACHE_PERSISTENCE_THRESHOLD=50 # Minimum confidence to cache

# Sync frequency
INVENTORY_SYNC_INTERVAL=300000 # 5 minutes
NEW_LISTING_CHECK_INTERVAL=60000 # 1 minute
```

#### Monitoring & Analytics

**Dashboard Metrics:**
- Cache hit rate per store
- API call reduction percentage  
- Background processing queue length
- Audio match success rate
- Load time improvements

This system ensures maximum efficiency while maintaining real-time updates for new listings and optimal user experience.