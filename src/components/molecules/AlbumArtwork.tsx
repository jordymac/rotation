import React from 'react';
import { cn } from '@/lib/utils';

interface AlbumArtworkProps {
  imageUrl?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AlbumArtwork: React.FC<AlbumArtworkProps> = ({
  imageUrl,
  alt,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-full h-full'
  };

  return (
    <div className={cn('relative overflow-hidden rounded-lg shadow-2xl', sizeClasses[size], className)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const placeholder = target.nextElementSibling as HTMLElement;
            if (placeholder) placeholder.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback placeholder */}
      <div 
        className={cn(
          'w-full h-full bg-gray-400 flex items-center justify-center text-gray-600',
          imageUrl ? 'hidden' : 'flex'
        )}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">🎵</div>
          <div className="text-xs">No Image</div>
        </div>
      </div>
    </div>
  );
};