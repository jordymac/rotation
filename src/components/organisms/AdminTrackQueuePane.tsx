'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  TrackQueueItem, 
  QueueFilters, 
  TrackStatus,
  MatchBucket,
  TrackQueuePaneProps,
  CONFIDENCE_THRESHOLDS
} from '@/types/admin-review';
import { Button, Input } from '@/components/atoms';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Track skeleton for loading states
const TrackSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 h-[88px] animate-pulse border-b border-white/10">
    <div className="w-5 h-5 bg-white/10 rounded flex-shrink-0" />
    <div className="w-12 h-12 bg-white/10 rounded flex-shrink-0" />
    <div className="flex-1 grid grid-cols-12 gap-3">
      <div className="col-span-6 space-y-2">
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-3 bg-white/10 rounded w-3/4" />
      </div>
      <div className="col-span-3 flex items-center gap-2">
        <div className="h-6 w-16 bg-white/10 rounded" />
        <div className="h-6 w-20 bg-white/10 rounded" />
      </div>
      <div className="col-span-3 flex justify-end items-center gap-2">
        <div className="h-8 w-8 bg-white/10 rounded" />
        <div className="h-8 w-8 bg-white/10 rounded" />
        <div className="h-8 w-8 bg-white/10 rounded" />
      </div>
    </div>
  </div>
);

// Confidence pill component
interface ConfidencePillProps {
  confidence: number;
  bucket: MatchBucket;
}

const ConfidencePill: React.FC<ConfidencePillProps> = ({ confidence, bucket }) => {
  const config = {
    top: 'bg-emerald-600/90 text-white',
    fast: 'bg-blue-500/90 text-white', 
    review: 'bg-amber-500/90 text-black',
    hide: 'bg-neutral-700 text-neutral-200'
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
      config[bucket]
    )}>
      {confidence}%
    </span>
  );
};

// Track status pill
interface StatusPillProps {
  status: TrackStatus;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const config = {
    approved: 'bg-emerald-900/60 text-emerald-300',
    rejected: 'bg-red-900/60 text-red-300', 
    auto_approved: 'bg-emerald-700/40 text-emerald-200',
    needs_review: 'bg-amber-900/60 text-amber-300',
    pending: 'bg-neutral-800 text-neutral-300'
  };

  const label = status === 'auto_approved' ? 'auto-approved' : status;

  return (
    <span className={cn(
      "text-xs font-medium px-2 py-1 rounded",
      config[status] || config.pending
    )}>
      {label}
    </span>
  );
};

// Individual track item component
interface TrackItemProps {
  track: TrackQueueItem;
  isSelected: boolean;
  isPlaying: boolean;
  previousTrack?: TrackQueueItem;
  onClick: () => void;
  onPlay: () => void;
  onAction: (action: TrackStatus) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ 
  track, 
  isSelected, 
  isPlaying,
  previousTrack,
  onClick,
  onPlay,
  onAction
}) => {
  // Check if this is the start of a new release group
  const isNewRelease = !previousTrack || previousTrack.releaseId !== track.releaseId;

  return (
    <div className={cn(
      "border-b border-white/10",
      isNewRelease && "border-t-2 border-t-white/20" // Visual separator for new releases
    )}>
      {/* Release header for new releases */}
      {isNewRelease && (
        <div className="px-3 py-2 bg-white/5">
          <div className="flex items-center gap-2 text-sm">
            <img 
              src={track.coverUrl} 
              alt={track.releaseTitle}
              className="w-6 h-6 rounded object-cover"
            />
            <span className="font-medium text-white">{track.releaseTitle}</span>
            <span className="text-white/60">— {track.artist}</span>
            <span className="text-white/40 text-xs">{track.store} • {track.year} • #{track.discogsId}</span>
          </div>
        </div>
      )}

      {/* Track row */}
      <div
        className={cn(
          "px-3 py-3 flex items-center gap-3 cursor-pointer transition-colors h-[88px]",
          isSelected ? "bg-neutral-900/60" : "bg-black hover:bg-white/5"
        )}
        onClick={onClick}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500"
          onChange={(e) => e.stopPropagation()}
        />

        {/* Cover (smaller for tracks) */}
        <div className="w-12 h-12 flex-shrink-0 bg-white/10 rounded overflow-hidden">
          {track.coverUrl ? (
            <img 
              src={track.coverUrl} 
              alt={track.releaseTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
              🎵
            </div>
          )}
        </div>

        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-12 items-center gap-3">
          {/* Track info - 6 columns */}
          <div className="col-span-6 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 font-mono flex-shrink-0 w-8">
                {track.position}
              </span>
              <span className="truncate font-medium text-neutral-100">
                {track.title}
              </span>
              {track.featuring?.length ? (
                <span className="text-xs text-neutral-400 truncate">
                  feat. {track.featuring.join(', ')}
                </span>
              ) : null}
            </div>
            <div className="text-sm text-neutral-400 truncate">
              {track.artist} — <span className="italic">{track.releaseTitle}</span>
            </div>
            <div className="mt-1 text-xs text-neutral-500 truncate">
              {track.store} • {track.duration} • Release #{track.discogsId}
            </div>
          </div>

          {/* Confidence & Status - 3 columns */}
          <div className="col-span-3 flex items-center gap-3">
            <ConfidencePill confidence={track.match.confidence} bucket={track.match.bucket} />
            <StatusPill status={track.status} />
          </div>

          {/* Actions - 3 columns */}
          <div className="col-span-3 flex justify-end items-center gap-2">
            {/* Preview/Play button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700"
              title="Preview"
            >
              {isPlaying ? 
                <PauseIcon className="h-4 w-4" /> : 
                <PlayIcon className="h-4 w-4" />
              }
            </button>

            {/* YouTube source button */}
            {track.match.url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(track.match.url, '_blank');
                }}
                className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700"
                title="Open YouTube source"
              >
                <EyeIcon className="h-4 w-4 text-red-400" />
              </button>
            )}

            {/* Approve button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAction('approved');
              }}
              className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700" 
              title="Approve (A)"
            >
              <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
            </button>

            {/* Reject button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAction('rejected');
              }}
              className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700" 
              title="Reject (X)"
            >
              <XCircleIcon className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminTrackQueuePane: React.FC<TrackQueuePaneProps> = ({
  tracks,
  selectedTrackId,
  filters,
  isLoading,
  hasMore,
  onTrackSelect,
  onFiltersChange,
  onLoadMore,
  onTrackAction,
  onPlayTrack
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string>();

  // Filter statistics
  const stats = useMemo(() => {
    return tracks.reduce((acc, track) => {
      acc.total++;
      acc[track.status]++;
      if (track.match.bucket === 'top') acc.topHit++;
      if (track.match.bucket === 'fast') acc.fastTrack++;
      if (track.match.bucket === 'review') acc.needsReview++;
      if (track.match.bucket === 'hide') acc.lowConfidence++;
      return acc;
    }, {
      total: 0,
      approved: 0,
      rejected: 0,
      needs_review: 0,
      pending: 0,
      topHit: 0,
      fastTrack: 0,
      needsReview: 0,
      lowConfidence: 0
    });
  }, [tracks]);

  // Handle search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue || undefined });
  };

  // Handle filter changes
  const handleStatusFilter = (status: QueueFilters['status']) => {
    onFiltersChange({ ...filters, status });
  };

  const handlePlay = (trackId: string) => {
    if (playingTrackId === trackId) {
      setPlayingTrackId(undefined);
    } else {
      setPlayingTrackId(trackId);
      onPlayTrack(trackId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-neutral-100">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Track Review Queue</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            className="text-white/60 hover:text-white"
          >
            <FunnelIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="text"
            placeholder="Search track, artist, release, store…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 bg-neutral-950 border-neutral-800 text-white placeholder-white/40"
          />
        </form>

        {/* Confidence tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'auto_approved', label: `Auto-approved (≥ ${Math.round(CONFIDENCE_THRESHOLDS.TOP_HIT * 100)}%)`, count: stats.topHit },
            { key: 'approved', label: `Manually approved`, count: stats.approved },
            { key: 'needs_review', label: `Needs review (${Math.round(CONFIDENCE_THRESHOLDS.NEEDS_REVIEW * 100)}–${Math.round(CONFIDENCE_THRESHOLDS.FAST_TRACK * 100 - 1)}%)`, count: stats.needsReview },
            { key: 'rejected', label: `Low confidence (< ${Math.round(CONFIDENCE_THRESHOLDS.DONT_BOTHER * 100)}%)`, count: stats.lowConfidence }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleStatusFilter(key as QueueFilters['status'])}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                filters.status === key
                  ? "bg-neutral-800"
                  : "hover:bg-neutral-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="text-xs text-white/60 mb-2">Quick Actions</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Approve Top Hits
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Approve Fast-Track
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && tracks.length === 0 ? (
          // Loading skeletons
          <div>
            {Array.from({ length: 10 }).map((_, i) => (
              <TrackSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div>
            {tracks.map((track, index) => (
              <TrackItem
                key={track.trackId}
                track={track}
                previousTrack={index > 0 ? tracks[index - 1] : undefined}
                isSelected={selectedTrackId === track.trackId}
                isPlaying={playingTrackId === track.trackId}
                onClick={() => onTrackSelect(track.trackId)}
                onPlay={() => handlePlay(track.trackId)}
                onAction={(action) => onTrackAction(track.trackId, action)}
              />
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div className="p-4">
                <Button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
            
            {tracks.length === 0 && !isLoading && (
              <div className="p-8 text-center text-white/60">
                <div className="text-4xl mb-4">📭</div>
                <div>No tracks found</div>
                <div className="text-sm mt-1">Try adjusting your filters</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-neutral-800 text-xs text-white/60 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>{stats.needsReview} need review</span>
          <span>{stats.topHit} auto-approved</span>
          <span>Showing {tracks.length} tracks</span>
        </div>
      </div>
    </div>
  );
};