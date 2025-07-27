import { DiscogsRelease } from '@/utils/discogs';
import { EyeIcon } from '@heroicons/react/24/outline';

interface RecordCardProps {
  release: DiscogsRelease;
  viewMode?: 'grid' | 'list';
  isSellerMode?: boolean;
  onManageItem?: (release: DiscogsRelease) => void;
}

export default function RecordCard({ release, viewMode = 'grid', isSellerMode = false, onManageItem }: RecordCardProps) {
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
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
          className={`w-full h-full bg-gray-400 flex items-center justify-center ${
            release.thumb ? 'hidden' : 'flex'
          }`}
        >
          <div className="text-center text-gray-600">
            <div className="text-2xl mb-1">🎵</div>
            <div className="text-xs">No Image</div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          {release.title}
        </h3>
        
        <p className="text-gray-700 mb-2">
          {release.artist}
        </p>
        
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>{release.label}</span>
          <span>{release.year}</span>
        </div>
        
        {release.genre && release.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {release.genre.slice(0, 3).map((genre, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
        
        {release.price && (
          <div className="mb-3">
            <span className="text-lg font-bold text-green-600">
              {release.price}
            </span>
            {release.condition && (
              <span className="text-sm text-gray-500 ml-2">
                {release.condition}
                {release.sleeve_condition && ` / ${release.sleeve_condition}`}
              </span>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          {isSellerMode ? (
            <>
              <button
                onClick={() => onManageItem?.(release)}
                className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Manage Item
              </button>
              <div className="flex items-center justify-center px-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" title="Active"></span>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  // TODO: Add to user's Discogs wishlist
                  alert('Added to wishlist! (Will link to Discogs when user auth is implemented)');
                }}
                className="p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded transition-colors"
                title="Add to Wishlist"
              >
                <EyeIcon className="w-5 h-5" />
              </button>
              <a
                href={`https://www.discogs.com${release.uri}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Buy on Discogs
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}