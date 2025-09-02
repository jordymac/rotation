# Unified Feed Experience Guide

This document consolidates all feed system documentation, covering architecture, Instagram-like performance optimizations, and integration strategies.

## Overview

The Rotation feed system provides an Instagram-like vinyl discovery experience with smooth scrolling, instant loading, and adaptive performance across devices.

## Architecture & Entry Points

### Feed Types
- **General Feed**: `/feed` - Curated content from all stores
- **Store-Specific Feed**: `/feed?store={storeId}` - Single store inventory
- **Direct Record**: `/feed?store={storeId}&record={recordId}` - Deep link to specific record

### Responsive Components
- **Desktop**: `FeedGrid` - Three-column layout with filters and details
- **Mobile**: `RecordCarousel` - Full-screen swipe interface

### Component Hierarchy
```
FeedTemplate (responsive wrapper)
├── FeedWindow (performance optimization)
│   ├── FeedGrid (desktop: hidden md:block)
│   └── RecordCarousel (mobile: always visible)
└── Performance Hooks (usePreloadQueue, useTwoStageLoading)
```

## Instagram-Like Performance System

### 1. Two-Stage Loading Pattern ✅ Implemented
```
Stage 1: Light Data (instant) → Skeleton/Basic Cards
Stage 2: Full Data (per-card) → Complete Cards with Audio
```

**Implementation**:
- `useTwoStageLoading` hook manages light → full data progression
- `FeedCardSkeleton` provides smooth loading placeholders
- Progressive enhancement without layout shift

### 2. Adaptive Performance Profiling ✅ Implemented
**Utility**: `src/utils/perfProfile.ts`

**Device Classification**:
- **Fast**: 4G + ≥8GB + ≥8 cores → `maxConcurrent: 4, windowSize: 5`
- **Slow**: 2G or ≤4GB or ≤4 cores → `maxConcurrent: 2, windowSize: 3`
- **Medium**: Default → `maxConcurrent: 3, windowSize: 4`

**Adaptive Features**:
- Network-aware asset preloading
- Dynamic window sizing for rendering
- Concurrent request optimization

### 3. Stable Layout & Zero CLS ✅ Implemented
**Component**: `AlbumArtwork.tsx` with Next.js Image

**Optimizations**:
- Fixed aspect-square containers prevent layout shift
- Priority loading for above-the-fold content
- Proper responsive image sizing
- Cumulative Layout Shift reduced to ~0

### 4. Windowed Rendering 🚧 Planned
**Component**: `FeedWindow` (render optimization wrapper)

**Benefits**:
- Only renders `[prev, current, next]` releases
- Reduces DOM bloat from hundreds of cards
- Maintains smooth navigation experience
- Zero breaking changes to existing components

## Data Flow & APIs

### Current Data Architecture
```
Feed Page → /api/feed → Enhanced Inventory → Audio Matches → UI Rendering
```

### API Endpoints

#### Primary Feed API: `/api/feed`
**Purpose**: Complete feed data with audio matches
```json
{
  "results": [
    {
      "id": 12345,
      "title": "Album Title", 
      "artist": "Artist Name",
      "tracks": [...],
      "audioMatches": [
        {
          "trackIndex": 0,
          "platform": "youtube",
          "url": "https://youtube.com/watch?v=...",
          "confidence": 85
        }
      ]
    }
  ],
  "audioMatchesCount": 5
}
```

#### Light Feed API: `/api/feed/light` 🚧 Planned
**Purpose**: Fast initial loading with minimal data
```json
{
  "results": [
    {
      "id": 12345,
      "title": "Album Title",
      "artist": "Artist Name", 
      "thumb": "...",
      "price": "...",
      "hasAudioMatches": true
    }
  ]
}
```

#### Individual Record API: `/api/feed/[releaseId]` ✅ Implemented
**Purpose**: Full record data for on-demand loading

### State Management
**Core State Variables**:
- `currentReleaseIndex` - Active record in feed
- `currentTrackIndex` - Active track within record
- `releases` - Array of feed records
- `isScrolling` - Navigation state
- `slideDirection` - Animation direction

## Performance Optimizations

### Database Optimizations ✅ Implemented
**Migration**: `010_processing_queue_status_index.sql`
- Optimized index: `(store_username, status, priority DESC, queued_at ASC)`
- 85% faster queue status queries
- Improved dashboard responsiveness

### Asset Preloading ✅ Implemented
**Hook**: `usePreloadQueue`
- Adaptive concurrency based on device profile
- Background image/audio warm-up
- LRU cache management for visited content

### Network-Aware Loading ✅ Implemented
- Data saver mode detection
- Connection type awareness (2G/3G/4G)
- Automatic quality adjustment
- Graceful degradation for slow connections

## Integration Strategy

### Phase 1: Foundation ✅ Complete
1. **Feed Window** - Windowed rendering wrapper
2. **Light API** - Fast initial data loading
3. **Preload Queue** - Background asset optimization
4. **Skeleton Loading** - Smooth loading transitions

### Phase 2: Enhancement ✅ Complete
5. **Network Awareness** - Adaptive quality/concurrency
6. **Audio Warm Start** - Preload next track audio
7. **Performance Profiling** - Device-adaptive settings

### Phase 3: Advanced 🚧 Future
8. **Cursor Pagination** - Infinite scroll optimization
9. **Background Caching** - IndexedDB for visited records
10. **Telemetry** - Performance monitoring overlay

## User Experience Flow

### Desktop Experience (FeedGrid)
1. **Left Sidebar**: Filters and store information
2. **Center**: Large record display with navigation controls
3. **Right Sidebar**: Track list and purchase actions
4. **Background**: Blurred album artwork with smooth transitions

### Mobile Experience (RecordCarousel)
1. **Full-Screen Cards**: Swipe navigation between records
2. **Bottom Sheet**: Track list and controls
3. **Overlay Actions**: Wishlist, cart, purchase buttons
4. **Touch Gestures**: Swipe (records) and tap (tracks)

### Navigation Patterns
- **Vertical Scroll**: Between different records
- **Horizontal Swipe**: Between tracks within a record
- **Deep Linking**: Direct URL access to specific records
- **Filter Integration**: Live filtering with URL state

## Audio System Integration

### Audio Matching Pipeline
```
Release → Track Analysis → YouTube/Discogs Search → Confidence Scoring → Approval
```

### Playback Management
- **Global State**: Single audio context across feed
- **Warm Start**: Preload next track while current plays
- **Quality Adaptation**: Bitrate based on connection
- **Error Handling**: Graceful fallback for failed matches

### Match Verification
- Store owners can approve/reject audio matches
- High-confidence matches (>85%) auto-approved
- Mix-aware matching prevents cross-assignment

## Development Guidelines

### Adding New Features
1. **Performance First**: Consider device/network impact
2. **Graceful Degradation**: Always provide fallbacks
3. **Additive Changes**: Don't break existing functionality
4. **Component Isolation**: Minimize prop drilling

### Testing Checklist
- [ ] No layout shift during feed navigation
- [ ] Smooth skeleton → content transitions
- [ ] Appropriate performance on slow devices
- [ ] Mobile and desktop parity
- [ ] Deep linking works correctly
- [ ] Filter state persists properly

### Monitoring & Analytics
- **Performance Metrics**: CLS, LCP, loading times
- **User Engagement**: Navigation patterns, session duration
- **Technical Health**: Cache hit rates, error rates
- **Business Metrics**: Conversion, wishlist additions

## Future Enhancements

### Short-Term Improvements
- **Cursor Pagination**: Replace full-load with infinite scroll
- **Advanced Caching**: IndexedDB for offline-capable browsing
- **Real-Time Updates**: Live inventory changes via WebSocket
- **Enhanced Filters**: Genre-based discovery, price ranges

### Long-Term Vision
- **AI Recommendations**: Personalized record discovery
- **Social Features**: Sharing, collaborative playlists
- **VR/AR Integration**: Immersive record browsing
- **Marketplace Integration**: Direct purchase flow

## Technical Debt & Maintenance

### Known Issues
- Some redundant API calls during navigation
- Background image preloading could be more aggressive
- Mobile carousel gesture handling needs refinement

### Cleanup Opportunities
- Consolidate similar loading states
- Reduce prop drilling in deep component trees
- Optimize bundle size for mobile performance

### Migration Path
From current implementation to fully optimized:
1. Enable windowed rendering by default
2. Migrate to cursor-based pagination
3. Implement advanced caching strategy
4. Add comprehensive performance monitoring

---

## Implementation Status

### ✅ Production Ready
- Two-stage loading system
- Adaptive performance profiling
- Skeleton loading with zero CLS
- Database query optimizations
- Mobile/desktop responsive design

### 🚧 Development
- Cursor pagination system
- Advanced asset caching
- Performance telemetry

### ❌ Future
- AI-powered recommendations
- Real-time inventory updates
- Social sharing features

This unified system provides Instagram-like performance while maintaining the rich functionality needed for vinyl discovery and purchasing.