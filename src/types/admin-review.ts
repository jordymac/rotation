// Admin Review System Types
// Inbox-style workflow for efficient audio match approval

export type MatchBucket = 'top' | 'fast' | 'review' | 'hide';
export type TrackStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';
export type ReleaseStatus = 'needs_review' | 'auto_approved' | 'rejected' | 'completed';

// Confidence thresholds for matching buckets
export const CONFIDENCE_THRESHOLDS = {
  TOP_HIT: 0.92,      // ≥0.92 → auto-approve immediately
  FAST_TRACK: 0.85,   // 0.85-0.92 → pre-selected for batch approval
  NEEDS_REVIEW: 0.65, // 0.65-0.85 → require human decision
  DONT_BOTHER: 0.50   // <0.50 → hidden by default
} as const;

// Track view model optimized for admin review
export interface TrackVM {
  id: string;
  position: string;
  title: string;
  featuring?: string[]; // Only featuring credits, e.g., ["Ledisi", "Wes Maples"]
  match: {
    confidence: number;
    source: "youtube" | "bandcamp" | "soundcloud" | null;
    url?: string;
    bucket: MatchBucket;
  };
  status: TrackStatus;
  duration?: string;
}

// Release view model for queue display
export interface ReleaseQueueItem {
  id: string;
  discogsId: number;
  title: string;
  artist: string;
  coverUrl?: string;
  store: string;
  freshness: 'new' | 'recent' | 'old'; // Based on processing date
  needsReviewCount: number;
  totalTracks: number;
  status: ReleaseStatus;
  updatedAt: string;
}

// Track queue item for track-level review interface
export interface TrackQueueItem {
  id: string;
  trackId: string; // Unique track identifier
  releaseId: string;
  discogsId: number;
  position: string;
  title: string;
  featuring?: string[];
  artist: string; // Release artist
  releaseTitle: string;
  coverUrl?: string;
  store: string;
  duration?: string;
  year?: number;
  label?: string;
  match: {
    confidence: number;
    source: "youtube" | "bandcamp" | "soundcloud" | null;
    url?: string;
    bucket: MatchBucket;
  };
  status: TrackStatus;
  createdAt: string;
  updatedAt: string;
}

// Full release data for center pane
export interface ReleaseDetail {
  id: string;
  discogsId: number;
  title: string;
  artist: string;
  coverUrl?: string;
  store: string;
  year?: number;
  label?: string;
  tracks: TrackVM[];
  matchSummary: {
    topHit: number;
    fastTrack: number;
    needsReview: number;
    dontBother: number;
  };
  status: ReleaseStatus;
  canApprove: boolean; // True if all tracks are approved/auto-approved
}

// Queue filters and search
export interface QueueFilters {
  status: 'all' | 'needs_review' | 'auto_approved' | 'approved' | 'rejected';
  search?: string; // Search by title/artist/store
  store?: string;
}

// Pagination for virtualized list
export interface QueuePagination {
  cursor?: string;
  limit: number;
  hasMore: boolean;
}

// API response types
export interface QueueResponse {
  items: ReleaseQueueItem[];
  pagination: QueuePagination;
}

export interface TrackQueueResponse {
  items: TrackQueueItem[];
  pagination: QueuePagination;
}

export interface ReviewActionResponse {
  ok: boolean;
  version: number;
  updatedAt: string;
}

// Keyboard shortcut actions
export type KeyboardAction = 
  | 'next_release'           // J
  | 'prev_release'           // K  
  | 'approve_track'          // A
  | 'reject_track'           // R
  | 'needs_review_track'     // N
  | 'open_source'            // O
  | 'play_pause'             // Space
  | 'approve_release';       // Enter

// Performance profile for adaptive concurrency
export interface AdminPerfProfile {
  maxConcurrent: number;     // Parallel fetch window
  windowSize: number;        // Virtualization window
  prefetchCount: number;     // Items to preload
}

// Activity log for audit trail
export interface ReviewActivity {
  id: string;
  releaseId: string;
  trackId?: string;
  action: 'approved' | 'rejected' | 'needs_review' | 'bulk_approved';
  userId: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    source?: string;
    bulkCount?: number;
  };
}

// Bulk actions
export interface BulkAction {
  type: 'approve_all_top_hits' | 'approve_all_fast_track';
  releaseIds?: string[];      // If specified, apply to these releases only
  currentPageOnly?: boolean;  // Apply only to currently visible items
}

// Feature flags
export interface AdminFeatureFlags {
  review_inbox_enabled: boolean;
  bulk_actions_enabled: boolean;
  audio_preview_enabled: boolean;
  keyboard_shortcuts_enabled: boolean;
}

// Component props interfaces
export interface QueuePaneProps {
  releases: ReleaseQueueItem[];
  selectedReleaseId?: string;
  filters: QueueFilters;
  isLoading: boolean;
  hasMore: boolean;
  onReleaseSelect: (releaseId: string) => void;
  onFiltersChange: (filters: QueueFilters) => void;
  onLoadMore: () => void;
  onBulkAction: (action: BulkAction) => void;
}

export interface RecordPaneProps {
  release: ReleaseDetail | null;
  isLoading: boolean;
  onApproveRelease: () => void;
  onRejectRelease: () => void;
}

export interface TracksPaneProps {
  tracks: TrackVM[];
  selectedTrackId?: string;
  isLoading: boolean;
  onTrackAction: (trackId: string, action: TrackStatus) => void;
  onTrackSelect: (trackId: string) => void;
  onPlayTrack: (trackId: string) => void;
}

export interface TrackQueuePaneProps {
  tracks: TrackQueueItem[];
  selectedTrackId?: string;
  filters: QueueFilters;
  isLoading: boolean;
  hasMore: boolean;
  onTrackSelect: (trackId: string) => void;
  onFiltersChange: (filters: QueueFilters) => void;
  onLoadMore: () => void;
  onTrackAction: (trackId: string, action: TrackStatus) => void;
  onPlayTrack: (trackId: string) => void;
}

// Utility type for bucket classification
export function classifyConfidence(confidence: number): MatchBucket {
  if (confidence >= CONFIDENCE_THRESHOLDS.TOP_HIT) return 'top';
  if (confidence >= CONFIDENCE_THRESHOLDS.FAST_TRACK) return 'fast';
  if (confidence >= CONFIDENCE_THRESHOLDS.NEEDS_REVIEW) return 'review';
  return 'hide';
}

// Utility for determining release approval eligibility
export function canApproveRelease(tracks: TrackVM[]): boolean {
  return tracks.every(track => 
    track.status === 'approved' || 
    track.match.bucket === 'top' // Auto-approved top hits
  );
}

// Utility for calculating match summary
export function calculateMatchSummary(tracks: TrackVM[]): ReleaseDetail['matchSummary'] {
  return tracks.reduce(
    (summary, track) => {
      summary[track.match.bucket === 'top' ? 'topHit' : 
             track.match.bucket === 'fast' ? 'fastTrack' :
             track.match.bucket === 'review' ? 'needsReview' : 'dontBother']++;
      return summary;
    },
    { topHit: 0, fastTrack: 0, needsReview: 0, dontBother: 0 }
  );
}