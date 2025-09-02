'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ReleaseDetail, RecordPaneProps } from '@/types/admin-review';
import { Button } from '@/components/atoms';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';

// Record header skeleton for loading
const RecordHeaderSkeleton: React.FC = () => (
  <div className="p-6 animate-pulse">
    <div className="flex gap-4">
      <div className="w-24 h-24 bg-white/10 rounded flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-6 bg-white/10 rounded mb-2" />
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </div>
    </div>
    <div className="flex gap-4 mt-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 bg-white/10 rounded flex-1" />
      ))}
    </div>
  </div>
);

// Match summary card component
interface MatchSummaryCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const MatchSummaryCard: React.FC<MatchSummaryCardProps> = ({
  title,
  count,
  icon: Icon,
  color,
  description
}) => (
  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={cn("w-5 h-5", color)} />
      <span className="font-medium text-white">{title}</span>
    </div>
    <div className="text-2xl font-bold text-white mb-1">{count}</div>
    <div className="text-xs text-white/60">{description}</div>
  </div>
);

// Featuring credits component
interface FeaturingCreditsProps {
  featuring?: string[];
}

const FeaturingCredits: React.FC<FeaturingCreditsProps> = ({ featuring }) => {
  if (!featuring || featuring.length === 0) return null;

  return (
    <span className="text-white/60">
      {' '}feat. {featuring.join(', ')}
    </span>
  );
};

export const AdminRecordPane: React.FC<RecordPaneProps> = ({
  release,
  isLoading,
  onApproveRelease,
  onRejectRelease
}) => {
  if (isLoading || !release) {
    return (
      <div className="h-full">
        <RecordHeaderSkeleton />
        <div className="p-6">
          <div className="text-center text-white/60 mt-12">
            {isLoading ? 'Loading release details...' : 'Select a release to review'}
          </div>
        </div>
      </div>
    );
  }

  const canApprove = release.canApprove;
  const hasNeedsReview = release.matchSummary.needsReview > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/20 flex-shrink-0">
        <div className="flex gap-4">
          {/* Cover Image */}
          <div className="w-24 h-24 flex-shrink-0 bg-white/10 rounded overflow-hidden">
            {release.coverUrl ? (
              <img 
                src={release.coverUrl} 
                alt={release.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40">
                🎵
              </div>
            )}
          </div>

          {/* Release Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white mb-1 leading-tight">
              {release.title}
            </h1>
            <div className="text-lg text-white/80 mb-2">
              {release.artist}
              <FeaturingCredits featuring={[]} />
            </div>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>{release.store}</span>
              {release.year && <span>{release.year}</span>}
              {release.label && <span>{release.label}</span>}
              <span className="text-white/40">#{release.discogsId}</span>
            </div>
          </div>
        </div>

        {/* Match Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <MatchSummaryCard
            title="Top Hit"
            count={release.matchSummary.topHit}
            icon={CheckCircleIcon}
            color="text-green-400"
            description="Auto-approved ≥92%"
          />
          <MatchSummaryCard
            title="Fast-Track"
            count={release.matchSummary.fastTrack}
            icon={CheckCircleIcon}
            color="text-blue-400"
            description="Pre-selected 85-92%"
          />
          <MatchSummaryCard
            title="Needs Review"
            count={release.matchSummary.needsReview}
            icon={ExclamationTriangleIcon}
            color="text-yellow-400"
            description="Manual review 65-85%"
          />
          <MatchSummaryCard
            title="Don't Bother"
            count={release.matchSummary.dontBother}
            icon={EyeSlashIcon}
            color="text-gray-400"
            description="Hidden <65%"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6">
        {/* Status and Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60 mb-1">Release Status</div>
              <div className={cn(
                "text-lg font-medium",
                release.status === 'completed' ? "text-green-400" :
                release.status === 'rejected' ? "text-red-400" :
                "text-yellow-400"
              )}>
                {release.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onRejectRelease}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <XCircleIcon className="w-4 h-4 mr-2" />
                Reject Release
              </Button>
              
              <Button
                onClick={onApproveRelease}
                disabled={!canApprove}
                variant={canApprove ? "default" : "outline"}
                className={cn(
                  canApprove 
                    ? "bg-green-500 hover:bg-green-600 text-white" 
                    : "border-gray-500/50 text-gray-400"
                )}
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                {canApprove ? 'Approve Release' : 'Review Required'}
              </Button>
            </div>
          </div>

          {/* Help text */}
          {hasNeedsReview && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <div className="flex items-center gap-2 text-yellow-400">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {release.matchSummary.needsReview} tracks need manual review
                </span>
              </div>
              <div className="text-xs text-yellow-400/80 mt-1">
                Review tracks in the right panel, then approve the release.
              </div>
            </div>
          )}

          {canApprove && !hasNeedsReview && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Ready to approve
                </span>
              </div>
              <div className="text-xs text-green-400/80 mt-1">
                All tracks have been approved or auto-approved. Press Enter to approve this release.
              </div>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>Approval Progress</span>
            <span>
              {release.matchSummary.topHit + release.matchSummary.fastTrack} / {release.tracks.length} approved
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((release.matchSummary.topHit + release.matchSummary.fastTrack) / release.tracks.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-sm font-medium text-white mb-3">Keyboard Shortcuts</div>
          <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
            <div><kbd className="bg-white/10 px-1 rounded">J/K</kbd> Next/Prev release</div>
            <div><kbd className="bg-white/10 px-1 rounded">A</kbd> Approve track</div>
            <div><kbd className="bg-white/10 px-1 rounded">R</kbd> Reject track</div>
            <div><kbd className="bg-white/10 px-1 rounded">N</kbd> Needs review</div>
            <div><kbd className="bg-white/10 px-1 rounded">O</kbd> Open source</div>
            <div><kbd className="bg-white/10 px-1 rounded">Enter</kbd> Approve release</div>
          </div>
        </div>
      </div>
    </div>
  );
};