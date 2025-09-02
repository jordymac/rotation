import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AlbumArtworkProps {
  imageUrl?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export const AlbumArtwork: React.FC<AlbumArtworkProps> = ({
  imageUrl,
  alt,
  size = 'md',
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw"
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-full h-full'
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-lg shadow-2xl',
      // Use aspect-square for stable sizing, ignore legacy size classes for lg
      size === 'lg' ? 'aspect-square w-full' : sizeClasses[size],
      className
    )}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
          onError={() => {
            // Handle error state if needed
            console.log('Failed to load image:', imageUrl);
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-400 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <div className="text-2xl mb-1">🎵</div>
            <div className="text-xs">No Image</div>
          </div>
        </div>
      )}
    </div>
  );
};