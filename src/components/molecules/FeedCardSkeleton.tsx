import React from 'react';

interface FeedCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export const FeedCardSkeleton: React.FC<FeedCardSkeletonProps> = ({ 
  viewMode = 'grid' 
}) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg animate-pulse">
        <div className="flex gap-4 min-h-[120px] p-4">
          {/* Album Image Skeleton */}
          <div className="flex-shrink-0">
            <div className="w-24 h-[112px] bg-neutral-800 rounded-lg" />
          </div>
          
          {/* Content Area - 4 Column Grid */}
          <div className="flex-1 min-w-0 grid grid-cols-4 gap-6 items-center">
            {/* Column 1: Album Details */}
            <div className="min-w-0 space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-3/4" />
              <div className="h-3 bg-neutral-800 rounded w-1/2" />
              <div className="h-3 bg-neutral-800 rounded w-2/3" />
              <div className="flex gap-2">
                <div className="h-5 bg-neutral-800 rounded-full w-16" />
                <div className="h-5 bg-neutral-800 rounded-full w-12" />
              </div>
              <div className="flex gap-3">
                <div className="h-3 bg-neutral-800 rounded w-16" />
                <div className="h-3 bg-neutral-800 rounded w-20" />
              </div>
            </div>
            
            {/* Column 2: Condition/Price */}
            <div className="text-center space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-16 mx-auto" />
              <div className="h-3 bg-neutral-800 rounded w-12 mx-auto" />
              <div className="h-3 bg-neutral-800 rounded w-14 mx-auto" />
            </div>
            
            {/* Column 3: Verification */}
            <div className="text-center space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-16 mx-auto" />
              <div className="h-3 bg-neutral-800 rounded w-20 mx-auto" />
              <div className="h-3 bg-neutral-800 rounded w-16 mx-auto" />
            </div>
            
            {/* Column 4: Actions */}
            <div className="text-center space-y-2">
              <div className="h-8 bg-neutral-800 rounded w-16 mx-auto" />
              <div className="h-8 bg-neutral-800 rounded w-12 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View Skeleton
  return (
    <div className="w-full max-w-72 sm:max-w-80 mx-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 animate-pulse">
      {/* Album Artwork Skeleton */}
      <div className="relative flex-shrink-0 mb-3 sm:mb-4 mx-auto">
        <div className="aspect-square w-full rounded-xl bg-neutral-800" />
        
        {/* Track Navigation Dots Skeleton */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/20 rounded-full px-4 py-1 backdrop-blur-sm">
            <div className="flex justify-center gap-2 py-1">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-white/60"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Record Details Skeleton */}
      <div className="flex flex-col space-y-3 px-2">
        {/* Artist & Album */}
        <div className="space-y-2">
          <div className="h-4 bg-neutral-800 rounded w-2/3" />
          <div className="h-4 bg-neutral-800 rounded w-1/2" />
        </div>
        
        {/* Label | Year | Country */}
        <div className="h-3 bg-neutral-800 rounded w-3/4" />
        
        {/* Genres & Styles */}
        <div className="flex gap-2">
          <div className="h-6 bg-neutral-800 rounded-full w-16" />
          <div className="h-6 bg-neutral-800 rounded-full w-20" />
          <div className="h-6 bg-neutral-800 rounded-full w-12" />
        </div>
        
        {/* Audio Player Area */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-800 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between">
                <div className="h-3 bg-neutral-800 rounded w-16" />
                <div className="h-3 bg-neutral-800 rounded w-12" />
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Price and Condition */}
        <div className="space-y-2 pt-2">
          <div className="h-4 bg-neutral-800 rounded w-20" />
          <div className="h-3 bg-neutral-800 rounded w-16" />
        </div>
      </div>
    </div>
  );
};

export default FeedCardSkeleton;