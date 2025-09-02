# Rotation Naming Conventions

## Component Naming

### Feed Performance Components
- `FeedWindow` - Windowed rendering container (only renders prev/current/next)
- `HydrationBoundary` - Skeleton → full detail transition wrapper
- `RecordSlide` - Individual record card within the window
- `AudioPlayer` - Enhanced audio component with warm start + upgrade
- `NetworkBanner` - Shows connection-aware loading states

### Hook Naming
- `useFeedWindow` - Manages windowed rendering state and recycling
- `usePreloadQueue` - Handles record/asset preloading with concurrency
- `useNetworkPolicy` - Detects connection type and applies loading strategy
- `useAudioWarmStart` - Pre-warms audio and upgrades on dwell
- `useFeedCache` - LRU memory + IndexedDB persistence
- `useCursorPagination` - Handles cursor-based feed pagination
- `useFeedTelemetry` - Performance tracking and analytics
- `useIdlePreload` - Background prefetch during idle time

### Utility Naming
- `NetworkPolicy` - Connection type detection and strategy selection
- `PreloadQueue` - Asset preloading with cancellation support
- `FeedCache` - Dual-layer caching (memory LRU + IndexedDB)
- `AudioWarmStart` - Low→high bitrate audio upgrade utility
- `BlurHashDecoder` - Artwork placeholder generation
- `TelemetryCollector` - Performance metrics aggregation

### API Endpoint Naming
- `GET /api/feed/light` - Light payload for initial load (id, title, artist, thumb, hasAudio)
- `GET /api/records/:id` - Full record detail (tracks, audioMatches, full metadata)
- `GET /api/feed/cursor` - Cursor-based pagination with prefetch hints

### Type Naming
```typescript
// Light payload types
interface LightRecord {
  id: string;
  title: string;
  artist: string;
  artworkThumb: string;
  blurHash?: string;
  hasAudioPreviews: boolean;
  trackCount: number;
}

interface LightFeedResponse {
  results: LightRecord[];
  nextCursor?: string;
  prefetchIds: string[];
}

// Full detail types
interface FullRecord extends LightRecord {
  tracks: DiscogsTrack[];
  audioMatches: AudioMatch[];
  // ... rest of existing DiscogsRelease fields
}

// Performance types
interface NetworkConnection {
  effectiveType: '2g' | '3g' | '4g' | 'unknown';
  saveData: boolean;
}

interface PreloadJob {
  recordId: string;
  priority: number;
  status: 'pending' | 'loading' | 'complete' | 'cancelled';
  assets: {
    image?: Promise<void>;
    audio?: Promise<void>;
    detail?: Promise<FullRecord>;
  };
}

interface TelemetryEvent {
  type: 'feed_impression' | 'swipe_next' | 'time_to_first_audio' | 'audio_upgrade' | 'buffer_event' | 'dwell_time';
  recordId: string;
  timestamp: number;
  value?: number;
  metadata?: Record<string, any>;
}
```

### File Structure
```
src/
  components/
    organisms/
      feed/
        FeedWindow.tsx           # Windowed rendering container
        RecordSlide.tsx          # Individual record within window
        HydrationBoundary.tsx    # Skeleton → detail transition
        AudioPlayer.tsx          # Enhanced audio with warm start
        NetworkBanner.tsx        # Connection-aware UI
  hooks/
    feed/
      useFeedWindow.ts           # Window state management
      usePreloadQueue.ts         # Asset preloading
      useNetworkPolicy.ts        # Connection awareness
      useAudioWarmStart.ts       # Audio optimization
      useFeedCache.ts           # Dual-layer caching
      useCursorPagination.ts    # Cursor-based pagination
      useFeedTelemetry.ts       # Performance tracking
      useIdlePreload.ts         # Background prefetch
  lib/
    feed/
      NetworkPolicy.ts          # Connection detection
      PreloadQueue.ts           # Asset preloading engine
      FeedCache.ts             # Memory + IndexedDB cache
      AudioWarmStart.ts        # Audio upgrade utility
      BlurHashDecoder.ts       # Artwork placeholders
      TelemetryCollector.ts    # Analytics collection
  types/
    feed.ts                    # Feed-specific types
    performance.ts             # Performance and telemetry types
```

## Naming Principles

1. **Feed-Specific Prefixes**: Use `Feed`, `Record`, `Audio` prefixes for feed-related components
2. **Performance Indicators**: Include `Preload`, `Cache`, `Network`, `Telemetry` for optimization features
3. **State Descriptors**: Use `Window`, `Queue`, `Policy`, `Boundary` for state management
4. **Action Verbs**: `warm`, `upgrade`, `prime`, `hydrate` for performance actions
5. **Connection Types**: `Light`, `Full`, `Cursor` for data fetching strategies

## Implementation Priority Order

1. **Core Performance** (CP1-2): `FeedWindow`, `usePreloadQueue`, `HydrationBoundary`
2. **Network Optimization** (CP3-4): `useNetworkPolicy`, `useAudioWarmStart`, cancellation
3. **Caching Layer** (CP5): `useFeedCache`, `FeedCache`
4. **Advanced Features** (CP6): `useIdlePreload`, `useFeedTelemetry`

Do these naming conventions align with the existing codebase patterns? Should I proceed with implementing the windowed rendering first?