'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DiscogsRelease } from '@/utils/discogs';

interface ScrollableFeedProps {
  releases: DiscogsRelease[];
  storeInfo?: {
    id: string;
    username: string;
  };
}

interface ReleaseWithTracks extends DiscogsRelease {
  tracks?: {
    title: string;
    duration: string;
    position: string;
  }[];
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

  // Mock tracks for demo - in real app, this would come from Discogs API
  const mockTracks = [
    { title: "Track 1", duration: "3:45", position: "A1" },
    { title: "Track 2", duration: "4:12", position: "A2" },
    { title: "Track 3", duration: "5:23", position: "B1" },
    { title: "Track 4", duration: "3:58", position: "B2" },
  ];

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
    tracks: mockTracks
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
  }, [currentReleaseIndex]);

  // Handle vertical scroll (between releases)
  const handleScroll = (direction: 'up' | 'down') => {
    if (isScrolling || releasesWithTracks.length === 0) return;
    
    setIsScrolling(true);
    
    if (direction === 'down' && currentReleaseIndex < releasesWithTracks.length - 1) {
      setSlideDirection(direction);
      setCurrentReleaseIndex(prev => Math.min(prev + 1, releasesWithTracks.length - 1));
      
      // Reset animation state after transition
      setTimeout(() => {
        setSlideDirection(null);
        setIsScrolling(false);
      }, 500);
      
    } else if (direction === 'up' && currentReleaseIndex > 0) {
      setSlideDirection(direction);
      setCurrentReleaseIndex(prev => Math.max(prev - 1, 0));
      
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

  // Mouse wheel navigation for both releases and tracks
  useEffect(() => {
    let lastWheelTime = 0;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      
      // Throttle wheel events - only allow one every 200ms
      if (now - lastWheelTime < 200) return;
      
      if (isScrolling) return;
      
      lastWheelTime = now;
      
      const deltaY = e.deltaY;
      const deltaX = e.deltaX;
      
      // Check for horizontal scroll (tracks) first
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        if (deltaX > 0) {
          handleTrackScroll('right');
        } else {
          handleTrackScroll('left');
        }
      }
      // Otherwise, vertical scrolling (releases)
      else if (Math.abs(deltaY) > 20) {
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
    <div 
      ref={containerRef}
      className="h-screen w-full bg-black text-white overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: currentRelease.thumb ? `url(${currentRelease.thumb})` : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          filter: 'blur(20px) brightness(0.3)',
          transform: 'scale(1.1)'
        }}
      />
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="p-6 flex justify-between items-start">
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
                {storeInfo.username}
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
            <div className="text-sm opacity-75">
              {currentReleaseIndex + 1} / {releasesWithTracks.length}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <div className={`max-w-sm w-full text-center transition-all duration-500 ease-out ${
            slideDirection === 'up' ? 'animate-slide-up' : 
            slideDirection === 'down' ? 'animate-slide-down' :
            ''
          }`}>
            {/* Album Art */}
            <div className="mb-6 relative">
              {currentRelease.thumb ? (
                <img
                  src={currentRelease.thumb}
                  alt={`${currentRelease.artist} - ${currentRelease.title}`}
                  className="w-80 h-80 mx-auto rounded-lg shadow-2xl object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-80 h-80 mx-auto rounded-lg shadow-2xl bg-gray-600 flex items-center justify-center ${
                  currentRelease.thumb ? 'hidden' : 'flex'
                }`}
              >
                <div className="text-center text-gray-300">
                  <div className="text-4xl mb-2">🎵</div>
                  <div className="text-sm">Album Cover</div>
                  <div className="text-xs opacity-75">Preview Not Available</div>
                </div>
              </div>
              
              {/* Track navigation dots - overlaid on album art */}
              {currentRelease.tracks && currentRelease.tracks.length > 0 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black bg-opacity-10 rounded-full px-3 py-2 backdrop-blur-sm">
                    <div className="flex justify-center gap-2">
                      {currentRelease.tracks.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => !isScrolling && setCurrentTrackIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            index === currentTrackIndex 
                              ? 'bg-white scale-125' 
                              : 'bg-white/60 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Track Info */}
            {currentRelease.tracks && currentRelease.tracks.length > 0 && (
              <div className="mb-4 overflow-hidden">
                <div className={`text-lg text-gray-400 mb-3 flex justify-between items-center w-80 mx-auto px-4 transition-all duration-300 ease-out ${
                  slideDirection === 'left' ? 'animate-slide-left' :
                  slideDirection === 'right' ? 'animate-slide-right' :
                  ''
                }`}>
                  <span className="text-left font-semibold text-white truncate pr-4 flex-1 min-w-0">{currentRelease.tracks[currentTrackIndex].title}</span>
                  <div className="text-right flex-shrink-0 text-sm">
                    <span>{currentRelease.tracks[currentTrackIndex].position}</span>
                    <span className="mx-1">•</span>
                    <span>{currentRelease.tracks[currentTrackIndex].duration}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Release Info */}
            <div className="mb-6">
              <h1 className="text-xl text-gray-300 mb-3">
                {currentRelease.artist} • {currentRelease.title}
              </h1>
              <div className="text-sm text-gray-400 space-x-4 mb-2">
                <span>{currentRelease.label}</span>
                <span>•</span>
                <span>{currentRelease.year}</span>
                {currentRelease.price && (
                  <>
                    <span>•</span>
                    <span className="text-green-400 font-semibold">{currentRelease.price}</span>
                  </>
                )}
              </div>
              {currentRelease.genre && currentRelease.genre.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1">
                  {currentRelease.genre.slice(0, 3).map((genre, index) => (
                    <span
                      key={index}
                      className="bg-white/10 text-gray-300 px-2 py-1 rounded-full text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Audio Player Placeholder */}
            <div className="mb-2">
              <div className={`bg-white/10 rounded-lg p-4 backdrop-blur-sm transition-opacity duration-300 ease-out ${
                slideDirection === 'left' || slideDirection === 'right' ? 'opacity-50' : 'opacity-100'
              }`}>
                <div className="flex items-center gap-4">
                  <button className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    ▶
                  </button>
                  <div className="flex-1 h-1 bg-white/20 rounded-full">
                    <div className="h-full w-1/3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-300">
                    {currentRelease.tracks && currentRelease.tracks[currentTrackIndex] 
                      ? currentRelease.tracks[currentTrackIndex].duration 
                      : "3:45"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 pb-6">
          <div className="space-y-3">
            {/* First Row: Wishlist and Add to Crate */}
            <div className="flex gap-4">
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
                className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg py-3 px-6 font-semibold transition-colors flex items-center justify-center gap-2"
                title="Add to Wishlist"
              >
                <EyeIcon className="w-5 h-5 text-white" />
                <span className="text-white">Wishlist</span>
              </button>
              <button 
                onClick={() => setCartCount(prev => prev + 1)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add to Crate
              </button>
            </div>
            
            {/* Second Row: Buy Now */}
            <div>
              <a
                href={`https://www.discogs.com${currentRelease.uri}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
              >
                Buy Now
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Filter Panel - Full width overlay */}
      <div 
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
                onClick={() => window.location.href = '/'}
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
  );
}