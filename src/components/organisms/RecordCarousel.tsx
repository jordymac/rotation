'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DiscogsRelease } from '@/utils/discogs';
import { RecordCard, FeedCardSkeleton, SearchFilters } from '@/components/molecules';
import { Button, H2 } from '@/components/atoms';
import { 
  Bars3Icon, 
  EyeIcon, 
  ShoppingCartIcon, 
  XMarkIcon,
  ArrowLeftIcon 
} from '@/components/atoms';

interface RecordCarouselProps {
  releases: DiscogsRelease[];
  totalReleases?: number; // Total count for display (not windowed count)
  currentReleaseIndex: number;
  currentTrackIndex: number;
  onReleaseChange: (index: number) => void;
  onTrackChange: (index: number) => void;
  isScrolling: boolean;
  onScroll: (direction: 'up' | 'down') => void;
  onTrackScroll: (direction: 'left' | 'right') => void;
  slideDirection: 'up' | 'down' | 'left' | 'right' | null;
  currentBgImage: string;
  nextBgImage: string;
  bgTransitioning: boolean;
  youtubeVideoId: string | null;
  audioLoading: boolean;
  cartCount: number;
  onAddToCart: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: {
    searchQuery: string;
    minPrice: string;
    maxPrice: string;
    format: string;
    condition: string;
    genre: string;
    year: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  storeInfo?: {
    id: string;
    username: string;
  };
  className?: string;
  isLoadingLight?: boolean;
  hasFullData?: (releaseId: number) => boolean;
}

export const RecordCarousel: React.FC<RecordCarouselProps> = ({
  releases,
  totalReleases,
  currentReleaseIndex,
  currentTrackIndex,
  onReleaseChange,
  onTrackChange,
  isScrolling,
  onScroll,
  onTrackScroll,
  slideDirection,
  currentBgImage,
  nextBgImage,
  bgTransitioning,
  youtubeVideoId,
  audioLoading,
  cartCount,
  onAddToCart,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  onClearFilters,
  storeInfo,
  className,
  isLoadingLight = false,
  hasFullData = () => true
}) => {
  const currentRelease = releases[currentReleaseIndex];

  // Prevent page scrolling on mobile
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    const preventWheelScroll = (e: WheelEvent) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventWheelScroll, { passive: false });
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventWheelScroll);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onScroll('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          onScroll('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onTrackScroll('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          onTrackScroll('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScroll, onTrackScroll]);

  // Handle wheel and touch events
  useEffect(() => {
    let lastWheelTime = 0;
    let touchStartY = 0;
    let lastTouchTime = 0;
    
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#mobile-feed-container')) {
        return;
      }
      
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastWheelTime < 300) return; // Increased debounce
      if (isScrolling) return;
      
      lastWheelTime = now;
      
      if (e.deltaY > 30) { // Increased threshold
        console.log('🖱️ Wheel scroll down');
        onScroll('down');
      } else if (e.deltaY < -30) {
        console.log('🖱️ Wheel scroll up');
        onScroll('up');
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#mobile-feed-container')) return;
      
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#mobile-feed-container')) return;
      
      const now = Date.now();
      if (now - lastTouchTime < 300) return; // Debounce touches
      if (isScrolling) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      
      if (Math.abs(deltaY) > 50) { // Minimum swipe distance
        lastTouchTime = now;
        
        if (deltaY > 0) {
          console.log('👆 Touch swipe down');
          onScroll('down');
        } else {
          console.log('👆 Touch swipe up');
          onScroll('up');
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isScrolling, onScroll]);

  if (!currentRelease) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p>No releases found</p>
      </div>
    );
  }

  return (
    <div className={cn('md:hidden h-screen bg-black overflow-hidden relative', className)}>
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: currentBgImage,
            filter: 'blur(25px) brightness(0.2)',
            transform: 'scale(1.1)',
            opacity: bgTransitioning ? 0 : 1
          }}
        />
        {nextBgImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
            style={{
              backgroundImage: nextBgImage,
              filter: 'blur(25px) brightness(0.2)',
              transform: 'scale(1.1)',
              opacity: bgTransitioning ? 1 : 0,
              zIndex: bgTransitioning ? 1 : 0
            }}
          />
        )}
      </div>

      {/* Main Content Container */}
      <div id="mobile-feed-container" className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFilters}
            className="text-white hover:bg-white/20"
          >
            <Bars3Icon className="w-6 h-6" />
          </Button>
          
          <div className="text-center text-white">
            <div className="text-sm opacity-80">
              {currentReleaseIndex + 1} / {totalReleases || releases.length}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              {cartCount}
            </div>
            <ShoppingCartIcon className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Record Display */}
        <div className={cn(
          'flex-1 overflow-y-auto min-h-0 hide-scrollbar flex flex-col items-center justify-center relative px-4 transition-all duration-500',
          slideDirection === 'up' ? 'animate-slide-up' : 
          slideDirection === 'down' ? 'animate-slide-down' : ''
        )}>
          {isLoadingLight && releases.length === 0 ? (
            <FeedCardSkeleton viewMode="grid" />
          ) : currentRelease ? (
            !hasFullData(currentRelease.id) && currentRelease.tracks?.length === 0 ? (
              <FeedCardSkeleton viewMode="grid" />
            ) : (
              <RecordCard 
                release={currentRelease}
                currentTrack={currentRelease.tracks?.[currentTrackIndex]}
                showTrackInfo={true}
                tracks={currentRelease.tracks || []}
                currentTrackIndex={currentTrackIndex}
                onTrackChange={onTrackChange}
                isScrolling={isScrolling}
                youtubeVideoId={youtubeVideoId}
                audioLoading={audioLoading}
                currentIndex={currentReleaseIndex + 1}
                totalCount={totalReleases || releases.length}
                onPreviousRecord={() => {
                  onScroll('up');
                  // When moving to previous record, go to its last track
                  const prevIndex = currentReleaseIndex - 1;
                  if (prevIndex >= 0 && releases[prevIndex]?.tracks) {
                    const lastTrackIndex = releases[prevIndex].tracks.length - 1;
                    setTimeout(() => onTrackChange(lastTrackIndex), 100);
                  }
                }}
                onNextRecord={() => {
                  onScroll('down');
                  // When moving to next record, go to first track
                  setTimeout(() => onTrackChange(0), 100);
                }}
              />
            )
          ) : (
            <FeedCardSkeleton viewMode="grid" />
          )}
        </div>

        {/* Bottom Actions - Removed to avoid duplication with RecordCard CTAs */}
      </div>

      {/* Filter Panel Overlay */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/95 backdrop-blur-md transform transition-transform duration-300 ease-in-out z-50',
          showFilters ? 'translate-x-0' : '-translate-x-full'
        )}
        onClick={onToggleFilters}
      >
        <div className="p-6 h-full overflow-y-auto max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <H2 className="text-white border-0 pb-0">Filters</H2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFilters}
              className="text-white hover:bg-white/20"
            >
              <XMarkIcon className="w-6 h-6" />
            </Button>
          </div>

          {/* Go Back to Stores */}
          <div className="pb-4 border-b border-white/20 mb-4">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/stores'}
              className="w-full justify-start gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>All Stores</span>
            </Button>
          </div>

          <SearchFilters
            searchQuery={filters.searchQuery}
            onSearchChange={(query) => onFiltersChange({...filters, searchQuery: query})}
            filters={filters}
            onFilterChange={onFiltersChange}
            onClearFilters={onClearFilters}
          />

          {/* Results Count */}
          <div className="text-center text-white/60 text-sm mt-4">
            Showing {totalReleases || releases.length} releases
          </div>
        </div>
      </div>
    </div>
  );
};