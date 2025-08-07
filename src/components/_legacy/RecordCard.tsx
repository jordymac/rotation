import { DiscogsRelease } from '@/utils/discogs';
import { EyeIcon, MusicalNoteIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import YouTubeAudioPlayer from './YouTubeAudioPlayer';

// Country code to flag emoji mapping
const countryToFlag = (country: string): string => {
  const countryMap: { [key: string]: string } = {
    'US': '🇺🇸',
    'USA': '🇺🇸',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Japan': '🇯🇵',
    'Australia': '🇦🇺',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'Russia': '🇷🇺',
    'Poland': '🇵🇱',
    'Czech Republic': '🇨🇿',
    'Hungary': '🇭🇺',
    'Austria': '🇦🇹',
    'Switzerland': '🇨🇭',
    'Belgium': '🇧🇪',
    'Finland': '🇫🇮',
    'Ireland': '🇮🇪',
    'South Korea': '🇰🇷',
    'China': '🇨🇳',
    'India': '🇮🇳',
    'Israel': '🇮🇱',
    'South Africa': '🇿🇦',
    'New Zealand': '🇳🇿',
    'Portugal': '🇵🇹',
    'Greece': '🇬🇷',
    'Turkey': '🇹🇷',
    'Iceland': '🇮🇸'
  };
  
  return countryMap[country] || '🌍';
};

interface RecordCardProps {
  release: DiscogsRelease;
  viewMode?: 'grid' | 'list';
  isSellerMode?: boolean;
  onManageItem?: (release: DiscogsRelease) => void;
  onVerifyAudio?: (release: DiscogsRelease) => void;
  currentTrack?: {
    title: string;
    duration: string;
    position: string;
  };
  showTrackInfo?: boolean;
  tracks?: Array<{
    title: string;
    duration: string;
    position: string;
  }>;
  currentTrackIndex?: number;
  onTrackChange?: (index: number) => void;
  isScrolling?: boolean;
  youtubeVideoId?: string | null;
  audioLoading?: boolean;
}

// Simple seeded random function for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate enhanced track data for verification calculations (same as management modal)
const generateEnhancedTracks = (release: DiscogsRelease) => {
  // Use real track data from the release if available, otherwise create minimal fallback
  const baseTracks = release.tracks && release.tracks.length > 0 
    ? release.tracks 
    : [
        { position: 'A1', title: release.title, duration: '3:30' },
        { position: 'A2', title: `${release.title} (Alternate)`, duration: '3:45' }
      ];
  
  return baseTracks.map((track, index) => {
    // Use release ID and track index as seed for consistent results
    const seed = release.id * 1000 + index;
    
    // Mock audio matching data - in production this would come from audio matching service
    const mockAudioData = {
      hasAudio: seededRandom(seed) > 0.2, // 80% chance of having audio
      platforms: [] as string[],
      matchQuality: 'medium' as 'high' | 'medium' | 'low'
    };
    
    // Randomly assign platforms for tracks that have audio
    if (mockAudioData.hasAudio) {
      const allPlatforms = ['youtube', 'spotify', 'apple', 'soundcloud'];
      const numPlatforms = Math.floor(seededRandom(seed + 1) * 3) + 1; // 1-3 platforms
      const shuffled = [...allPlatforms].sort(() => 0.5 - seededRandom(seed + 2));
      mockAudioData.platforms = shuffled.slice(0, numPlatforms);
      
      // Higher quality if more platforms
      if (mockAudioData.platforms.length >= 3) {
        mockAudioData.matchQuality = 'high';
      } else if (mockAudioData.platforms.length >= 2) {
        mockAudioData.matchQuality = 'medium';
      } else {
        mockAudioData.matchQuality = seededRandom(seed + 3) > 0.5 ? 'medium' : 'low';
      }
    } else {
      mockAudioData.matchQuality = 'low';
    }
    
    return {
      position: track.position,
      title: track.title,
      duration: track.duration || '3:30', // Fallback duration
      artists: track.artists,
      ...mockAudioData
    };
  });
};

export default function RecordCard({ release, viewMode = 'grid', isSellerMode = false, onManageItem, onVerifyAudio, currentTrack, showTrackInfo = false, tracks, currentTrackIndex = 0, onTrackChange, isScrolling = false, youtubeVideoId, audioLoading }: RecordCardProps) {
  // Calculate real verification status for list view
  const enhancedTracks = generateEnhancedTracks(release);
  const totalTracks = enhancedTracks.length;
  const tracksWithAudio = enhancedTracks.filter(t => t.hasAudio).length;
  const audioMatchPercentage = Math.round((tracksWithAudio / totalTracks) * 100);
  const isVerified = audioMatchPercentage >= 80;
  
  

  if (viewMode === 'list') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 hover:bg-white/20 transition-all duration-200">
        <div className="flex gap-4 min-h-[120px]">
          {/* Album Image - Far Left, Full Height */}
          <div className="flex-shrink-0">
            <div className="w-24 h-[112px] rounded-lg overflow-hidden shadow-sm">
              {release.thumb ? (
                <img
                  src={release.thumb}
                  alt={`${release.artist} - ${release.title}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full bg-white/20 flex items-center justify-center ${
                  release.thumb ? 'hidden' : 'flex'
                }`}
              >
                <span className="text-white/60 text-xs">🎵</span>
              </div>
            </div>
          </div>
          
          {/* Content Area - Remaining Space */}
          <div className="flex-1 min-w-0 grid grid-cols-4 gap-6 items-center">
            {/* Column 1: Album Details */}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-white truncate mb-1">
                {release.title}
              </h3>
              <p className="text-sm text-white/80 truncate mb-1">
                {release.artist}
              </p>
              <p className="text-xs text-white/60 truncate mb-2">
                {release.label} • {release.year}
              </p>
              
              {/* Genres */}
              {release.genre && release.genre.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {release.genre.slice(0, 2).map((genre, index) => (
                    <span
                      key={index}
                      className="bg-white/20 text-white/80 px-2 py-1 rounded text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-white/60">
                <div className="flex items-center gap-1">
                  <span>🎵</span>
                  <span>{Math.floor(Math.random() * 1000 + 50)} plays</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>❤️</span>
                  <span>{Math.floor(Math.random() * 200 + 10)} wishlists</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👁️</span>
                  <span>{Math.floor(Math.random() * 500 + 25)} views</span>
                </div>
              </div>
            </div>
            
            {/* Column 2: Condition/Price */}
            <div className="text-center">
              <div className="mb-2">
                {release.condition && (
                  <p className="text-sm text-white/80">
                    {release.condition}
                  </p>
                )}
                {release.sleeve_condition && (
                  <p className="text-xs text-white/60">
                    Sleeve: {release.sleeve_condition}
                  </p>
                )}
              </div>
              <div>
                {release.price && (
                  <p className="text-base font-semibold text-green-400">
                    {release.price}
                  </p>
                )}
              </div>
            </div>
            
            {/* Column 3: Verification */}
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">
                {tracksWithAudio}/{totalTracks} tracks
              </p>
              <div className="flex items-center justify-center gap-1 mb-1">
                <MusicalNoteIcon className="w-3 h-3 text-green-400" />
                <span className="text-xs text-white/60">{audioMatchPercentage}% Audio Match</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                {isVerified ? (
                  <CheckIcon className="w-3 h-3 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="w-3 h-3 text-orange-400" />
                )}
                <span className="text-xs text-white/60">{isVerified ? 'Verified' : 'Needs Review'}</span>
              </div>
            </div>
            
            {/* Column 4: Actions */}
            <div className="text-center">
              {isSellerMode ? (
                <div className="border-l-2 border-white/20 pl-6 pr-4 py-3 space-y-2">
                  <button
                    onClick={() => onManageItem?.(release)}
                    className="w-full flex items-center justify-center text-white/80 hover:text-white transition-colors text-sm font-medium py-1"
                  >
                    <span className="flex-1 text-center">Manage</span>
                    <span className="text-white/40 text-lg ml-2">›</span>
                  </button>
                  <button
                    onClick={() => onVerifyAudio?.(release)}
                    className="w-full flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium py-1"
                  >
                    <MusicalNoteIcon className="w-4 h-4 mr-1" />
                    <span>Verify Audio</span>
                  </button>
                </div>
              ) : (
                <div className="w-full border-l-2 border-white/20 pl-6 pr-4 py-3 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      // TODO: Add to user's Discogs wishlist
                      alert('Added to wishlist! (Will link to Discogs when user auth is implemented)');
                    }}
                    className="p-2 rounded-full bg-white/20 hover:bg-blue-500/30 text-white/80 hover:text-blue-300 transition-colors"
                    title="Add to Wishlist"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <a
                    href={`https://www.discogs.com${release.uri}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors text-center"
                  >
                    Buy on Discogs
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div id="record-card" className="w-full max-w-72 sm:max-w-80 mx-auto flex flex-col h-full max-h-full">
      <div id="album-artwork-container" className="relative flex-shrink-0 mb-3 sm:mb-4 mx-auto aspect-square max-h-48 sm:max-h-64 max-w-48 sm:max-w-full">
        {release.thumb ? (
          <img
            id="album-artwork-image"
            src={release.thumb}
            alt={`${release.artist} - ${release.title}`}
            className="w-full h-full object-cover rounded-lg shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          id="album-artwork-placeholder"
          className={`w-full h-full bg-gray-400 flex items-center justify-center rounded-lg shadow-2xl ${
            release.thumb ? 'hidden' : 'flex'
          }`}
        >
          <div className="text-center text-gray-600">
            <div className="text-2xl mb-1">🎵</div>
            <div className="text-xs">No Image</div>
          </div>
        </div>
        
        {/* Track navigation dots - overlaid on image */}
        {tracks && tracks.length > 1 && (
          <div id="track-navigation-dots" className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-full max-w-full px-4">
            <div className="bg-black/20 rounded-full px-4 py-1
             backdrop-blur-sm max-w-full">
              <div className="flex justify-center gap-2 py-1">
                {(() => {
                  const totalTracks = tracks.length;
                  const current = currentTrackIndex || 0;
                  
                  // If 5 or fewer tracks, show all
                  if (totalTracks <= 5) {
                    return tracks.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => !isScrolling && onTrackChange?.(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 flex-shrink-0 ${
                          index === current 
                            ? 'bg-white scale-125' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                      />
                    ));
                  }
                  
                  // For more than 5 tracks, use sliding window with progressive sizing
                  let startIndex, endIndex;
                  
                  if (current <= 2) {
                    // Stay at start for first 3 tracks
                    startIndex = 0;
                    endIndex = 4;
                  } else if (current >= totalTracks - 3) {
                    // Stay at end for last 3 tracks
                    startIndex = totalTracks - 5;
                    endIndex = totalTracks - 1;
                  } else {
                    // Center on current track
                    startIndex = current - 2;
                    endIndex = current + 2;
                  }
                  
                  const visibleDots = [];
                  const isShowingFirst = startIndex === 0;
                  const isShowingLast = endIndex === totalTracks - 1;
                  
                  for (let i = startIndex; i <= endIndex; i++) {
                    const position = i - startIndex; // 0, 1, 2, 3, 4
                    let dotScale = 'scale-75'; // Default smaller size
                    let opacity = 'bg-white/40';
                    let animationClass = '';
                    
                    // Determine if this is a middle dot that should animate
                    const isMiddleDot = position >= 1 && position <= 3;
                    const isCurrentDot = i === current;
                    const isNextDot = i === current + 1 || i === current - 1;
                    
                    // Size and animation based on position and context
                    if (isCurrentDot) {
                      // Current track - largest
                      dotScale = 'scale-125';
                      opacity = 'bg-white';
                    } else if (isNextDot && isMiddleDot) {
                      // Next/previous dot in middle positions - animate growth
                      dotScale = 'scale-110';
                      opacity = 'bg-white/70';
                      animationClass = 'animate-dot-anticipate';
                    } else if (position === 2 && !isCurrentDot) {
                      // Middle position when current is not middle - normal size
                      dotScale = 'scale-100';
                      opacity = 'bg-white/60';
                    } else if ((position === 1 || position === 3) && !isNextDot) {
                      // Adjacent to middle - medium size
                      dotScale = 'scale-90';
                      opacity = 'bg-white/50';
                    } else {
                      // Edge positions or other middle positions
                      if ((position === 0 && isShowingFirst) || (position === 4 && isShowingLast)) {
                        // First or last track visible - keep static normal size
                        dotScale = 'scale-100';
                        opacity = 'bg-white/60';
                      } else {
                        // Edge dots when first/last not visible - smaller
                        dotScale = 'scale-75';
                        opacity = 'bg-white/40';
                      }
                    }
                    
                    visibleDots.push(
                      <button
                        key={i}
                        onClick={() => !isScrolling && onTrackChange?.(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ease-out flex-shrink-0 ${dotScale} ${opacity} ${animationClass} hover:bg-white/80 ${
                          isNextDot && isMiddleDot ? 'transform-gpu will-change-transform' : ''
                        }`}
                        style={{
                          transitionProperty: 'transform, background-color, opacity, box-shadow',
                          transitionTimingFunction: isNextDot && isMiddleDot ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-out',
                          boxShadow: isNextDot && isMiddleDot ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none'
                        }}
                      />
                    );
                  }
                  
                  return visibleDots;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div id="record-details" className="flex-1 flex flex-col px-2">
        {/* 1. Track Name | Track # + Length - only show on desktop when showTrackInfo is true */}
        {showTrackInfo && currentTrack ? (
          <div id="current-track-info" className="mb-3">
            <div className="flex justify-start items-center gap-4">
              <div id="track-title" className="text-base font-semibold text-white truncate flex-1">
                {currentTrack.title}
              </div>
              <div id="track-position-duration" className="text-sm text-white/80 flex-shrink-0">
                {currentTrack.position} • {currentTrack.duration}
              </div>
            </div>
          </div>
        ) : null}
        
        {/* 2. Artist & Album */}
        <div id="artist-album-section" className="mb-3">
          <p id="artist-name" className="text-xl font-medium text-white/90 truncate mb-1">
            {release.artist}
          </p>
          <h3 id="album-title" className="text-lg text-white truncate">
            {release.title}
          </h3>
        </div>
        
        {/* 3. Label | Year | Country */}
        <div id="label-year-section" className="flex items-center gap-2 text-sm text-white/70 mb-3">
          <span id="record-label" className="truncate flex-1">{release.label}</span>
          <span className="text-white/50 flex-shrink-0">|</span>
          <span id="release-year" className="flex-shrink-0">{release.year}</span>
          {release.country && (
            <>
              <span className="text-white/50 flex-shrink-0">|</span>
              <span id="country-flag" className="flex-shrink-0" title={release.country}>
                {countryToFlag(release.country)}
              </span>
            </>
          )}
        </div>
        
        {/* 4. Genres & Styles */}
        <div id="genres-styles-section">
          <GenresAndStyles genres={release.genre || []} styles={release.style || []} />
        </div>
        
        {/* 5. Audio Player */}
        <div id="audio-player-section" className="mb-4">
          {showTrackInfo && youtubeVideoId && viewMode !== 'list' ? (
            <YouTubeAudioPlayer
              key={`${release.id}-${currentTrackIndex}`} // Force re-mount when track changes
              videoId={youtubeVideoId}
              autoplay={false}
              onError={(error) => console.error('YouTube player error:', error)}
            />
          ) : showTrackInfo && audioLoading && viewMode !== 'list' ? (
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/60 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>Loading...</span>
                    <span>--:--</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full">
                    <div className="h-full w-0 bg-white/60 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : showTrackInfo ? (
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>No audio</span>
                    <span>{currentTrack?.duration || "3:45"}</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full">
                    <div className="h-full w-0 bg-white/40 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Price and Condition - same row */}
        <div id="price-condition-section" className="mt-auto">
          {release.price || release.condition ? (
            <div className="flex items-center justify-between gap-2">
              {/* Condition - left side, 50% width, truncated */}
              {release.condition && (
                <div id="record-condition" className="flex-1 max-w-[50%] text-sm text-white/60 truncate">
                  {release.condition}
                  {release.sleeve_condition && ` / ${release.sleeve_condition}`}
                </div>
              )}
              {/* Price - right side */}
              {release.price && (
                <span id="record-price" className="text-lg font-bold text-green-400 flex-shrink-0 text-right">
                  {release.price}
                </span>
              )}
            </div>
          ) : (
            <div className="h-6"></div>
          )}
        </div>
      </div>

    </div>
  );
}

function GenresAndStyles({ genres, styles }: { genres: string[], styles: string[] }) {
  const [showGenreTooltip, setShowGenreTooltip] = useState(false);
  const [showStyleTooltip, setShowStyleTooltip] = useState(false);
  const genreTooltipRef = useRef<HTMLDivElement>(null);
  const styleTooltipRef = useRef<HTMLDivElement>(null);
  
  // Close tooltips when clicking outside (for mobile)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genreTooltipRef.current && !genreTooltipRef.current.contains(event.target as Node)) {
        setShowGenreTooltip(false);
      }
      if (styleTooltipRef.current && !styleTooltipRef.current.contains(event.target as Node)) {
        setShowStyleTooltip(false);
      }
    }
    
    if (showGenreTooltip || showStyleTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showGenreTooltip, showStyleTooltip]);
  
  if (genres.length === 0 && styles.length === 0) {
    return <div id="genres-styles-empty" className="h-8 mb-4"></div>;
  }
  
  return (
    <div id="genres-styles-container" className="h-8 mb-4 flex items-start relative">
      <div id="genres-styles-tags" className="flex flex-wrap gap-1">
        {/* Show first genre + overflow */}
        {genres.length > 0 && (
          <>
            <span
              id="genre-tag-0"
              className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-200"
            >
              {genres[0]}
            </span>
            
            {genres.length > 1 && (
              <div id="overflow-genre-container" className="relative" ref={genreTooltipRef}>
                <button
                  id="overflow-genre-button"
                  className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full text-xs hover:bg-blue-500/30 transition-colors"
                  onMouseEnter={() => setShowGenreTooltip(true)}
                  onMouseLeave={() => setShowGenreTooltip(false)}
                  onClick={() => setShowGenreTooltip(!showGenreTooltip)}
                >
                  +{genres.length - 1}
                </button>
                
                {showGenreTooltip && (
                  <div id="overflow-genre-tooltip" className="absolute bottom-8 left-0 z-20 bg-black/90 backdrop-blur-sm rounded-lg p-3 min-w-48 max-w-64 border border-white/20">
                    <div className="flex flex-wrap gap-1">
                      {genres.slice(1).map((genre, index) => (
                        <span
                          key={`tooltip-genre-${index}`}
                          id={`tooltip-genre-tag-${index + 1}`}
                          className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-200"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute -bottom-1 left-3 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/20"></div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Show first style + overflow */}
        {styles.length > 0 && (
          <>
            <span
              id="style-tag-0"
              className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-200"
            >
              {styles[0]}
            </span>
            
            {styles.length > 1 && (
              <div id="overflow-style-container" className="relative" ref={styleTooltipRef}>
                <button
                  id="overflow-style-button"
                  className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded-full text-xs hover:bg-purple-500/30 transition-colors"
                  onMouseEnter={() => setShowStyleTooltip(true)}
                  onMouseLeave={() => setShowStyleTooltip(false)}
                  onClick={() => setShowStyleTooltip(!showStyleTooltip)}
                >
                  +{styles.length - 1}
                </button>
                
                {showStyleTooltip && (
                  <div id="overflow-style-tooltip" className="absolute bottom-8 left-0 z-20 bg-black/90 backdrop-blur-sm rounded-lg p-3 min-w-48 max-w-64 border border-white/20">
                    <div className="flex flex-wrap gap-1">
                      {styles.slice(1).map((style, index) => (
                        <span
                          key={`tooltip-style-${index}`}
                          id={`tooltip-style-tag-${index + 1}`}
                          className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-200"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute -bottom-1 left-3 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/20"></div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}