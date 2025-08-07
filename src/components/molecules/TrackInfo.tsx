import React from 'react';
import { cn } from '@/lib/utils';

interface TrackInfoProps {
  title: string;
  position: string;
  duration: string;
  className?: string;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({
  title,
  position,
  duration,
  className
}) => {
  return (
    <div className={cn('', className)}>
      <div className="flex justify-start items-center gap-4">
        <div className="text-base font-semibold text-white truncate flex-1">
          {title}
        </div>
        <div className="text-sm text-white/80 flex-shrink-0">
          {position} • {duration}
        </div>
      </div>
    </div>
  );
};