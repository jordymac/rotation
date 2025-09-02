'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AutoplayVideoPlayerProps {
  videoId: string;
  title: string;
  className?: string;
}

export const AutoplayVideoPlayer: React.FC<AutoplayVideoPlayerProps> = ({
  videoId,
  title,
  className
}) => {
  // YouTube embed URL with autoplay and unmuted - always plays with sound
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&loop=1&playlist=${videoId}&fs=0&iv_load_policy=3&cc_load_policy=0&disablekb=1&playsinline=1`;

  return (
    <div className={cn('relative w-full h-full youtube-player', className)}>
      {/* YouTube Video with Native Controls - Always Unmuted */}
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false}
      />
    </div>
  );
};