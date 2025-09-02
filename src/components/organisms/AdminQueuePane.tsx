'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  ReleaseQueueItem, 
  QueueFilters, 
  BulkAction,
  QueuePaneProps 
} from '@/types/admin-review';
import { Button, Input } from '@/components/atoms';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Queue item skeleton for loading states
const QueueItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 animate-pulse">
    <div className="w-12 h-12 bg-white/10 rounded flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="h-4 bg-white/10 rounded mb-2" />
      <div className="h-3 bg-white/10 rounded w-3/4" />
    </div>
    <div className="w-6 h-6 bg-white/10 rounded-full flex-shrink-0" />
  </div>
);

// Individual queue item component
interface QueueItemProps {
  release: ReleaseQueueItem;
  isSelected: boolean;
  onClick: () => void;
}

const QueueItem: React.FC<QueueItemProps> = ({ release, isSelected, onClick }) => {
  const freshnessColors = {
    new: 'bg-blue-500',
    recent: 'bg-yellow-500', 
    old: 'bg-gray-500'
  };

  const statusColors = {
    needs_review: 'text-yellow-400',
    auto_approved: 'text-green-400',
    rejected: 'text-red-400',
    completed: 'text-green-400'
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors border-l-2",
        "hover:bg-white/5",
        isSelected 
          ? "bg-white/10 border-l-blue-400" 
          : "border-l-transparent"
      )}
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="w-12 h-12 flex-shrink-0 bg-white/10 rounded overflow-hidden">
        {release.coverUrl ? (
          <img 
            src={release.coverUrl} 
            alt={release.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
            🎵
          </div>
        )}
      </div>

      {/* Release Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate text-sm">
          {release.title}
        </div>
        <div className="text-white/60 truncate text-xs">
          {release.artist} • {release.store}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {/* Freshness chip */}
          <span className={cn(
            "px-1.5 py-0.5 rounded text-xs text-white font-medium",
            freshnessColors[release.freshness]
          )}>
            {release.freshness}
          </span>
          
          {/* Status */}
          <span className={cn("text-xs", statusColors[release.status])}>
            {release.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Needs Review Count */}
      {release.needsReviewCount > 0 && (
        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
          {release.needsReviewCount}
        </div>
      )}
    </div>
  );
};

export const AdminQueuePane: React.FC<QueuePaneProps> = ({
  releases,
  selectedReleaseId,
  filters,
  isLoading,
  hasMore,
  onReleaseSelect,
  onFiltersChange,
  onLoadMore,
  onBulkAction
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  // Filter statistics
  const stats = useMemo(() => {
    return releases.reduce((acc, release) => {
      acc.total++;
      acc[release.status]++;
      acc.needsReview += release.needsReviewCount;
      return acc;
    }, {
      total: 0,
      needs_review: 0,
      auto_approved: 0,
      rejected: 0,
      completed: 0,
      needsReview: 0
    });
  }, [releases]);

  // Handle search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue || undefined });
  };

  // Handle filter changes
  const handleStatusFilter = (status: QueueFilters['status']) => {
    onFiltersChange({ ...filters, status });
  };

  // Handle bulk actions
  const handleBulkAction = (type: BulkAction['type']) => {
    onBulkAction({
      type,
      currentPageOnly: true
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Review Queue</h2>
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
        <form onSubmit={handleSearchSubmit} className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="text"
            placeholder="Search releases..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/40"
          />
        </form>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'needs_review', label: 'Needs Review', count: stats.needs_review },
            { key: 'auto_approved', label: 'Auto-approved', count: stats.auto_approved },
            { key: 'rejected', label: 'Rejected', count: stats.rejected }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleStatusFilter(key as QueueFilters['status'])}
              className={cn(
                "px-2 py-1 rounded text-xs transition-colors",
                filters.status === key
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              )}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="text-xs text-white/60 mb-2">Bulk Actions</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('approve_all_top_hits')}
                className="text-xs"
              >
                Approve Top Hits
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('approve_all_fast_track')}
                className="text-xs"
              >
                Approve Fast-Track
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && releases.length === 0 ? (
          // Loading skeletons
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <QueueItemSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div>
            {releases.map((release) => (
              <QueueItem
                key={release.id}
                release={release}
                isSelected={selectedReleaseId === release.id}
                onClick={() => onReleaseSelect(release.id)}
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
            
            {releases.length === 0 && !isLoading && (
              <div className="p-8 text-center text-white/60">
                <div className="text-4xl mb-4">📭</div>
                <div>No releases found</div>
                <div className="text-sm mt-1">Try adjusting your filters</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-white/20 text-xs text-white/60 flex-shrink-0">
        {stats.needsReview > 0 && (
          <div className="text-yellow-400">
            {stats.needsReview} tracks need review
          </div>
        )}
        <div className="mt-1">
          Showing {releases.length} of {stats.total} releases
        </div>
      </div>
    </div>
  );
};