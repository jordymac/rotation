import { DiscogsRelease } from '@/utils/discogs';
import { EyeIcon } from '@heroicons/react/24/outline';

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
}

export default function RecordCard({ release, viewMode = 'grid', isSellerMode = false, onManageItem, currentTrack, showTrackInfo = false }: RecordCardProps) {
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
    <div className="w-80 h-[600px] mx-auto flex flex-col">
      <div className="aspect-square relative flex-shrink-0 mb-4">
        {release.thumb ? (
          <img
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
          className={`w-full h-full bg-gray-400 flex items-center justify-center rounded-lg shadow-2xl ${
            release.thumb ? 'hidden' : 'flex'
          }`}
        >
          <div className="text-center text-gray-600">
            <div className="text-2xl mb-1">🎵</div>
            <div className="text-xs">No Image</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col px-2">
        {/* 1. Track Name | Track # + Length - only show on desktop when showTrackInfo is true */}
        {showTrackInfo && currentTrack ? (
          <div className="mb-3">
            <div className="flex justify-between items-center">
              <div className="text-base font-semibold text-white truncate flex-1 mr-2">
                {currentTrack.title}
              </div>
              <div className="text-sm text-white/80 flex-shrink-0">
                {currentTrack.position} • {currentTrack.duration}
              </div>
            </div>
          </div>
        ) : null}
        
        {/* 2. Artist */}
        <p className="text-lg font-medium text-white/90 mb-2 truncate">
          {release.artist}
        </p>
        
        {/* 3. Album */}
        <h3 className="font-semibold text-xl text-white mb-3 overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.25rem',
          maxHeight: '2.5rem'
        }}>
          {release.title}
        </h3>
        
        {/* 4. Label | Year */}
        <div className="flex justify-between items-center text-sm text-white/70 mb-3">
          <span className="truncate flex-1 mr-2">{release.label}</span>
          <span className="flex-shrink-0">{release.year}</span>
        </div>
        
        {/* 5. Genres */}
        <div className="h-8 mb-4 flex items-start">
          {release.genre && release.genre.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {release.genre.slice(0, 3).map((genre, index) => (
                <span
                  key={index}
                  className="bg-white/20 text-white px-2 py-1 rounded-full text-xs"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : (
            <div></div>
          )}
        </div>
        
        {/* 6. Audio Play and Timeline Scrub */}
        <div className="mb-4">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>0:00</span>
                  <span>{currentTrack?.duration || "3:45"}</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full cursor-pointer">
                  <div className="h-full w-1/3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Price and Condition - moved to bottom */}
        <div className="mt-auto">
          {release.price ? (
            <div>
              <span className="text-lg font-bold text-green-400">
                {release.price}
              </span>
              {release.condition && (
                <div className="text-sm text-white/60 mt-1 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.25rem',
                  maxHeight: '2.5rem'
                }}>
                  {release.condition}
                  {release.sleeve_condition && ` / ${release.sleeve_condition}`}
                </div>
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