'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeedTemplate, LoadingTemplate } from '@/components/templates';
import { DiscogsRelease } from '@/utils/discogs';

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
  const storeId = searchParams.get('store');
  
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

  // Real releases data
  const [releases, setReleases] = useState<DiscogsRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRealReleases();
  }, [storeId]); // Re-fetch when store changes

  const loadRealReleases = async () => {
    try {
      // Use enhanced feed API that includes approved audio matches
      const feedEndpoint = storeId ? `/api/feed?store=${storeId}` : '/api/feed';
      const response = await fetch(feedEndpoint);
      if (response.ok) {
        const data = await response.json();
        console.log(`[Feed] Loaded ${data.results?.length || 0} releases with ${data.audioMatchesCount || 0} audio matches`);
        setReleases(data.results || []);
      } else {
        console.error('Failed to load feed data:', response.status);
        setReleases([]); // Empty instead of mock data
      }
    } catch (error) {
      console.error('Failed to load releases:', error);
      setReleases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Only use real releases data - no mock fallback
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // All mock data removed - only real data used

  const storeInfo = storeId ? {
    id: storeId,
    username: storeId
  } : undefined;

  return (
    <FeedTemplate
      releases={releases}
      currentReleaseIndex={currentReleaseIndex}
      currentTrackIndex={currentTrackIndex}
      onReleaseChange={setCurrentReleaseIndex}
      onTrackChange={setCurrentTrackIndex}
      isScrolling={isScrolling}
      onScroll={(direction) => {
        setIsScrolling(true);
        setSlideDirection(direction);
        if (direction === 'down' && currentReleaseIndex < releases.length - 1) {
          setCurrentReleaseIndex(prev => prev + 1);
        } else if (direction === 'up' && currentReleaseIndex > 0) {
          setCurrentReleaseIndex(prev => prev - 1);
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