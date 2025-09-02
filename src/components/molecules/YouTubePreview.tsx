'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PlayIcon, PauseIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface YouTubePreviewProps {
  url?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

export const YouTubePreview: React.FC<YouTubePreviewProps> = ({
  url,
  title = 'Audio Preview',
  className,
  autoPlay = false,
  onPlay,
  onPause
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>();

  const videoId = url ? extractYouTubeId(url) : null;

  // Generate thumbnail URL
  useEffect(() => {
    if (videoId) {
      setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      setHasError(false);
    }
  }, [videoId]);

  const handlePlay = () => {
    if (!videoId) return;
    
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!url || !videoId) {
    return (
      <div className={cn(
        "rounded-2xl border border-neutral-800 bg-neutral-950 p-4",
        className
      )}>
        <div className="text-xs mb-2 text-neutral-400">Audio Source</div>
        <div className="h-32 rounded-md bg-neutral-900 flex items-center justify-center">
          <div className="text-neutral-500 text-sm">No audio source available</div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={cn(
        "rounded-2xl border border-neutral-800 bg-neutral-950 p-4",
        className
      )}>
        <div className="text-xs mb-2 text-neutral-400">Audio Source</div>
        <div className="h-32 rounded-md bg-neutral-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-neutral-500 text-sm mb-2">Failed to load preview</div>
            <button 
              onClick={handleOpenExternal}
              className="text-red-400 hover:text-red-300 text-xs underline"
            >
              Open in YouTube
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border border-neutral-800 bg-neutral-950 p-4",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-neutral-400">Audio Source</div>
        <button
          onClick={handleOpenExternal}
          className="text-neutral-400 hover:text-neutral-300 p-1"
          title="Open in YouTube"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </button>
      </div>

      {isPlaying ? (
        // Embedded YouTube player
        <div className="relative h-32 rounded-md overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setHasError(false)}
            onError={() => setHasError(true)}
          />
          
          {/* Overlay controls */}
          <div className="absolute top-2 right-2">
            <button
              onClick={handlePause}
              className="p-1.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70"
              title="Switch to thumbnail"
            >
              <PauseIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        // Thumbnail view with play button
        <div className="relative h-32 rounded-md overflow-hidden bg-neutral-900 group cursor-pointer"
             onClick={handlePlay}>
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setHasError(true)}
            />
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
            <button
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Play preview"
            >
              <PlayIcon className="h-6 w-6" />
            </button>
          </div>

          {/* YouTube badge */}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
              YouTube
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-neutral-400 truncate flex-1">
          {title}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 flex items-center gap-2 text-sm"
          >
            {isPlaying ? (
              <>
                <PauseIcon className="h-4 w-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                <span>Play</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};