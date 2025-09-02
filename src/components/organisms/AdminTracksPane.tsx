'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { TrackVM, TrackStatus, TracksPaneProps, MatchBucket } from '@/types/admin-review';
import { Button } from '@/components/atoms';
import { 
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

// Track row skeleton for loading
const TrackRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 h-16 animate-pulse">
    <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="h-4 bg-white/10 rounded mb-1" />
      <div className="h-3 bg-white/10 rounded w-3/4" />
    </div>
    <div className="w-16 h-6 bg-white/10 rounded flex-shrink-0" />
  </div>
);

// Match confidence chip
interface MatchChipProps {
  bucket: MatchBucket;
  confidence: number;
  source?: string;
}

const MatchChip: React.FC<MatchChipProps> = ({ bucket, confidence, source }) => {
  const config = {
    top: { 
      bg: 'bg-green-500/20', 
      text: 'text-green-400', 
      border: 'border-green-500/30',
      label: 'Top Hit' 
    },
    fast: { 
      bg: 'bg-blue-500/20', 
      text: 'text-blue-400', 
      border: 'border-blue-500/30',
      label: 'Fast-Track' 
    },
    review: { 
      bg: 'bg-yellow-500/20', 
      text: 'text-yellow-400', 
      border: 'border-yellow-500/30',
      label: 'Review' 
    },
    hide: { 
      bg: 'bg-gray-500/20', 
      text: 'text-gray-400', 
      border: 'border-gray-500/30',
      label: 'Low' 
    }
  };

  const { bg, text, border, label } = config[bucket];

  return (
    <div className={cn("px-2 py-1 rounded text-xs border", bg, text, border)}>
      <div className="font-medium">{label}</div>
      <div className="text-xs opacity-80">
        {confidence}% {source && `• ${source}`}
      </div>
    </div>
  );
};

// Track action buttons
interface TrackActionsProps {
  track: TrackVM;
  isSelected: boolean;
  onAction: (action: TrackStatus) => void;
  onOpenSource: () => void;
}

const TrackActions: React.FC<TrackActionsProps> = ({ 
  track, 
  isSelected, 
  onAction, 
  onOpenSource 
}) => {
  if (!isSelected) return null;

  const statusConfig = {
    approved: { icon: CheckCircleIcon, color: 'text-green-400' },
    rejected: { icon: XCircleIcon, color: 'text-red-400' },
    needs_review: { icon: ExclamationTriangleIcon, color: 'text-yellow-400' },
    pending: { icon: ExclamationTriangleIcon, color: 'text-white/60' }
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      <Button
        size="sm"
        variant={track.status === 'approved' ? 'default' : 'outline'}
        onClick={() => onAction('approved')}
        className="text-xs h-6 px-2"
      >
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        A
      </Button>
      <Button
        size="sm"
        variant={track.status === 'rejected' ? 'default' : 'outline'}
        onClick={() => onAction('rejected')}
        className="text-xs h-6 px-2"
      >
        <XCircleIcon className="w-3 h-3 mr-1" />
        R
      </Button>
      <Button
        size="sm"
        variant={track.status === 'needs_review' ? 'default' : 'outline'}
        onClick={() => onAction('needs_review')}
        className="text-xs h-6 px-2"
      >
        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
        N
      </Button>
      {track.match.url && (
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenSource}
          className="text-xs h-6 px-2"
        >
          <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
          O
        </Button>
      )}
    </div>
  );
};

// Individual track row component
interface TrackRowProps {
  track: TrackVM;
  isSelected: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onPlay: () => void;
  onAction: (action: TrackStatus) => void;
}

const TrackRow: React.FC<TrackRowProps> = ({
  track,
  isSelected,
  isPlaying,
  onClick,
  onPlay,
  onAction
}) => {
  const statusIcons = {
    approved: CheckCircleIcon,
    rejected: XCircleIcon,
    needs_review: ExclamationTriangleIcon,
    pending: ExclamationTriangleIcon
  };

  const statusColors = {
    approved: 'text-green-400',
    rejected: 'text-red-400',
    needs_review: 'text-yellow-400',
    pending: 'text-white/40'
  };

  const StatusIcon = statusIcons[track.status];

  return (
    <div
      className={cn(
        "p-3 cursor-pointer transition-colors border-l-2",
        "hover:bg-white/5",
        isSelected 
          ? "bg-white/10 border-l-blue-400" 
          : "border-l-transparent"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Play Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
          disabled={!track.match.url}
        >
          {isPlaying ? (
            <PauseIcon className="w-4 h-4 text-white" />
          ) : (
            <PlayIcon className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm font-mono flex-shrink-0">
                  {track.position}
                </span>
                <div className="font-medium text-white text-sm leading-tight line-clamp-2 min-w-0">
                  {track.title}
                  {track.featuring && track.featuring.length > 0 && (
                    <span className="text-white/60 font-normal">
                      {' '}feat. {track.featuring.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              {track.duration && (
                <div className="text-white/40 text-xs mt-1">
                  {track.duration}
                </div>
              )}
            </div>

            {/* Match Chip and Status */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {track.match.confidence > 0 && (
                <MatchChip
                  bucket={track.match.bucket}
                  confidence={track.match.confidence}
                  source={track.match.source || undefined}
                />
              )}
              <StatusIcon className={cn("w-4 h-4", statusColors[track.status])} />
            </div>
          </div>

          {/* Actions (only when selected) */}
          <TrackActions
            track={track}
            isSelected={isSelected}
            onAction={onAction}
            onOpenSource={() => {
              if (track.match.url) {
                window.open(track.match.url, '_blank');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Collapsible section for low confidence tracks
interface CollapsibleSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  isExpanded,
  onToggle,
  children
}) => (
  <div className="border-t border-white/10">
    <button
      onClick={onToggle}
      className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-2">
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4 text-white/60" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-white/60" />
        )}
        <span className="text-white/60 text-sm">{title} ({count})</span>
      </div>
      <EyeSlashIcon className="w-4 h-4 text-white/40" />
    </button>
    {isExpanded && children}
  </div>
);

export const AdminTracksPane: React.FC<TracksPaneProps> = ({
  tracks,
  selectedTrackId,
  isLoading,
  onTrackAction,
  onTrackSelect,
  onPlayTrack
}) => {
  const [playingTrackId, setPlayingTrackId] = useState<string>();
  const [showLowConfidence, setShowLowConfidence] = useState(false);

  // Group tracks by priority
  const groupedTracks = tracks.reduce((groups, track) => {
    if (track.match.bucket === 'hide') {
      groups.lowConfidence.push(track);
    } else {
      groups.main.push(track);
    }
    return groups;
  }, { main: [] as TrackVM[], lowConfidence: [] as TrackVM[] });

  // Sort main tracks by bucket priority
  const bucketOrder = { top: 0, fast: 1, review: 2 };
  groupedTracks.main.sort((a, b) => {
    const orderA = bucketOrder[a.match.bucket as keyof typeof bucketOrder] ?? 3;
    const orderB = bucketOrder[b.match.bucket as keyof typeof bucketOrder] ?? 3;
    return orderA - orderB;
  });

  const handlePlay = (trackId: string) => {
    if (playingTrackId === trackId) {
      setPlayingTrackId(undefined);
    } else {
      setPlayingTrackId(trackId);
      onPlayTrack(trackId);
    }
  };

  const handleTrackAction = (trackId: string, action: TrackStatus) => {
    onTrackAction(trackId, action);
  };

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="p-4 border-b border-white/20">
          <h3 className="font-semibold text-white">Tracks</h3>
        </div>
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <TrackRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-white/20">
          <h3 className="font-semibold text-white">Tracks</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white/60">
            <div className="text-4xl mb-4">🎵</div>
            <div>No tracks available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex-shrink-0">
        <h3 className="font-semibold text-white">Tracks</h3>
        <div className="text-sm text-white/60 mt-1">
          {tracks.length} track{tracks.length !== 1 ? 's' : ''} • Use A/R/N to approve/reject/review
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {/* Main tracks (visible by default) */}
        {groupedTracks.main.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isSelected={selectedTrackId === track.id}
            isPlaying={playingTrackId === track.id}
            onClick={() => onTrackSelect(track.id)}
            onPlay={() => handlePlay(track.id)}
            onAction={(action) => handleTrackAction(track.id, action)}
          />
        ))}

        {/* Low confidence tracks (collapsible) */}
        {groupedTracks.lowConfidence.length > 0 && (
          <CollapsibleSection
            title="Low confidence"
            count={groupedTracks.lowConfidence.length}
            isExpanded={showLowConfidence}
            onToggle={() => setShowLowConfidence(!showLowConfidence)}
          >
            {groupedTracks.lowConfidence.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isSelected={selectedTrackId === track.id}
                isPlaying={playingTrackId === track.id}
                onClick={() => onTrackSelect(track.id)}
                onPlay={() => handlePlay(track.id)}
                onAction={(action) => handleTrackAction(track.id, action)}
              />
            ))}
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};