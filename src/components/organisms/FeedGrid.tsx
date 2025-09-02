'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DiscogsRelease } from '@/utils/discogs';
import { RecordCard, FeedCardSkeleton } from '@/components/molecules';
import { useAudioMatch } from '@/hooks/useAudioMatch';
import { FeedFilterBar } from './FeedFilterBar';
import { RecordCarousel } from './RecordCarousel';
import { Button } from '@/components/atoms';
import { ChevronUpIcon, ChevronDownIcon, EyeIcon, ShoppingCartIcon } from '@/components/atoms';

interface FeedGridProps {
  releases: DiscogsRelease[];
  totalReleases?: number; // Total count for display (not windowed count)
  storeInfo?: {
    id: string;
    username: string;
  };
  layout?: 'mobile' | 'desktop';
  className?: string;
  isLoadingLight?: boolean;
  hasFullData?: (releaseId: number) => boolean;
}

interface FeedFilters {
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  format: string;
  condition: string;
  genre: string;
  year: string;
}

export const FeedGrid: React.FC<FeedGridProps> = ({
  releases,
  totalReleases,
  storeInfo,
  layout = 'desktop',
  className = '',
  isLoadingLight = false,
  hasFullData = () => true
}) => {
  // Navigation state
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [filters, setFilters] = useState<FeedFilters>({
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    format: '',
    condition: '',
    genre: '',
    year: ''
  });

  // Background transition state
  const [currentBgImage, setCurrentBgImage] = useState<string>('');
  const [nextBgImage, setNextBgImage] = useState<string>('');
  const [bgTransitioning, setBgTransitioning] = useState(false);

  // Filter releases based on current filters
  const filteredReleases = releases.filter(release => {
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = 
        release.title.toLowerCase().includes(query) ||
        release.artist.toLowerCase().includes(query) ||
        release.label.toLowerCase().includes(query) ||
        (release.genre && release.genre.some(genre => genre.toLowerCase().includes(query)));
      if (!matchesSearch) return false;
    }

    // Price filter
    if (filters.minPrice || filters.maxPrice) {
      const price = release.price ? parseFloat(release.price.split(' ')[1]) : 0;
      if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
    }

    // Other filters...
    if (filters.format && !release.genre.some(g => g.toLowerCase().includes(filters.format.toLowerCase()))) {
      return false;
    }

    if (filters.condition && release.condition && !release.condition.toLowerCase().includes(filters.condition.toLowerCase())) {
      return false;
    }

    if (filters.year && release.year.toString() !== filters.year) {
      return false;
    }

    return true;
  });

  const currentRelease = filteredReleases[Math.min(currentReleaseIndex, filteredReleases.length - 1)];
  
  // Debug logging
  console.log('🎵 FeedGrid debug:', {
    totalReleases: releases.length,
    filteredReleases: filteredReleases.length,
    currentReleaseIndex,
    currentRelease: currentRelease?.title || 'No release'
  });
  
  // Global audio matching for current track
  const currentTrackTitle = currentRelease?.tracks?.[currentTrackIndex]?.title || currentRelease?.title;
  const { youtubeVideoId, loading: audioLoading } = useAudioMatch(
    currentRelease?.id || 0,
    currentTrackIndex,
    currentRelease?.title,
    currentRelease?.artist,
    currentTrackTitle,
    { enabled: !!currentRelease }
  );

  // Reset indices when filters change
  useEffect(() => {
    setCurrentReleaseIndex(0);
    setCurrentTrackIndex(0);
  }, [filters]);

  // Reset track index when switching releases
  useEffect(() => {
    setCurrentTrackIndex(0);
  }, [currentReleaseIndex]);

  // Handle background image transitions
  const updateBackgroundImage = useCallback((releaseThumb: string | undefined, delay: number = 0) => {
    const newBgUrl = releaseThumb;
    const newBgImage = newBgUrl 
      ? `url(${newBgUrl})` 
      : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
    
    if (currentBgImage === '') {
      setCurrentBgImage(newBgImage);
      return;
    }
    
    if (newBgImage === currentBgImage) return;
    
    const startTransition = () => {
      if (newBgUrl) {
        const img = new Image();
        img.onload = () => {
          setNextBgImage(newBgImage);
          setBgTransitioning(true);
          setTimeout(() => {
            setCurrentBgImage(newBgImage);
            setNextBgImage('');
            setBgTransitioning(false);
          }, 500);
        };
        img.onerror = () => {
          const fallbackBg = 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
          setNextBgImage(fallbackBg);
          setBgTransitioning(true);
          setTimeout(() => {
            setCurrentBgImage(fallbackBg);
            setNextBgImage('');
            setBgTransitioning(false);
          }, 500);
        };
        img.src = newBgUrl;
      } else {
        setNextBgImage(newBgImage);
        setBgTransitioning(true);
        setTimeout(() => {
          setCurrentBgImage(newBgImage);
          setNextBgImage('');
          setBgTransitioning(false);
        }, 500);
      }
    };

    if (delay > 0) {
      setTimeout(startTransition, delay);
    } else {
      startTransition();
    }
  }, [currentBgImage]);

  // Initialize background
  useEffect(() => {
    if (!isScrolling) {
      updateBackgroundImage(currentRelease?.thumb);
    }
  }, [currentRelease?.thumb, currentBgImage, isScrolling, updateBackgroundImage]);

  // Handle vertical scroll (between releases)
  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (isScrolling || filteredReleases.length === 0) return;
    
    setIsScrolling(true);
    setSlideDirection(direction);
    
    if (direction === 'down' && currentReleaseIndex < filteredReleases.length - 1) {
      const newIndex = currentReleaseIndex + 1;
      setCurrentReleaseIndex(newIndex);
      updateBackgroundImage(filteredReleases[newIndex]?.thumb, 50);
    } else if (direction === 'up' && currentReleaseIndex > 0) {
      const newIndex = currentReleaseIndex - 1;
      setCurrentReleaseIndex(newIndex);
      updateBackgroundImage(filteredReleases[newIndex]?.thumb, 50);
    }
    
    setTimeout(() => {
      setSlideDirection(null);
      setIsScrolling(false);
    }, 500);
  }, [isScrolling, filteredReleases, currentReleaseIndex, updateBackgroundImage]);

  // Handle track scroll (between tracks within a release)
  const handleTrackScroll = useCallback((direction: 'left' | 'right') => {
    if (isScrolling || !currentRelease || !currentRelease.tracks) return;
    
    setIsScrolling(true);
    setSlideDirection(direction);
    
    if (direction === 'right' && currentTrackIndex < currentRelease.tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    } else if (direction === 'left' && currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
    }
    
    setTimeout(() => {
      setSlideDirection(null);
      setIsScrolling(false);
    }, 300);
  }, [isScrolling, currentRelease, currentTrackIndex]);

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      minPrice: '',
      maxPrice: '',
      format: '',
      condition: '',
      genre: '',
      year: ''
    });
  };

  if (layout === 'mobile') {
    return (
      <RecordCarousel
        releases={filteredReleases}
        totalReleases={totalReleases}
        currentReleaseIndex={currentReleaseIndex}
        currentTrackIndex={currentTrackIndex}
        onReleaseChange={setCurrentReleaseIndex}
        onTrackChange={setCurrentTrackIndex}
        isScrolling={isScrolling}
        onScroll={handleScroll}
        onTrackScroll={handleTrackScroll}
        slideDirection={slideDirection}
        currentBgImage={currentBgImage}
        nextBgImage={nextBgImage}
        bgTransitioning={bgTransitioning}
        youtubeVideoId={youtubeVideoId}
        audioLoading={audioLoading}
        cartCount={cartCount}
        onAddToCart={() => setCartCount(prev => prev + 1)}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        storeInfo={storeInfo}
        className={className}
        isLoadingLight={isLoadingLight}
        hasFullData={hasFullData}
      />
    );
  }

  // Desktop 3-column layout
  return (
    <div className={`flex h-screen bg-black overflow-hidden relative ${className}`}>
      {/* Background Images */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: currentBgImage,
            filter: 'blur(20px) brightness(0.3)',
            transform: 'scale(1.05)',
            opacity: bgTransitioning ? 0 : 1
          }}
        />
        {nextBgImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
            style={{
              backgroundImage: nextBgImage,
              filter: 'blur(20px) brightness(0.3)',
              transform: 'scale(1.05)',
              opacity: bgTransitioning ? 1 : 0,
              zIndex: bgTransitioning ? 1 : 0
            }}
          />
        )}
      </div>
      
      {/* Left Column: Filters */}
      <div className="w-80 bg-black/80 backdrop-blur-md shadow-lg p-6 overflow-y-auto relative z-10">
        <FeedFilterBar
          storeInfo={storeInfo}
          searchQuery={filters.searchQuery}
          onSearchChange={(query) => setFilters(prev => ({ ...prev, searchQuery: query }))}
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
          resultsCount={filteredReleases.length}
          totalCount={releases.length}
        />
      </div>
      
      {/* Center Column: Record Display */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        
        {isLoadingLight && releases.length === 0 ? (
          <FeedCardSkeleton viewMode="grid" />
        ) : currentRelease ? (
          <RecordCard
            release={currentRelease}
            viewMode="grid"
            currentTrack={currentRelease.tracks?.[currentTrackIndex]}
            showTrackInfo={true}
            tracks={currentRelease.tracks || []}
            currentTrackIndex={currentTrackIndex}
            onTrackChange={setCurrentTrackIndex}
            isScrolling={isScrolling}
            youtubeVideoId={youtubeVideoId}
            audioLoading={audioLoading}
            index={currentReleaseIndex}
            currentIndex={currentReleaseIndex + 1}
            totalCount={totalReleases || filteredReleases.length}
          />
        ) : (
          <FeedCardSkeleton viewMode="grid" />
        )}
        
        {/* Navigation Chevrons */}
        <div className="flex flex-col gap-4 ml-4 absolute right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll('up')}
            disabled={currentReleaseIndex === 0 || isScrolling}
            className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 disabled:opacity-30"
          >
            <ChevronUpIcon className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log('🔽 Down button clicked:', {
                currentIndex: currentReleaseIndex,
                totalFiltered: filteredReleases.length,
                canGoDown: currentReleaseIndex < filteredReleases.length - 1
              });
              handleScroll('down');
            }}
            disabled={currentReleaseIndex >= filteredReleases.length - 1 || isScrolling}
            className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 disabled:opacity-30"
          >
            <ChevronDownIcon className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      {/* Right Column: Actions & Track List */}
      <div className="w-80 bg-black/80 backdrop-blur-md shadow-lg p-6 overflow-y-auto relative z-10">
        {/* Cart status */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white/80">Items in crate:</span>
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-medium">
            {cartCount}
          </span>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 mb-6">
          <Button
            variant="outline"
            onClick={async () => {
              // TODO: Add to wishlist
              alert('Added to wishlist!');
            }}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <EyeIcon className="w-5 h-5 mr-2" />
            Add to Wishlist
          </Button>
          
          <Button 
            onClick={() => setCartCount(prev => prev + 1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ShoppingCartIcon className="w-5 h-5 mr-2" />
            Add to Crate
          </Button>
          
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <a
              href={
                currentRelease?.listingUri 
                  ? currentRelease.listingUri
                  : `https://www.discogs.com${currentRelease?.uri}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy Now on Discogs
            </a>
          </Button>
        </div>

        {/* Track info */}
        {currentRelease?.tracks && currentRelease.tracks.length > 0 && (
          <div className="border-t border-white/20 pt-6 flex-1 flex flex-col min-h-0">
            <h3 className="text-lg font-semibold text-white mb-3">Track List</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {currentRelease.tracks.map((track, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    index === currentTrackIndex 
                      ? 'bg-white/20 text-white' 
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                  onClick={() => setCurrentTrackIndex(index)}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{track.title}</span>
                    <span className="text-white/60">{track.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};