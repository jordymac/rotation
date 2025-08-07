'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DiscogsRelease, DiscogsTrack } from '@/utils/discogs';
import RecordCard from './RecordCard';
import { useAudioMatch } from '@/hooks/useAudioMatch';
interface ScrollableFeedProps {
  releases: DiscogsRelease[];
  storeInfo?: {
    id: string;
    username: string;
  };
}

interface ReleaseWithTracks extends DiscogsRelease {
  tracks?: DiscogsTrack[];
}

export default function ScrollableFeed({ releases, storeInfo }: ScrollableFeedProps) {
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [filters, setFilters] = useState({
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    format: '',
    condition: '',
    genre: '',
    year: ''
  });
  
  // Background transition states
  const [currentBgImage, setCurrentBgImage] = useState<string>('');
  const [nextBgImage, setNextBgImage] = useState<string>('');
  const [bgTransitioning, setBgTransitioning] = useState(false);

  // No more mock tracks - using real Discogs data

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

    // Format filter
    if (filters.format && !release.genre.some(g => g.toLowerCase().includes(filters.format.toLowerCase()))) {
      return false;
    }

    // Condition filter
    if (filters.condition && release.condition && !release.condition.toLowerCase().includes(filters.condition.toLowerCase())) {
      return false;
    }

    // Year filter
    if (filters.year && release.year.toString() !== filters.year) {
      return false;
    }

    return true;
  });

  const releasesWithTracks: ReleaseWithTracks[] = filteredReleases.map(release => ({
    ...release,
    tracks: release.tracks || []
  }));

  // Debug logging
  console.log('ScrollableFeed Debug:', {
    releasesLength: releases.length,
    releasesWithTracksLength: releasesWithTracks.length,
    currentReleaseIndex,
    isScrolling,
    slideDirection
  });

  // Safety check for currentReleaseIndex
  const safeReleaseIndex = Math.min(currentReleaseIndex, releasesWithTracks.length - 1);
  const currentRelease = releasesWithTracks[safeReleaseIndex];
  
  // Global audio matching for the current track
  const currentTrackTitle = currentRelease?.tracks?.[currentTrackIndex]?.title || currentRelease?.title;
  const { youtubeVideoId, loading: audioLoading } = useAudioMatch(
    currentRelease?.id || 0,
    currentTrackIndex,
    currentRelease?.title,
    currentRelease?.artist,
    currentTrackTitle,
    { enabled: !!currentRelease }
  );

  // Reset index if it's out of bounds
  useEffect(() => {
    if (releasesWithTracks.length > 0 && currentReleaseIndex >= releasesWithTracks.length) {
      setCurrentReleaseIndex(releasesWithTracks.length - 1);
    }
  }, [releasesWithTracks.length, currentReleaseIndex]);

  // Failsafe: Reset isScrolling if it gets stuck
  useEffect(() => {
    const resetScrolling = setTimeout(() => {
      if (isScrolling) {
        console.warn('Resetting stuck isScrolling state');
        setIsScrolling(false);
        setSlideDirection(null);
      }
    }, 2000); // Reset after 2 seconds

    return () => clearTimeout(resetScrolling);
  }, [isScrolling]);

  // Reset to first release and track when filters change
  useEffect(() => {
    setCurrentReleaseIndex(0);
    setCurrentTrackIndex(0);
  }, [filters]);

  // Reset track index when switching releases
  useEffect(() => {
    setCurrentTrackIndex(0);
    
    // Stop any playing audio when switching records
    const stopAllAudio = () => {
      // Stop HTML5 audio elements
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => audio.pause());
      
      // Stop YouTube players
      try {
        if ((window as any).YT && (window as any).YT.get) {
          const iframes = document.querySelectorAll('iframe[src*="youtube"]');
          iframes.forEach(iframe => {
            try {
              const player = (window as any).YT.get(iframe.id);
              if (player && player.pauseVideo) {
                player.pauseVideo();
              }
            } catch (e) {
              console.log('Could not pause YouTube player:', e);
            }
          });
        }
      } catch (e) {
        console.log('YouTube API not available for stopping audio');
      }
    };
    
    stopAllAudio();
  }, [currentReleaseIndex]);

  // Handle background image transitions
  const updateBackgroundImage = (releaseThumb: string | undefined, delay: number = 0) => {
    const newBgUrl = releaseThumb;
    const newBgImage = newBgUrl 
      ? `url(${newBgUrl})` 
      : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
    
    if (currentBgImage === '') {
      // First load
      setCurrentBgImage(newBgImage);
      return;
    }
    
    if (newBgImage === currentBgImage) return;
    
    const startBackgroundTransition = () => {
      // If it's an image URL, preload it
      if (newBgUrl) {
        const img = new Image();
        img.onload = () => {
          // Image loaded, now start transition
          setNextBgImage(newBgImage);
          setBgTransitioning(true);
          
          // Complete transition synchronized with card animation (500ms)
          setTimeout(() => {
            setCurrentBgImage(newBgImage);
            setNextBgImage('');
            setBgTransitioning(false);
          }, 500); // Match card animation duration
        };
        img.onerror = () => {
          // Fallback to gradient if image fails
          const fallbackBg = 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
          setNextBgImage(fallbackBg);
          setBgTransitioning(true);
          
          setTimeout(() => {
            setCurrentBgImage(fallbackBg);
            setNextBgImage('');
            setBgTransitioning(false);
          }, 500); // Match card animation duration
        };
        img.src = newBgUrl;
      } else {
        // It's a gradient, no need to preload
        setNextBgImage(newBgImage);
        setBgTransitioning(true);
        
        setTimeout(() => {
          setCurrentBgImage(newBgImage);
          setNextBgImage('');
          setBgTransitioning(false);
        }, 500); // Match card animation duration
      }
    };

    if (delay > 0) {
      setTimeout(startBackgroundTransition, delay);
    } else {
      startBackgroundTransition();
    }
  };

  // Initialize background on first load or when not scrolling
  useEffect(() => {
    if (!isScrolling) {
      updateBackgroundImage(currentRelease?.thumb);
    }
  }, [currentRelease?.thumb, currentBgImage]);

  // Prevent page scrolling on mobile
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    const preventWheelScroll = (e: WheelEvent) => {
      e.preventDefault();
    };

    // Add touch and wheel event listeners to prevent default scrolling
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventWheelScroll, { passive: false });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      // Clean up when component unmounts
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventWheelScroll);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  // Handle vertical scroll (between releases)
  const handleScroll = (direction: 'up' | 'down') => {
    if (isScrolling || releasesWithTracks.length === 0) return;
    
    setIsScrolling(true);
    
    if (direction === 'down' && currentReleaseIndex < releasesWithTracks.length - 1) {
      setSlideDirection(direction);
      const newIndex = Math.min(currentReleaseIndex + 1, releasesWithTracks.length - 1);
      setCurrentReleaseIndex(newIndex);
      
      // Trigger background transition with delay to sync with card animation
      const newRelease = releasesWithTracks[newIndex];
      if (newRelease) {
        updateBackgroundImage(newRelease.thumb, 50); // Small delay to sync with card animation
      }
      
      // Reset animation state after transition
      setTimeout(() => {
        setSlideDirection(null);
        setIsScrolling(false);
      }, 500);
      
    } else if (direction === 'up' && currentReleaseIndex > 0) {
      setSlideDirection(direction);
      const newIndex = Math.max(currentReleaseIndex - 1, 0);
      setCurrentReleaseIndex(newIndex);
      
      // Trigger background transition with delay to sync with card animation
      const newRelease = releasesWithTracks[newIndex];
      if (newRelease) {
        updateBackgroundImage(newRelease.thumb, 50); // Small delay to sync with card animation
      }
      
      // Reset animation state after transition
      setTimeout(() => {
        setSlideDirection(null);
        setIsScrolling(false);
      }, 500);
      
    } else {
      // Hit the boundary - do nothing, just reset isScrolling
      setIsScrolling(false);
    }
  };

  // Handle horizontal scroll (between tracks within a release)
  const handleTrackScroll = (direction: 'left' | 'right') => {
    if (isScrolling || !currentRelease || !currentRelease.tracks) return;
    
    setIsScrolling(true);
    
    if (direction === 'right' && currentTrackIndex < currentRelease.tracks.length - 1) {
      setSlideDirection(direction);
      setCurrentTrackIndex(prev => Math.min(prev + 1, currentRelease.tracks!.length - 1));
      
      // Reset animation state after transition
      setTimeout(() => {
        setSlideDirection(null);
        setIsScrolling(false);
      }, 300);
      
    } else if (direction === 'left' && currentTrackIndex > 0) {
      setSlideDirection(direction);
      setCurrentTrackIndex(prev => Math.max(prev - 1, 0));
      
      // Reset animation state after transition
      setTimeout(() => {
        setSlideDirection(null);
        setIsScrolling(false);
      }, 300);
      
    } else {
      // Hit the boundary - do nothing, just reset isScrolling
      setIsScrolling(false);
    }
  };


  // Keyboard navigation - up/down for releases, left/right for tracks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleScroll('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleScroll('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleTrackScroll('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleTrackScroll('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentReleaseIndex, currentTrackIndex, releasesWithTracks.length]);

  // Mouse wheel navigation for mobile only (desktop handles it directly on the record column)
  useEffect(() => {
    let lastWheelTime = 0;
    
    const handleWheel = (e: WheelEvent) => {
      // Only handle wheel events on mobile container
      const target = e.target as HTMLElement;
      if (!target.closest('#mobile-feed-container')) {
        return;
      }
      
      e.preventDefault();
      
      const now = Date.now();
      
      // Reduced throttle for better responsiveness - only allow one every 100ms
      if (now - lastWheelTime < 100) return;
      
      if (isScrolling) return;
      
      lastWheelTime = now;
      
      const deltaY = e.deltaY;
      const deltaX = e.deltaX;
      
      // Check for horizontal scroll (tracks) first - reduced threshold for better sensitivity
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        if (deltaX > 0) {
          handleTrackScroll('right');
        } else {
          handleTrackScroll('left');
        }
      }
      // Otherwise, vertical scrolling (releases) - reduced threshold for better sensitivity
      else if (Math.abs(deltaY) > 10) {
        if (deltaY > 0) {
          handleScroll('down');
        } else {
          handleScroll('up');
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isScrolling, releasesWithTracks.length, currentTrackIndex]);

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isScrolling) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;
    
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;
    
    // Check for horizontal swipe (tracks) first
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
      if (isLeftSwipe) {
        handleTrackScroll('right');
      } else if (isRightSwipe) {
        handleTrackScroll('left');
      }
    }
    // Otherwise, vertical swipe (releases)
    else if (Math.abs(distanceY) > minSwipeDistance) {
      if (isUpSwipe) {
        handleScroll('down');
      } else if (isDownSwipe) {
        handleScroll('up');
      }
    }
    
    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!currentRelease) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p>No releases available</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Layout */}
      <div 
        id="mobile-feed-container"
        ref={containerRef}
        className="md:hidden h-screen w-full bg-black text-white overflow-hidden relative fixed inset-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Images with Crossfade */}
        <div className="absolute inset-0">
          {/* Current Background */}
          <div 
            id="mobile-background-current"
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ease-in-out"
            style={{
              backgroundImage: currentBgImage,
              filter: 'blur(20px) brightness(0.3)',
              transform: 'scale(1.1)',
              opacity: bgTransitioning ? 0 : 1
            }}
          />
          {/* Next Background (for transitions) */}
          {nextBgImage && (
            <div 
              id="mobile-background-next"
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ease-in-out"
              style={{
                backgroundImage: nextBgImage,
                filter: 'blur(20px) brightness(0.3)',
                transform: 'scale(1.1)',
                opacity: bgTransitioning ? 1 : 0,
                zIndex: bgTransitioning ? 1 : 0
              }}
            />
          )}
        </div>
        
        {/* Main Content */}
        <div id="mobile-main-content" className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div id="mobile-header" className="p-6 flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <div className="w-full h-0.5 bg-white"></div>
                  <div className="w-full h-0.5 bg-white"></div>
                  <div className="w-full h-0.5 bg-white"></div>
                </div>
              </button>
              
              {storeInfo && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm opacity-75">
                  {storeInfo.id === 'general-feed' ? 'Curated Feed' : storeInfo.username}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Cart Icon */}
              <div className="relative">
                <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <ShoppingCartIcon className="w-5 h-5 text-white" />
                </button>
                {cartCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount > 99 ? '99+' : cartCount}
                  </div>
                )}
              </div>
              
              {/* Track Counter */}
              <div id="mobile-track-counter" className="text-sm opacity-75">
                {currentReleaseIndex + 1} / {releasesWithTracks.length}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div id="mobile-content-area" className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden min-h-0 relative">
            <div className={`w-full max-w-xs sm:max-w-sm text-center transition-all duration-500 ease-out flex flex-col h-full max-h-full ${
              slideDirection === 'up' ? 'animate-fade-up' : 
              slideDirection === 'down' ? 'animate-fade-down' :
              ''
            }`}>
              {/* Use RecordCard for consistent layout */}
              <div className="flex-1 overflow-y-auto min-h-0 hide-scrollbar flex flex-col items-center justify-center relative">
                <RecordCard 
                  release={currentRelease}
                  currentTrack={currentRelease.tracks && currentRelease.tracks[currentTrackIndex] 
                    ? currentRelease.tracks[currentTrackIndex] 
                    : undefined}
                  showTrackInfo={true}
                  tracks={currentRelease.tracks || []}
                  currentTrackIndex={currentTrackIndex}
                  onTrackChange={setCurrentTrackIndex}
                  isScrolling={isScrolling}
                  youtubeVideoId={youtubeVideoId}
                  audioLoading={audioLoading}
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions - Responsive Layout with safe area padding */}
          <div id="mobile-bottom-actions" className="px-4 sm:px-6 pb-6 sm:pb-6 flex-shrink-0" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            {/* Single Row Layout for All Screens */}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/wishlist', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        releaseId: currentRelease.id,
                        userId: 'temp_user', // TODO: Get from auth context
                      }),
                    });

                    if (response.ok) {
                      const result = await response.json();
                      alert(`✓ ${result.message}`);
                    } else {
                      alert('Failed to add to wishlist');
                    }
                  } catch (error) {
                    console.error('Wishlist error:', error);
                    alert('Error adding to wishlist');
                  }
                }}
                className="p-3 sm:px-6 sm:py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                title="Add to Wishlist"
              >
                <EyeIcon className="w-5 h-5 text-white" />
                <span className="hidden sm:inline text-white">Wishlist</span>
              </button>
              <button 
                onClick={() => setCartCount(prev => prev + 1)}
                className="p-3 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                title="Add to Crate"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Crate</span>
              </button>
              <a
                href={`https://www.discogs.com${currentRelease.uri}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
              >
                Buy Now
              </a>
            </div>
          </div>
        </div>

        {/* Filter Panel - Full width overlay */}
        <div 
          id="mobile-filter-panel"
          className={`fixed inset-0 bg-black/95 backdrop-blur-md transform transition-transform duration-300 ease-in-out z-50 ${
            showFilters ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={() => setShowFilters(false)}
        >
          <div className="p-6 h-full overflow-y-auto max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Go Back to Stores */}
              <div className="pb-4 border-b border-white/20">
                <button
                  onClick={() => window.location.href = '/stores'}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white font-medium"
                >
                  <span className="text-xl">←</span>
                  <span>All Stores</span>
                </button>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Artist, title, label, or genre..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                />
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    className="flex-1 min-w-0 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    className="flex-1 min-w-0 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Format
                </label>
                <select
                  value={filters.format}
                  onChange={(e) => setFilters({...filters, format: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:ring-2 focus:ring-white/30 focus:border-transparent"
                >
                  <option value="">All Formats</option>
                  <option value="vinyl">Vinyl</option>
                  <option value="cd">CD</option>
                  <option value="cassette">Cassette</option>
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Condition
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) => setFilters({...filters, condition: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:ring-2 focus:ring-white/30 focus:border-transparent"
                >
                  <option value="">All Conditions</option>
                  <option value="mint">Mint (M)</option>
                  <option value="near mint">Near Mint (NM)</option>
                  <option value="very good plus">Very Good Plus (VG+)</option>
                  <option value="very good">Very Good (VG)</option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1990"
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                />
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setFilters({
                    searchQuery: '',
                    minPrice: '',
                    maxPrice: '',
                    format: '',
                    condition: '',
                    genre: '',
                    year: ''
                  });
                }}
                className="w-full mt-6 px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
              >
                Clear All Filters
              </button>

              {/* Results Count */}
              <div className="text-center text-white/60 text-sm mt-4">
                Showing {releasesWithTracks.length} of {releases.length} releases
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop 3-Column Layout */}
      <div id="desktop-feed-container" className="hidden md:flex h-screen bg-black overflow-hidden relative">
        {/* Background Images with Crossfade for Desktop */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Current Background */}
          <div 
            id="desktop-background-current"
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ease-in-out"
            style={{
              backgroundImage: currentBgImage,
              filter: 'blur(20px) brightness(0.3)',
              transform: 'scale(1.05)',
              opacity: bgTransitioning ? 0 : 1
            }}
          />
          {/* Next Background (for transitions) */}
          {nextBgImage && (
            <div 
              id="desktop-background-next"
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ease-in-out"
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
        
        {/* Left Column: Search Menu */}
        <div id="desktop-filters-column" className="w-80 bg-black/80 backdrop-blur-md shadow-lg p-6 overflow-y-auto relative z-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Filters</h2>
            {storeInfo && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm text-white/80">
                {storeInfo.id === 'general-feed' ? 'Curated Feed' : storeInfo.username}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Go Back to Stores */}
            <div className="pb-4 border-b border-white/20">
              <button
                onClick={() => window.location.href = '/stores'}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white font-medium"
              >
                <span className="text-xl">←</span>
                <span>All Stores</span>
              </button>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Artist, title, label, or genre..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="flex-1 min-w-0 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="flex-1 min-w-0 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
                />
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Format
              </label>
              <select
                value={filters.format}
                onChange={(e) => setFilters({...filters, format: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:ring-2 focus:ring-white/30 focus:border-transparent"
              >
                <option value="">All Formats</option>
                <option value="vinyl">Vinyl</option>
                <option value="cd">CD</option>
                <option value="cassette">Cassette</option>
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => setFilters({...filters, condition: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:ring-2 focus:ring-white/30 focus:border-transparent"
              >
                <option value="">All Conditions</option>
                <option value="mint">Mint (M)</option>
                <option value="near mint">Near Mint (NM)</option>
                <option value="very good plus">Very Good Plus (VG+)</option>
                <option value="very good">Very Good (VG)</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Year
              </label>
              <input
                type="number"
                placeholder="e.g. 1990"
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent"
              />
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setFilters({
                  searchQuery: '',
                  minPrice: '',
                  maxPrice: '',
                  format: '',
                  condition: '',
                  genre: '',
                  year: ''
                });
              }}
              className="w-full mt-6 px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
            >
              Clear All Filters
            </button>

            {/* Results Count */}
            <div className="text-center text-white/60 text-sm mt-4">
              Showing {releasesWithTracks.length} of {releases.length} releases
            </div>
          </div>
        </div>

        {/* Middle Column: Record Card with scroll handling */}
        <div 
          id="desktop-record-column" 
          className="flex-1 flex items-start justify-center p-8 relative z-10"
          onWheel={(e) => {
            e.preventDefault();
            
            // Throttle wheel events for consistent behavior
            const now = Date.now();
            if (now - (window as any).lastDesktopWheelTime < 100) return;
            if (isScrolling) return;
            (window as any).lastDesktopWheelTime = now;
            
            const deltaY = e.deltaY;
            const deltaX = e.deltaX;
            
            // Check for horizontal scroll (tracks) first
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
              if (deltaX > 0) {
                handleTrackScroll('right');
              } else {
                handleTrackScroll('left');
              }
            }
            // Otherwise, vertical scrolling (releases)
            else if (Math.abs(deltaY) > 10) {
              if (deltaY > 0) {
                handleScroll('down');
              } else {
                handleScroll('up');
              }
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className={`flex flex-col items-center transition-all duration-500 ease-out ${
              slideDirection === 'up' ? 'animate-fade-up' : 
              slideDirection === 'down' ? 'animate-fade-down' :
              ''
            }`}>
              <div className="text-center mb-2">
                <div id="desktop-track-counter" className="text-xs text-white/60">
                  {currentReleaseIndex + 1} / {releasesWithTracks.length}
                </div>
              </div>
              <RecordCard 
                release={currentRelease} 
                viewMode="grid"
                currentTrack={currentRelease.tracks && currentRelease.tracks.length > 0 ? currentRelease.tracks[currentTrackIndex] : undefined}
                showTrackInfo={true}
                tracks={currentRelease.tracks || []}
                currentTrackIndex={currentTrackIndex}
                onTrackChange={setCurrentTrackIndex}
                isScrolling={isScrolling}
                youtubeVideoId={youtubeVideoId}
                audioLoading={audioLoading}
              />
            </div>
            
            {/* Navigation Chevrons */}
            <div className="flex flex-col gap-4 ml-4">
              <button
                onClick={() => handleScroll('up')}
                disabled={currentReleaseIndex === 0 || isScrolling}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous Record"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => handleScroll('down')}
                disabled={currentReleaseIndex === releasesWithTracks.length - 1 || isScrolling}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next Record"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div id="desktop-actions-column" className="w-80 bg-black/80 backdrop-blur-md shadow-lg p-6 relative z-10 flex flex-col h-full">
          <h2 className="text-2xl font-bold text-white mb-6">Actions</h2>
          
          {/* Cart status */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-white/80">Items in crate:</span>
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-medium">
              {cartCount}
            </span>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/wishlist', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      releaseId: currentRelease.id,
                      userId: 'temp_user', // TODO: Get from auth context
                    }),
                  });

                  if (response.ok) {
                    const result = await response.json();
                    alert(`✓ ${result.message}`);
                  } else {
                    alert('Failed to add to wishlist');
                  }
                } catch (error) {
                  console.error('Wishlist error:', error);
                  alert('Error adding to wishlist');
                }
              }}
              className="w-full bg-white/20 hover:bg-white/30 rounded-lg py-3 px-6 font-semibold transition-colors flex items-center justify-center gap-2 text-white"
              title="Add to Wishlist"
            >
              <EyeIcon className="w-5 h-5" />
              <span>Add to Wishlist</span>
            </button>
            
            <button 
              onClick={() => setCartCount(prev => prev + 1)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">📦</span>
              <span>Add to Crate</span>
            </button>
            
            <a
              href={`https://www.discogs.com${currentRelease.uri}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
            >
              Buy Now on Discogs
            </a>
          </div>

          {/* Track info */}
          {currentRelease.tracks && currentRelease.tracks.length > 0 && (
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
      
    </>
  );
}