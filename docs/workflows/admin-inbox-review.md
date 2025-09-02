# Admin Inbox Review Workflow

## Overview

The Admin Inbox Review system replaces the modal-based workflow with a streamlined track-focused interface designed for efficient audio match approval. This system enables admins to process ≥80% matched tracks with minimal clicks and full keyboard navigation.

## System Architecture

### Current Layout Design

The interface uses a simplified layout focused on track processing:

- **Left Sidebar** (250px): Filters, store context, and review guidelines
- **Center Main** (flex): Primary track queue with full track details
- **Right Inspector** (380px): Selected track details and actions (hidden on smaller screens)



### Performance Features

- **Stable Heights**: Fixed row heights prevent layout shift during navigation
- **Skeleton Loading**: Smooth placeholders instead of blocking spinners
- **Adaptive Concurrency**: Device-aware parallel loading (2-8 concurrent requests)
- **Virtualized Scrolling**: Handles 5k+ releases at 60fps
- **Optimistic UI**: Immediate feedback with resilient retry logic

## Matching Buckets System

### Confidence Thresholds

| Bucket | Range | Behavior | UI Treatment |
|--------|-------|----------|--------------|
| **Top Hit** | ≥92% | Auto-approve immediately | Green chip, auto-checked |
| **Fast-Track** | 85-92% | Pre-selected for batch approval | Blue chip, pre-checked |
| **Needs Review** | 65-85% | Require manual decision | Yellow chip, neutral |
| **Don't Bother** | <65% | Hidden by default | Gray chip, collapsed |

### Auto-Approval Logic

```typescript
// Top Hit tracks (≥92% confidence) are automatically approved
if (confidence >= 0.92) {
  status = 'approved';
  bucket = 'top';
  autoApproved = true;
}

// Fast-Track tracks are pre-selected but need confirmation
if (confidence >= 0.85 && confidence < 0.92) {
  status = 'pending';
  bucket = 'fast';
  preSelected = true;
}
```

## User Interface Components

### Left Sidebar (250px)

**Filter Controls**:
- Status filters: All / Needs Review / Auto-approved / Rejected / Low confidence
- Store context display when reviewing specific stores
- Back navigation to main admin interface

**Review Guidelines**:
- Auto-approval rules (≥92% confidence + duration/title checks)
- Spot-check recommendations (1 in 20 auto-approvals)
- Quality control reminders

**Features**:
- Hidden on smaller screens (lg breakpoint)
- Store-focused mode when accessing via `/stores/[storeId]`
- Review rules and workflow guidance

### Center Main (Track Queue)

**Primary Track List**:
- **AdminTrackQueuePane** component handles the main track queue
- Full track details displayed inline (no separate record pane needed)
- Track-focused workflow with all information in one view

**Track Row Features**:
- Track title, artist, and featuring credits
- Audio preview controls
- Match confidence indicators with color coding
- Status chips and action buttons
- Keyboard navigation support

**Loading States**:
- Skeleton placeholders during loading
- Progressive loading with "Load More" functionality
- Maintains scroll position during updates

### Right Inspector (380px)

**Selected Track Details**:
- **AdminTrackInspector** component for detailed track review
- Shows full track information for the currently selected track
- Hidden on smaller screens (xl breakpoint and below)

**Inspector Features**:
- Track metadata and release information
- Audio match details with confidence scoring  
- Action buttons for approve/reject/needs review
- Undo functionality for recent actions
- Link to open release source (Discogs)

**Responsive Behavior**:
- Automatically hidden on screens smaller than xl breakpoint
- Track actions remain accessible via main queue on smaller screens
- Maintains functionality when inspector is collapsed

## Keyboard Navigation

### Primary Shortcuts

| Key | Action | Scope |
|-----|--------|-------|
| `J` / `↓` | Next track | Track navigation |
| `K` / `↑` | Previous track | Track navigation |  
| `A` | Approve track | Selected track |
| `X` | Reject track | Selected track |
| `N` | Mark needs review | Selected track |
| `U` | Undo last action | Previous track action |
| `O` | Open audio source | Selected track (external link) |

### Focus Management

- **Arrow keys** (or J/K) navigate through track list
- Visual cursor indicator shows current track
- Actions apply to the currently highlighted track
- Keyboard navigation doesn't interfere with input fields  
- All shortcuts work without requiring specific focus

## API Endpoints

### Track Queue Management

```typescript
GET /api/admin/review/tracks?status=needs_review&store=store_name&cursor=abc&limit=50
// Returns paginated tracks with full details for track-focused workflow

Response: {
  tracks: TrackQueueItem[],
  pagination: { cursor?, limit, hasMore }
}
```

**TrackQueueItem Structure**:
```typescript
{
  trackId: string,
  releaseId: number,
  title: string,
  artist: string,
  featuring?: string[],
  position: string,
  duration?: string,
  match: {
    confidence: number,
    source: "youtube" | "bandcamp" | "soundcloud" | null,
    url?: string,
    bucket: MatchBucket // 'top' | 'fast' | 'review' | 'hide'
  },
  status: TrackStatus, // 'pending' | 'approved' | 'rejected' | 'needs_review'
  store: string,
  release: {
    title: string,
    year?: number,
    label?: string,
    discogsId: number
  }
}
```

### Track Actions

```typescript
POST /api/admin/review/tracks/:trackId/action
Body: { status: "approved" | "rejected" | "needs_review" }

Response: { 
  success: boolean,
  track: TrackQueueItem,
  timestamp: string 
}
```

## Data Transformation

### Featuring Credits Extraction

Only featuring credits are displayed to reduce noise:

```typescript
// ✅ INCLUDED: Featuring artists
"Track Title feat. Artist Name"
"Song (feat. Vocalist)"

// ❌ EXCLUDED: Technical credits
"Produced by Producer"
"Mixed by Engineer" 
"Backing Vocals by Choir"
```

**Implementation**: Uses `getFeaturing()` utility to extract only artist collaborations.

### Track Status Flow

```
Pending → [Manual Review] → Approved/Rejected/Needs Review
                         ↓
Auto-Approved (≥92%) ────→ [Skip Review] → Approved
```

### Bucket Classification

```typescript
function classifyConfidence(confidence: number): MatchBucket {
  if (confidence >= 0.92) return 'top';      // Auto-approve
  if (confidence >= 0.85) return 'fast';     // Pre-select
  if (confidence >= 0.65) return 'review';   // Manual review
  return 'hide';                             // Hide by default
}
```

## Migration from Modal System

### Phase 1: Feature Flag

- Add `review_inbox_enabled` feature flag
- Keep existing modal system as fallback
- Route `/admin/review` to new inbox interface
- Redirect legacy URLs: `/admin/stores/:id` → `/admin/review?release=:id`

### Phase 2: Navigation Updates

- Add "Review" entry to admin navigation
- Update store management to link to inbox instead of modals
- Preserve deep linking for specific releases

### Phase 3: Complete Migration

- Remove modal components and routes
- Clean up legacy API endpoints
- Update all admin workflows to use inbox

## Performance Targets

### Loading Performance

- **Initial Load**: <1s for queue (20 items)
- **Release Switch**: <200ms with optimistic UI
- **Track Action**: <100ms with immediate feedback
- **Bulk Actions**: Process 50+ tracks in <2s

### User Experience Metrics

- **Approval Rate**: Target ≥80% of tracks auto or fast-track approved
- **Clicks per Release**: <3 clicks average for complete approval
- **Keyboard Efficiency**: 100% navigable without mouse
- **Error Recovery**: All actions idempotent and retry-safe

### Accessibility Compliance

- **Lighthouse A11y**: ≥95 score
- **Screen Reader**: Full compatibility with NVDA/JAWS
- **Keyboard Navigation**: Complete functionality without mouse
- **Color Contrast**: WCAG AA compliance for all text

## Monitoring & Analytics

### Admin Efficiency Metrics

```typescript
// Track admin productivity
interface AdminMetrics {
  releasesPerHour: number;        // Throughput measurement
  averageClicksPerRelease: number; // Efficiency indicator
  keyboardUsagePercent: number;   // Power user adoption
  errorRate: number;              // System reliability
}
```

### System Health Indicators

- API response times by endpoint
- Cache hit rates for repeat views
- Failed optimistic updates (retry needed)
- Queue processing backlog depth

### Business Impact

- Time from upload to approved (release velocity)
- Percentage of releases fully approved (completion rate)
- Admin workload distribution across stores
- Audio match quality over time (confidence trends)

## Troubleshooting

### Common Issues

**"Queue not loading"**
- Check API endpoint `/api/admin/review/queue`
- Verify database connection and query performance
- Monitor for pagination cursor issues

**"Keyboard shortcuts not working"**  
- Ensure focus is not trapped in input fields
- Check for JavaScript event conflicts
- Verify keyboard event listeners are attached

**"Optimistic updates failing"**
- Check network connectivity for retry logic
- Verify API idempotency is working correctly
- Monitor for stale data conflicts

**"Performance degradation with large queues"**
- Verify virtualization is active (check DOM node count)
- Monitor memory usage for memory leaks
- Check for inefficient re-renders in React DevTools

### Feature Flags for Rollback

```typescript
// Emergency rollback capabilities
const flags = {
  review_inbox_enabled: true,      // Main feature flag
  bulk_actions_enabled: true,      // Bulk operations
  keyboard_shortcuts_enabled: true, // Hotkey system
  optimistic_ui_enabled: true      // Immediate feedback
};
```

## Future Enhancements

### Phase 2 Features

- **Sticky Audio Player**: Continues playing while switching tracks
- **Activity Log**: Per-release audit trail of admin actions
- **Bulk Queue Actions**: "Approve all Top Hits in current page"
- **Advanced Filters**: Genre, label, date range filtering

### Phase 3 Features  

- **Machine Learning**: Confidence threshold auto-tuning based on admin feedback
- **Collaboration**: Multi-admin review with assignment and handoff
- **Mobile Optimization**: Touch-friendly interface for tablet review
- **Integration**: Direct publish to consumer feed upon approval

---

## Implementation Summary

The Admin Inbox Review system transforms audio match approval from a modal-heavy workflow to a streamlined, keyboard-navigable interface. With confidence-based auto-approval, optimistic UI updates, and stable performance at scale, admins can efficiently process large volumes of releases while maintaining high match quality standards.

**Target Performance**: ≥80% auto-approved tracks, <3 clicks per release, 100% keyboard navigable.

**Migration Strategy**: Feature-flagged rollout with legacy system fallback, ensuring zero disruption during transition.