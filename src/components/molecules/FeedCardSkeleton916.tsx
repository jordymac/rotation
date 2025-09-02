import React from 'react';

interface FeedCardSkeleton916Props {
  count?: number;
}

export const FeedCardSkeleton916: React.FC<FeedCardSkeleton916Props> = ({ 
  count = 3 
}) => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center py-4 gap-6">
      {[...Array(count)].map((_, index) => (
        <div 
          key={index}
          className="w-full max-w-sm mx-auto flex flex-col bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden animate-pulse" 
          style={{ aspectRatio: '9 / 16' }}
        >
          {/* Video Region Skeleton (16:9) */}
          <div className="relative w-full bg-neutral-800" style={{ aspectRatio: '16 / 9' }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 bg-neutral-700 rounded-full" />
            </div>
          </div>
          
          {/* Details Section */}
          <div className="flex-1 p-4 space-y-3">
            {/* Track Title */}
            <div className="h-5 bg-neutral-800 rounded w-3/4" />
            
            {/* Artist Name */}
            <div className="h-4 bg-neutral-800 rounded w-1/2" />
            
            {/* Album & Label */}
            <div className="space-y-2">
              <div className="h-3 bg-neutral-800 rounded w-2/3" />
              <div className="h-3 bg-neutral-800 rounded w-1/2" />
            </div>
            
            {/* Genres */}
            <div className="flex gap-2">
              <div className="h-5 bg-neutral-800 rounded-full w-16" />
              <div className="h-5 bg-neutral-800 rounded-full w-20" />
            </div>
            
            {/* Price */}
            <div className="h-4 bg-neutral-800 rounded w-20" />
          </div>
          
          {/* CTAs */}
          <div className="p-4 space-y-3">
            <div className="h-10 bg-neutral-800 rounded-lg w-full" />
            <div className="h-10 bg-neutral-800 rounded-lg w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedCardSkeleton916;