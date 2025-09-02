'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrackQueueItem, TrackStatus } from '@/types/admin-review';
import { Button } from '@/components/atoms';
import { YouTubePreview } from '@/components/molecules/YouTubePreview';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  SpeakerWaveIcon,
  ArrowUturnLeftIcon,
  ListBulletIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface AdminTrackInspectorProps {
  track: TrackQueueItem | null;
  isLoading?: boolean;
  onTrackAction?: (action: TrackStatus) => void;
  onOpenRelease?: () => void;
  onUndo?: () => void;
  className?: string;
}

// Confidence pill for track details
interface ConfidencePillProps {
  confidence: number;
  bucket: 'top' | 'fast' | 'review' | 'hide';
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

export const AdminTrackInspector: React.FC<AdminTrackInspectorProps> = ({
  track,
  isLoading = false,
  onTrackAction,
  onOpenRelease,
  onUndo,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn("p-3 space-y-3", className)}>
        <div className="text-sm text-neutral-300 flex items-center gap-2">
          <SpeakerWaveIcon className="h-4 w-4" />
          Inspector
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950">
            <div className="h-4 bg-white/10 rounded mb-2" />
            <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
          <div className="h-32 bg-white/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className={cn("p-3 flex flex-col", className)}>
        <div className="text-sm text-neutral-300 flex items-center gap-2 mb-4">
          <SpeakerWaveIcon className="h-4 w-4" />
          Inspector
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-neutral-500 text-sm text-center">
            <div className="text-4xl mb-4">🎵</div>
            <div>Select a track to inspect…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-3 flex flex-col gap-3", className)}>
      <div className="text-sm text-neutral-300 flex items-center gap-2">
        <SpeakerWaveIcon className="h-4 w-4" />
        Inspector
      </div>

      {/* Track Details Card */}
      <div className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950">
        <div className="flex items-start gap-3 mb-3">
          <img 
            src={track.coverUrl} 
            alt={track.releaseTitle}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-neutral-100 truncate">
              {track.title}
            </div>
            <div className="text-sm text-neutral-400 truncate">
              {track.artist} — <span className="italic">{track.releaseTitle}</span>
            </div>
            {track.featuring?.length ? (
              <div className="mt-1 text-xs text-neutral-400">
                feat. {track.featuring.join(', ')}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <ConfidencePill confidence={track.match.confidence} bucket={track.match.bucket} />
          <span className="text-xs text-neutral-500">
            {track.duration} • {track.store}
          </span>
        </div>
      </div>

      {/* YouTube Preview */}
      <YouTubePreview 
        url={track.match.url}
        title={`${track.title} - ${track.artist}`}
      />

      {/* Action Buttons */}
      <div className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950">
        <div className="text-xs mb-2 text-neutral-400">Actions</div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onTrackAction?.('approved')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 justify-center"
            size="sm"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Approve
          </Button>
          <Button
            onClick={() => onTrackAction?.('rejected')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 justify-center"
            size="sm"
          >
            <XCircleIcon className="h-4 w-4" />
            Reject
          </Button>
        </div>
        
        <Button
          onClick={() => onTrackAction?.('needs_review')}
          variant="outline"
          className="w-full mt-2 border-amber-600 text-amber-400 hover:bg-amber-600/10 flex items-center gap-2 justify-center"
          size="sm"
        >
          <ExclamationTriangleIcon className="h-4 w-4" />
          Needs Review
        </Button>
      </div>

      {/* Release Actions */}
      <div className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-neutral-400">Release actions</div>
          <button 
            onClick={onOpenRelease}
            className="text-xs px-2 py-1 rounded-md border border-neutral-800 hover:border-neutral-700"
          >
            Open
          </button>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline" 
            className="w-full flex items-center gap-2 justify-center" 
            size="sm"
            title="Approve all tracks in this release meeting rules"
          >
            <ListBulletIcon className="h-4 w-4" />
            Approve all in release
          </Button>
          <Button
            variant="outline" 
            className="w-full flex items-center gap-2 justify-center" 
            size="sm"
            title="Reject all pending tracks in this release"
          >
            <TrashIcon className="h-4 w-4" />
            Reject all pending
          </Button>
        </div>
      </div>

      {/* Undo / History */}
      <div className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950 flex items-center justify-between">
        <div className="text-xs text-neutral-400">History</div>
        <Button
          onClick={onUndo}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
          Undo
        </Button>
      </div>

    </div>
  );
};