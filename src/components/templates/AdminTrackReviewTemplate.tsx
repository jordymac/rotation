'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  TrackQueueItem, 
  QueueFilters, 
  TrackStatus,
  TrackQueueResponse,
  KeyboardAction,
  AdminPerfProfile
} from '@/types/admin-review';
import { AdminTrackQueuePane } from '@/components/organisms/AdminTrackQueuePane';
import { AdminTrackInspector } from '@/components/organisms/AdminTrackInspector';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { getPerfProfile } from '@/utils/perfProfile';

interface AdminTrackReviewTemplateProps {
  className?: string;
  defaultFilters?: QueueFilters;
  storeFocused?: boolean;
  pageTitle?: string;
}

export const AdminTrackReviewTemplate: React.FC<AdminTrackReviewTemplateProps> = ({
  className,
  defaultFilters,
  storeFocused = false,
  pageTitle = "Track Review - Inbox"
}) => {
  // Performance profile for adaptive loading
  const basePerfProfile = getPerfProfile();
  const perfProfile: AdminPerfProfile = {
    maxConcurrent: basePerfProfile.maxConcurrent,
    windowSize: basePerfProfile.windowSize,
    prefetchCount: basePerfProfile.fast ? 12 : basePerfProfile.slow ? 5 : 8
  };
  
  // State management
  const [tracks, setTracks] = useState<TrackQueueItem[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [selectedTrack, setSelectedTrack] = useState<TrackQueueItem | null>(null);
  const [filters, setFilters] = useState<QueueFilters>(defaultFilters || { status: 'needs_review' });
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string>();
  const [lastAction, setLastAction] = useState<{ trackId: string; action: TrackStatus; previousStatus: TrackStatus } | null>(null);

  // Cursor navigation state
  const [cursorIndex, setCursorIndex] = useState(0);

  // Load track queue
  const loadTracks = useCallback(async (newFilters?: QueueFilters, resetCursor = true) => {
    try {
      setIsLoadingQueue(true);
      setApiError(null);
      
      const searchParams = new URLSearchParams();
      const currentFilters = newFilters || filters;
      
      if (currentFilters.status && currentFilters.status !== 'all') {
        searchParams.set('status', currentFilters.status);
      }
      if (currentFilters.search) {
        searchParams.set('search', currentFilters.search);
      }
      if (currentFilters.store) {
        searchParams.set('store', currentFilters.store);
      }
      if (!resetCursor && cursor) {
        searchParams.set('cursor', cursor);
      }
      searchParams.set('limit', '20');

      const response = await fetch(`/api/admin/review/tracks?${searchParams}`);
      const data: TrackQueueResponse = await response.json();

      if (resetCursor) {
        setTracks(data.items);
        setCursorIndex(0);
      } else {
        setTracks(prev => [...prev, ...data.items]);
      }
      
      setHasMore(data.pagination.hasMore);
      setCursor(data.pagination.cursor);
      
    } catch (error) {
      console.error('Failed to load tracks:', error);
      setApiError('Failed to load tracks');
    } finally {
      setIsLoadingQueue(false);
    }
  }, [filters, cursor]);

  // Load more tracks (pagination)
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingQueue) {
      loadTracks(filters, false);
    }
  }, [hasMore, isLoadingQueue, loadTracks, filters]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: QueueFilters) => {
    setFilters(newFilters);
    setCursor(undefined);
    loadTracks(newFilters, true);
  }, [loadTracks]);

  // Handle track selection
  const handleTrackSelect = useCallback((trackId: string) => {
    setSelectedTrackId(trackId);
    const track = tracks.find(t => t.trackId === trackId);
    setSelectedTrack(track || null);
    
    // Update cursor index for keyboard navigation
    const index = tracks.findIndex(t => t.trackId === trackId);
    if (index >= 0) {
      setCursorIndex(index);
    }
  }, [tracks]);

  // Handle track actions
  const handleTrackAction = useCallback(async (trackId: string, action: TrackStatus) => {
    const track = tracks.find(t => t.trackId === trackId);
    if (!track) return;

    // Store for undo
    setLastAction({
      trackId,
      action,
      previousStatus: track.status
    });

    // Optimistic update
    setTracks(prev => prev.map(t => 
      t.trackId === trackId ? { ...t, status: action } : t
    ));

    // Update selected track if it's the one being modified
    if (selectedTrack?.trackId === trackId) {
      setSelectedTrack(prev => prev ? { ...prev, status: action } : null);
    }

    try {
      // TODO: Implement API call to update track status
      const response = await fetch(`/api/admin/review/tracks/${trackId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error('Failed to update track');
      }

      // Auto-advance cursor on approve/reject
      if (action === 'approved' || action === 'rejected') {
        setCursorIndex(prev => Math.min(prev + 1, tracks.length - 1));
      }

    } catch (error) {
      console.error('Failed to update track:', error);
      // Revert optimistic update on error
      setTracks(prev => prev.map(t => 
        t.trackId === trackId ? { ...t, status: track.status } : t
      ));
    }
  }, [tracks, selectedTrack]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (!lastAction) return;

    const { trackId, previousStatus } = lastAction;
    
    // Revert the change
    setTracks(prev => prev.map(t => 
      t.trackId === trackId ? { ...t, status: previousStatus } : t
    ));

    if (selectedTrack?.trackId === trackId) {
      setSelectedTrack(prev => prev ? { ...prev, status: previousStatus } : null);
    }

    setLastAction(null);
  }, [lastAction, selectedTrack]);

  // Handle play track
  const handlePlayTrack = useCallback((trackId: string) => {
    // TODO: Implement audio playback
    console.log('Playing track:', trackId);
  }, []);

  // Handle open release
  const handleOpenRelease = useCallback(() => {
    if (selectedTrack) {
      window.open(`/admin/review/release/${selectedTrack.releaseId}`, '_blank');
    }
  }, [selectedTrack]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing in inputs
      if ((e.target as HTMLElement)?.tagName?.toLowerCase() === 'input') return;

      const currentTrack = tracks[cursorIndex];
      if (!currentTrack) return;

      switch (e.key.toLowerCase()) {
        case 'arrowdown':
        case 'j':
          e.preventDefault();
          const nextIndex = Math.min(cursorIndex + 1, tracks.length - 1);
          setCursorIndex(nextIndex);
          handleTrackSelect(tracks[nextIndex]?.trackId);
          break;
          
        case 'arrowup':
        case 'k':
          e.preventDefault();
          const prevIndex = Math.max(cursorIndex - 1, 0);
          setCursorIndex(prevIndex);
          handleTrackSelect(tracks[prevIndex]?.trackId);
          break;
          
        case 'a':
          e.preventDefault();
          handleTrackAction(currentTrack.trackId, 'approved');
          break;
          
        case 'x':
          e.preventDefault();
          handleTrackAction(currentTrack.trackId, 'rejected');
          break;
          
        case 'n':
          e.preventDefault();
          handleTrackAction(currentTrack.trackId, 'needs_review');
          break;
          
        case 'u':
          e.preventDefault();
          handleUndo();
          break;
          
        case 'o':
          e.preventDefault();
          if (currentTrack.match.url) {
            window.open(currentTrack.match.url, '_blank');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tracks, cursorIndex, handleTrackSelect, handleTrackAction, handleUndo]);

  // Initial load
  useEffect(() => {
    loadTracks();
  }, []);

  // Auto-select first track when tracks load
  useEffect(() => {
    if (tracks.length > 0 && !selectedTrackId) {
      handleTrackSelect(tracks[0].trackId);
    }
  }, [tracks, selectedTrackId, handleTrackSelect]);

  return (
    <div className={cn("h-screen bg-black text-neutral-100 flex", className)}>
      {/* Left: Filters Sidebar (hidden on smaller screens) */}
      <aside className="w-64 border-r border-neutral-800 p-3 space-y-4 hidden lg:block">
        {/* Back to Stores Button */}
        <div className="pb-3 border-b border-neutral-800">
          <a 
            href="/admin" 
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-white/5 transition-colors text-neutral-300 hover:text-white text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Stores
          </a>
        </div>

        {/* Store Info */}
        {storeFocused && filters.store && (
          <div className="pb-3 border-b border-neutral-800">
            <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Current Store</div>
            <div className="px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm font-medium text-white">{filters.store}</div>
              <div className="text-xs text-white/60">Track review mode</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-neutral-300">
          <FunnelIcon className="h-4 w-4" />
          Filters
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Confidence</div>
          <div className="space-y-2">
            <button 
              onClick={() => handleFiltersChange({ ...filters, status: 'auto_approved' })}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg border text-sm",
                filters.status === 'auto_approved' 
                  ? "border-emerald-700 bg-emerald-950/40" 
                  : "border-neutral-800 hover:border-neutral-700"
              )}
            >
              Auto-approved ≥ 92%
            </button>
            <button 
              onClick={() => handleFiltersChange({ ...filters, status: 'approved' })}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg border text-sm",
                filters.status === 'approved' 
                  ? "border-blue-700 bg-blue-950/40" 
                  : "border-neutral-800 hover:border-neutral-700"
              )}
            >
              Manually approved
            </button>
            <button 
              onClick={() => handleFiltersChange({ ...filters, status: 'needs_review' })}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg border text-sm",
                filters.status === 'needs_review' 
                  ? "border-amber-600 bg-amber-950/30" 
                  : "border-neutral-800 hover:border-neutral-700"
              )}
            >
              Needs review 70–91%
            </button>
            <button 
              onClick={() => handleFiltersChange({ ...filters, status: 'rejected' })}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg border text-sm",
                filters.status === 'rejected' 
                  ? "border-neutral-700 bg-neutral-950/50" 
                  : "border-neutral-800 hover:border-neutral-700"
              )}
            >
              Low confidence &lt; 50%
            </button>
          </div>
        </div>


        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Review rules</div>
          <ul className="text-xs space-y-1 text-neutral-400 list-disc list-inside">
            <li>Auto-approve when ≥ 92% & duration/title checks pass</li>
            <li>Spot-check 1 in 20 auto-approvals</li>
            <li>Raise bar if drift detected</li>
          </ul>
        </div>
      </aside>

      {/* Center: Track Queue */}
      <main className="flex-1 flex flex-col min-w-0">
        <AdminTrackQueuePane
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          filters={filters}
          isLoading={isLoadingQueue}
          hasMore={hasMore}
          onTrackSelect={handleTrackSelect}
          onFiltersChange={handleFiltersChange}
          onLoadMore={loadMore}
          onTrackAction={handleTrackAction}
          onPlayTrack={handlePlayTrack}
        />
      </main>

      {/* Right: Inspector */}
      <aside className="w-[380px] border-l border-neutral-800 hidden xl:flex flex-col">
        <AdminTrackInspector
          track={selectedTrack}
          isLoading={false}
          onTrackAction={(action) => selectedTrack && handleTrackAction(selectedTrack.trackId, action)}
          onOpenRelease={handleOpenRelease}
          onUndo={handleUndo}
          className="flex-1"
        />
      </aside>

      {/* Error Toast */}
      {apiError && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-700 rounded-lg p-4 text-white">
          <div className="font-medium">Error</div>
          <div className="text-sm text-red-200">{apiError}</div>
          <button 
            onClick={() => setApiError(null)}
            className="mt-2 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};