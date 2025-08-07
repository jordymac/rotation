import React from 'react';
import { cn } from '@/lib/utils';
import { H3, H4, P } from '@/components/atoms';

interface ArtistAlbumInfoProps {
  artist: string;
  title: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export const ArtistAlbumInfo: React.FC<ArtistAlbumInfoProps> = ({
  artist,
  title,
  variant = 'default',
  className
}) => {
  if (variant === 'compact') {
    return (
      <div className={cn('', className)}>
        <H4 className="font-semibold text-sm text-white truncate mb-1">
          {title}
        </H4>
        <P className="text-sm text-white/80 truncate">
          {artist}
        </P>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <P className="text-xl font-medium text-white/90 truncate mb-1">
        {artist}
      </P>
      <H3 className="text-lg text-white truncate">
        {title}
      </H3>
    </div>
  );
};