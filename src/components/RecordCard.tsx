import { DiscogsRelease } from '@/utils/discogs';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';

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
}

export default function RecordCard({ release, viewMode = 'grid', isSellerMode = false, onManageItem, currentTrack, showTrackInfo = false, tracks, currentTrackIndex = 0, onTrackChange, isScrolling = false }: RecordCardProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
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
                className={`w-full h-full bg-gray-200 flex items-center justify-center ${
                  release.thumb ? 'hidden' : 'flex'
                }`}
              >
                <span className="text-gray-500 text-xs">🎵</span>
              </div>
            </div>
          </div>
          
          {/* Content Area - Remaining Space */}
          <div className="flex-1 min-w-0 grid grid-cols-4 gap-6 items-center">
            {/* Column 1: Album Details */}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                {release.title}
              </h3>
              <p className="text-sm text-gray-600 truncate mb-1">
                {release.artist}
              </p>
              <p className="text-xs text-gray-500 truncate mb-2">
                {release.label} • {release.year}
              </p>
              
              {/* Genres */}
              {release.genre && release.genre.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {release.genre.slice(0, 2).map((genre, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
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
                  <p className="text-sm text-gray-700">
                    {release.condition}
                  </p>
                )}
                {release.sleeve_condition && (
                  <p className="text-xs text-gray-500">
                    Sleeve: {release.sleeve_condition}
                  </p>
                )}
              </div>
              <div>
                {release.price && (
                  <p className="text-base font-semibold text-green-600">
                    {release.price}
                  </p>
                )}
              </div>
            </div>
            
            {/* Column 3: Verification */}
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-1">
                4/4 tracks
              </p>
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-xs text-green-600">🎵</span>
                <span className="text-xs text-gray-500">Audio Match</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-xs text-gray-500">Verified</span>
              </div>
            </div>
            
            {/* Column 4: Actions */}
            <div className="text-center">
              {isSellerMode ? (
                <button
                  onClick={() => onManageItem?.(release)}
                  className="w-full border-l-2 border-gray-300 pl-6 pr-4 py-3 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:border-gray-400 transition-colors text-base font-medium"
                >
                  <span className="flex-1 text-center">Manage</span>
                  <span className="text-gray-400 text-lg ml-2">›</span>
                </button>
              ) : (
                <div className="w-full border-l-2 border-gray-300 pl-6 pr-4 py-3 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      // TODO: Add to user's Discogs wishlist
                      alert('Added to wishlist! (Will link to Discogs when user auth is implemented)');
                    }}
                    className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition-colors"
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
      <div id="album-artwork-container" className="relative flex-shrink-0 mb-3 sm:mb-4 mx-auto aspect-square max-h-48 sm:max-h-64 max-w-48 sm:max-w-64">
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
          <div id="track-navigation-dots" className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/20 rounded-full px-3 py-2 backdrop-blur-sm">
              <div className="flex justify-center gap-2">
                {tracks.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => !isScrolling && onTrackChange?.(index)}
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
        
        {/* 5. Audio Play and Timeline Scrub */}
        <div id="audio-player-section" className="mb-4">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <button id="play-button" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <div className="flex-1">
                <div id="track-timeline-labels" className="flex justify-between text-xs text-white/60 mb-1">
                  <span id="current-time">0:00</span>
                  <span id="total-duration">{currentTrack?.duration || "3:45"}</span>
                </div>
                <div id="track-timeline" className="w-full h-2 bg-white/20 rounded-full cursor-pointer">
                  <div id="track-progress" className="h-full w-1/3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
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
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Combine genres and styles with their types
  const allTags = [
    ...genres.map(genre => ({ text: genre, type: 'genre' as const })),
    ...styles.map(style => ({ text: style, type: 'style' as const }))
  ];
  
  // Show first 3 tags, rest go into tooltip
  const visibleTags = allTags.slice(0, 3);
  const hiddenTags = allTags.slice(3);
  
  // Close tooltip when clicking outside (for mobile)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    }
    
    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);
  
  if (allTags.length === 0) {
    return <div id="genres-styles-empty" className="h-8 mb-4"></div>;
  }
  
  return (
    <div id="genres-styles-container" className="h-8 mb-4 flex items-start relative">
      <div id="genres-styles-tags" className="flex flex-wrap gap-1">
        {visibleTags.map((tag, index) => (
          <span
            key={`${tag.type}-${index}`}
            id={`${tag.type}-tag-${index}`}
            className={`px-2 py-1 rounded-full text-xs ${
              tag.type === 'genre' 
                ? 'bg-blue-500/20 text-blue-200' 
                : 'bg-purple-500/20 text-purple-200'
            }`}
          >
            {tag.text}
          </span>
        ))}
        
        {hiddenTags.length > 0 && (
          <div id="overflow-tags-container" className="relative" ref={tooltipRef}>
            <button
              id="overflow-tags-button"
              className="bg-white/20 text-white/80 px-2 py-1 rounded-full text-xs hover:bg-white/30 transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              +{hiddenTags.length}
            </button>
            
            {showTooltip && (
              <div id="overflow-tags-tooltip" className="absolute bottom-8 left-0 z-20 bg-black/90 backdrop-blur-sm rounded-lg p-3 min-w-48 max-w-64 border border-white/20">
                <div className="flex flex-wrap gap-1">
                  {hiddenTags.map((tag, index) => (
                    <span
                      key={`tooltip-${tag.type}-${index}`}
                      id={`tooltip-${tag.type}-tag-${index}`}
                      className={`px-2 py-1 rounded-full text-xs ${
                        tag.type === 'genre' 
                          ? 'bg-blue-500/20 text-blue-200' 
                          : 'bg-purple-500/20 text-purple-200'
                      }`}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>
                {/* Tooltip arrow */}
                <div id="tooltip-arrow" className="absolute -bottom-1 left-3 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/20"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}