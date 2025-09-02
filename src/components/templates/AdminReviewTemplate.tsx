'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  ReleaseQueueItem, 
  ReleaseDetail, 
  QueueFilters, 
  TrackVM,
  TrackStatus,
  KeyboardAction,
  AdminPerfProfile
} from '@/types/admin-review';
import { AdminQueuePane } from '@/components/organisms/AdminQueuePane';
import { AdminRecordPane } from '@/components/organisms/AdminRecordPane';
import { AdminTracksPane } from '@/components/organisms/AdminTracksPane';
import { getPerfProfile } from '@/utils/perfProfile';

interface AdminReviewTemplateProps {
  className?: string;
  defaultFilters?: QueueFilters;
  storeFocused?: boolean;
  pageTitle?: string;
}

export const AdminReviewTemplate: React.FC<AdminReviewTemplateProps> = ({
  className,
  defaultFilters,
  storeFocused = false,
  pageTitle
}) => {
  // Performance profile for adaptive loading
  const basePerfProfile = getPerfProfile();
  const perfProfile: AdminPerfProfile = {
    maxConcurrent: basePerfProfile.maxConcurrent,
    windowSize: basePerfProfile.windowSize,
    prefetchCount: basePerfProfile.fast ? 8 : basePerfProfile.slow ? 3 : 5
  };
  
  // State management
  const [releases, setReleases] = useState<ReleaseQueueItem[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>();
  const [selectedRelease, setSelectedRelease] = useState<ReleaseDetail | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [filters, setFilters] = useState<QueueFilters>(defaultFilters || { status: 'needs_review' });
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [isLoadingRelease, setIsLoadingRelease] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load queue data
  const loadQueue = useCallback(async (reset = false) => {
    setIsLoadingQueue(true);
    setApiError(null);
    try {
      const cursor = reset ? undefined : releases[releases.length - 1]?.id;
      const params = new URLSearchParams({
        limit: perfProfile.windowSize?.toString() || '20',
        ...(cursor && { cursor }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.store && { store: filters.store })
      });

      const response = await fetch(`/api/admin/review/queue?${params}`);
      
      if (!response.ok) {
        // Handle non-2xx responses
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use the status text or generic message
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }

      // Ensure data has expected structure
      const items = data?.items || [];
      const pagination = data?.pagination || { hasMore: false };

      if (reset) {
        setReleases(items);
        // Auto-select first item if none selected
        if (items.length > 0 && !selectedReleaseId) {
          setSelectedReleaseId(items[0].id);
        }
      } else {
        setReleases(prev => [...prev, ...items]);
      }
      
      setHasMore(pagination.hasMore);
    } catch (error) {
      console.error('Failed to load queue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load releases';
      setApiError(errorMessage);
      // Set empty state on error to prevent crashes
      if (reset) {
        setReleases([]);
      }
      setHasMore(false);
    } finally {
      setIsLoadingQueue(false);
    }
  }, [filters, releases, selectedReleaseId, perfProfile.windowSize]);

  // Load release detail
  const loadRelease = useCallback(async (releaseId: string) => {
    setIsLoadingRelease(true);
    try {
      const response = await fetch(`/api/admin/review/release/${releaseId}`);
      const release = await response.json();
      setSelectedRelease(release);
      
      // Auto-select first track that needs attention
      if (release.tracks && release.tracks.length > 0) {
        const needsAttention = release.tracks.find((track: TrackVM) => 
          track.match.bucket === 'review' || track.status === 'needs_review'
        );
        if (needsAttention) {
          setSelectedTrackId(needsAttention.id);
        } else {
          setSelectedTrackId(release.tracks[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load release:', error);
      setSelectedRelease(null);
    } finally {
      setIsLoadingRelease(false);
    }
  }, []);

  // Handle release selection
  const handleReleaseSelect = useCallback((releaseId: string) => {
    setSelectedReleaseId(releaseId);
    loadRelease(releaseId);
  }, [loadRelease]);

  // Handle track actions with optimistic updates
  const handleTrackAction = useCallback(async (trackId: string, action: TrackStatus) => {
    if (!selectedRelease) return;

    // Optimistic update
    const updatedTracks = selectedRelease.tracks.map(track =>
      track.id === trackId ? { ...track, status: action } : track
    );
    setSelectedRelease({
      ...selectedRelease,
      tracks: updatedTracks,
      matchSummary: calculateMatchSummary(updatedTracks)
    });

    try {
      const response = await fetch(`/api/admin/review/track/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });

      if (!response.ok) {
        throw new Error('Failed to update track');
      }

      const result = await response.json();
      console.log('Track updated:', result);
    } catch (error) {
      console.error('Failed to update track:', error);
      // Revert optimistic update on error
      loadRelease(selectedReleaseId!);
    }
  }, [selectedRelease, selectedReleaseId, loadRelease]);

  // Handle release approval
  const handleApproveRelease = useCallback(async () => {
    if (!selectedReleaseId) return;

    try {
      const response = await fetch(`/api/admin/review/release/${selectedReleaseId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        // Move to next release
        const currentIndex = releases.findIndex(r => r.id === selectedReleaseId);
        const nextRelease = releases[currentIndex + 1];
        if (nextRelease) {
          handleReleaseSelect(nextRelease.id);
        }
        
        // Refresh queue to update status
        loadQueue(true);
      }
    } catch (error) {
      console.error('Failed to approve release:', error);
    }
  }, [selectedReleaseId, releases, handleReleaseSelect, loadQueue]);

  // Handle release rejection
  const handleRejectRelease = useCallback(async () => {
    if (!selectedReleaseId) return;

    try {
      const response = await fetch(`/api/admin/review/release/${selectedReleaseId}/reject`, {
        method: 'POST'
      });

      if (response.ok) {
        // Move to next release
        const currentIndex = releases.findIndex(r => r.id === selectedReleaseId);
        const nextRelease = releases[currentIndex + 1];
        if (nextRelease) {
          handleReleaseSelect(nextRelease.id);
        }
        
        // Refresh queue
        loadQueue(true);
      }
    } catch (error) {
      console.error('Failed to reject release:', error);
    }
  }, [selectedReleaseId, releases, handleReleaseSelect, loadQueue]);

  // Keyboard shortcuts
  const handleKeyboardAction = useCallback((action: KeyboardAction) => {
    const currentIndex = releases.findIndex(r => r.id === selectedReleaseId);
    
    switch (action) {
      case 'next_release':
        if (currentIndex < releases.length - 1) {
          handleReleaseSelect(releases[currentIndex + 1].id);
        } else if (hasMore) {
          loadQueue(); // Load more if at end
        }
        break;
        
      case 'prev_release':
        if (currentIndex > 0) {
          handleReleaseSelect(releases[currentIndex - 1].id);
        }
        break;
        
      case 'approve_track':
        if (selectedTrackId) {
          handleTrackAction(selectedTrackId, 'approved');
        }
        break;
        
      case 'reject_track':
        if (selectedTrackId) {
          handleTrackAction(selectedTrackId, 'rejected');
        }
        break;
        
      case 'needs_review_track':
        if (selectedTrackId) {
          handleTrackAction(selectedTrackId, 'needs_review');
        }
        break;
        
      case 'approve_release':
        if (selectedRelease?.canApprove) {
          handleApproveRelease();
        }
        break;
        
      case 'open_source':
        if (selectedTrackId && selectedRelease) {
          const track = selectedRelease.tracks.find(t => t.id === selectedTrackId);
          if (track?.match.url) {
            window.open(track.match.url, '_blank');
          }
        }
        break;
    }
  }, [releases, selectedReleaseId, selectedTrackId, selectedRelease, hasMore, 
      handleReleaseSelect, handleTrackAction, handleApproveRelease, loadQueue]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const keyMap: Record<string, KeyboardAction> = {
        'j': 'next_release',
        'k': 'prev_release',
        'a': 'approve_track',
        'r': 'reject_track',
        'n': 'needs_review_track',
        'o': 'open_source',
        ' ': 'play_pause',
        'Enter': 'approve_release'
      };

      const action = keyMap[event.key];
      if (action) {
        event.preventDefault();
        handleKeyboardAction(action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyboardAction]);

  // Load initial data
  useEffect(() => {
    loadQueue(true);
  }, [filters]); // Reload when filters change

  // Load release when selection changes
  useEffect(() => {
    if (selectedReleaseId) {
      loadRelease(selectedReleaseId);
    }
  }, [selectedReleaseId, loadRelease]);

  // Helper to calculate match summary
  const calculateMatchSummary = (tracks: TrackVM[]) => {
    return tracks.reduce(
      (summary, track) => {
        const bucket = track.match.bucket;
        if (bucket === 'top') summary.topHit++;
        else if (bucket === 'fast') summary.fastTrack++;
        else if (bucket === 'review') summary.needsReview++;
        else summary.dontBother++;
        return summary;
      },
      { topHit: 0, fastTrack: 0, needsReview: 0, dontBother: 0 }
    );
  };

  return (
    <div className={cn("flex flex-col h-screen bg-black text-white", className)}>
      {/* Store Header (when store-focused) */}
      {storeFocused && (
        <div className="border-b border-white/20 bg-white/5 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {pageTitle || `Store Review`}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Audio match review for {filters.store || 'this store'}
              </p>
            </div>
            <div className="text-white/40 text-sm">
              Inbox Interface • Use J/K/A/R/N for navigation
            </div>
          </div>
        </div>
      )}

      {/* API Error State */}
      {apiError && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-red-400">API Connection Error</h2>
              <p className="text-red-300/80 text-sm mt-1">
                Cannot connect to admin review API: {apiError}
              </p>
              <p className="text-red-300/60 text-xs mt-2">
                The admin review API endpoints may need to be deployed. Try refreshing the page or contact support.
              </p>
            </div>
            <button
              onClick={() => {
                setApiError(null);
                loadQueue(true);
              }}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded border border-red-500/30 text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main 3-Pane Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Queue Pane - Left (320px) */}
        <div className="w-80 border-r border-white/20 flex-shrink-0">
        <AdminQueuePane
          releases={releases}
          selectedReleaseId={selectedReleaseId}
          filters={filters}
          isLoading={isLoadingQueue}
          hasMore={hasMore}
          onReleaseSelect={handleReleaseSelect}
          onFiltersChange={setFilters}
          onLoadMore={() => loadQueue(false)}
          onBulkAction={async (action) => {
            // TODO: Implement bulk actions
            console.log('Bulk action:', action);
          }}
        />
      </div>

      {/* Record Pane - Center (fluid) */}
      <div className="flex-1 border-r border-white/20">
        <AdminRecordPane
          release={selectedRelease}
          isLoading={isLoadingRelease}
          onApproveRelease={handleApproveRelease}
          onRejectRelease={handleRejectRelease}
        />
      </div>

      {/* Tracks Pane - Right (460px) */}
      <div className="w-[460px] flex-shrink-0">
        <AdminTracksPane
          tracks={selectedRelease?.tracks || []}
          selectedTrackId={selectedTrackId}
          isLoading={isLoadingRelease}
          onTrackAction={handleTrackAction}
          onTrackSelect={setSelectedTrackId}
          onPlayTrack={(trackId) => {
            // TODO: Implement audio preview
            console.log('Play track:', trackId);
          }}
        />
        </div>
      </div>
    </div>
  );
};