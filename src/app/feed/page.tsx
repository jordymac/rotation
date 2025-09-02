'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FeedTemplate, LoadingTemplate } from '@/components/templates';
import { DiscogsRelease } from '@/utils/discogs';
import { useTwoStageLoading } from '@/hooks/useTwoStageLoading';
import { usePreloadQueue } from '@/hooks/usePreloadQueue';
import { getPerfProfile, logPerformanceProfile } from '@/utils/perfProfile';

interface Store {
  id: string;
  username: string;
}

interface StoreInventoryResponse {
  results: DiscogsRelease[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
  store: Store;
}

function FeedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = searchParams.get('store');
  const recordId = searchParams.get('record');
  
  // Performance-based adaptive settings
  const perfProfile = getPerfProfile();
  
  // Log performance profile on mount (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logPerformanceProfile();
    }
  }, []);
  
  // Mock feed state for template
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [currentBgImage, setCurrentBgImage] = useState('');
  const [nextBgImage, setNextBgImage] = useState('');
  const [bgTransitioning, setBgTransitioning] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    format: '',
    condition: '',
    genre: '',
    year: ''
  });

  // Two-stage loading hook with fallback
  const {
    mergedReleases: twoStageReleases,
    totalCount,
    isLoadingLight,
    loadFullData,
    hasFullData,
    stats,
    error: twoStageError
  } = useTwoStageLoading({
    storeId: storeId || undefined,
    initialLimit: 20,
    enabled: true
  });

  // Fallback state for original API
  const [fallbackReleases, setFallbackReleases] = useState<DiscogsRelease[]>([]);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Use fallback if two-stage loading fails or returns no data
  const releases = useFallback ? fallbackReleases : twoStageReleases;
  
  // Extra debug logging
  console.log('🔍 Feed data debug:', {
    useFallback,
    twoStageCount: twoStageReleases.length,
    fallbackCount: fallbackReleases.length,
    finalCount: releases.length,
    isLoadingLight,
    error: twoStageError?.message
  });

  // Fallback to original API if two-stage fails
  useEffect(() => {
    if (twoStageError || (twoStageReleases.length === 0 && !isLoadingLight)) {
      console.log('🔄 Two-stage loading failed, using fallback API');
      console.log('🔄 Reason:', { 
        hasError: !!twoStageError, 
        error: twoStageError,
        releaseCount: twoStageReleases.length, 
        isLoading: isLoadingLight 
      });
      setUseFallback(true);
      loadFallbackReleases();
    }
  }, [twoStageError, twoStageReleases.length, isLoadingLight]);

  const loadFallbackReleases = async () => {
    setIsLoadingFallback(true);
    try {
      const feedEndpoint = storeId ? `/api/feed?store=${storeId}` : '/api/feed';
      const response = await fetch(feedEndpoint);
      if (response.ok) {
        const data = await response.json();
        console.log(`[Feed] Fallback loaded ${data.results?.length || 0} releases`);
        setFallbackReleases(data.results || []);
      } else {
        console.error('Fallback API also failed:', response.status);
        setFallbackReleases([]);
      }
    } catch (error) {
      console.error('Fallback API error:', error);
      setFallbackReleases([]);
    } finally {
      setIsLoadingFallback(false);
    }
  };

  // Preload queue for assets with adaptive concurrency
  const {
    preloadImage,
    preloadAudio,
    getStats: getPreloadStats
  } = usePreloadQueue({
    maxConcurrent: perfProfile.maxConcurrent,
    enabled: true
  });

  // Find and highlight specific record if recordId is provided
  useEffect(() => {
    if (recordId && releases.length > 0) {
      const recordIndex = releases.findIndex(release => release.id.toString() === recordId);
      if (recordIndex !== -1) {
        setCurrentReleaseIndex(recordIndex);
        setCurrentTrackIndex(0);
      }
    }
  }, [recordId, releases]);

  // Update URL when navigating between records
  const updateUrlWithRecord = (releaseIndex: number) => {
    if (releases[releaseIndex]) {
      const newRecordId = releases[releaseIndex].id.toString();
      const params = new URLSearchParams(searchParams.toString());
      params.set('record', newRecordId);
      
      router.replace(`/feed?${params.toString()}`, { scroll: false });
    }
  };

  // Preload full data and assets for current and surrounding records (only for two-stage mode)
  useEffect(() => {
    if (releases.length > 0 && !useFallback) {
      const currentRelease = releases[currentReleaseIndex];
      if (currentRelease && !hasFullData(currentRelease.id)) {
        console.log('🔄 Loading full data for current release:', currentRelease.id);
        loadFullData(currentRelease.id);
      }

      // Preload current record assets with high priority
      if (currentRelease?.thumb) {
        preloadImage(currentRelease.thumb, 'high');
      }

      // Preload previous and next releases with medium priority
      const prevIndex = currentReleaseIndex - 1;
      const nextIndex = currentReleaseIndex + 1;
      
      if (prevIndex >= 0) {
        const prevRelease = releases[prevIndex];
        if (prevRelease) {
          if (!hasFullData(prevRelease.id)) {
            console.log('🔄 Preloading full data for previous release:', prevRelease.id);
            loadFullData(prevRelease.id);
          }
          if (prevRelease.thumb) {
            preloadImage(prevRelease.thumb, 'medium');
          }
        }
      }
      
      if (nextIndex < releases.length) {
        const nextRelease = releases[nextIndex];
        if (nextRelease) {
          if (!hasFullData(nextRelease.id)) {
            console.log('🔄 Preloading full data for next release:', nextRelease.id);
            loadFullData(nextRelease.id);
          }
          if (nextRelease.thumb) {
            preloadImage(nextRelease.thumb, 'medium');
          }
        }
      }

      // Preload further ahead with low priority
      const nextNext = currentReleaseIndex + 2;
      if (nextNext < releases.length) {
        const nextNextRelease = releases[nextNext];
        if (nextNextRelease?.thumb) {
          preloadImage(nextNextRelease.thumb, 'low');
        }
      }
    }
  }, [currentReleaseIndex, releases, loadFullData, hasFullData, preloadImage, useFallback]);

  // Show loading state during initial light data load or fallback
  if ((isLoadingLight || isLoadingFallback) && releases.length === 0) {
    const message = useFallback ? "Loading feed (fallback mode)..." : "Loading your feed...";
    return <LoadingTemplate message={message} />;
  }

  // Debug logging for active mode
  console.log('📊 Feed mode:', {
    useFallback,
    releaseCount: releases.length,
    totalCount: useFallback ? fallbackReleases.length : totalCount,
    twoStageStats: stats
  });
  
  // All mock data removed - only real data used

  const storeInfo = storeId ? {
    id: storeId,
    username: storeId
  } : undefined;

  return (
    <FeedTemplate
      releases={releases}
      totalReleases={useFallback ? fallbackReleases.length : totalCount}
      currentReleaseIndex={currentReleaseIndex}
      currentTrackIndex={currentTrackIndex}
      onReleaseChange={(index) => {
        setCurrentReleaseIndex(index);
        updateUrlWithRecord(index);
      }}
      onTrackChange={setCurrentTrackIndex}
      isScrolling={isScrolling}
      onScroll={(direction) => {
        setIsScrolling(true);
        setSlideDirection(direction);
        let newIndex = currentReleaseIndex;
        if (direction === 'down' && currentReleaseIndex < releases.length - 1) {
          newIndex = currentReleaseIndex + 1;
          setCurrentReleaseIndex(newIndex);
          updateUrlWithRecord(newIndex);
        } else if (direction === 'up' && currentReleaseIndex > 0) {
          newIndex = currentReleaseIndex - 1;
          setCurrentReleaseIndex(newIndex);
          updateUrlWithRecord(newIndex);
        }
        setTimeout(() => {
          setIsScrolling(false);
          setSlideDirection(null);
        }, 500);
      }}
      onTrackScroll={(direction) => {
        const currentRelease = releases[currentReleaseIndex];
        if (!currentRelease?.tracks) return;
        
        if (direction === 'right' && currentTrackIndex < currentRelease.tracks.length - 1) {
          setCurrentTrackIndex(prev => prev + 1);
        } else if (direction === 'left' && currentTrackIndex > 0) {
          setCurrentTrackIndex(prev => prev - 1);
        }
      }}
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
      onClearFilters={() => setFilters({
        searchQuery: '',
        minPrice: '',
        maxPrice: '',
        format: '',
        condition: '',
        genre: '',
        year: ''
      })}
      storeInfo={storeInfo}
      isLoadingLight={isLoadingLight}
      hasFullData={hasFullData}
      windowSize={perfProfile.windowSize}
    />
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<LoadingTemplate message="Loading your feed..." />}>
      <FeedContent />
    </Suspense>
  );
}