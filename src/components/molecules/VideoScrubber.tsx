'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VideoScrubberProps {
  videoId: string;
  className?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoScrubber: React.FC<VideoScrubberProps> = ({
  videoId,
  className,
  onTimeUpdate
}) => {
  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Format time as M:SS or -M:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate remaining time
  const remainingTime = duration - currentTime;

  // Load YouTube IFrame API and create hidden player for time tracking
  useEffect(() => {
    if (!videoId) return;

    const initializePlayer = () => {
      if (!window.YT?.Player) return;

      // Create a hidden iframe just for time tracking
      const playerElement = document.createElement('div');
      document.body.appendChild(playerElement);

      try {
        const newPlayer = new window.YT.Player(playerElement, {
          width: '0',
          height: '0',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
              setIsReady(true);
              const videoDuration = event.target.getDuration();
              setDuration(videoDuration);
              onTimeUpdate?.(0, videoDuration);
            },
            onStateChange: (event: any) => {
              // Track time updates when playing
              if (event.data === window.YT.PlayerState.PLAYING) {
                const interval = setInterval(() => {
                  if (event.target && typeof event.target.getCurrentTime === 'function') {
                    const time = event.target.getCurrentTime();
                    setCurrentTime(time);
                    onTimeUpdate?.(time, duration);
                  }
                }, 100);
                
                // Store interval on player for cleanup
                event.target._timeInterval = interval;
              } else {
                // Clear interval when not playing
                if (event.target._timeInterval) {
                  clearInterval(event.target._timeInterval);
                  event.target._timeInterval = null;
                }
              }
            }
          }
        });

        setPlayer(newPlayer);
      } catch (error) {
        console.error('Failed to initialize YouTube time tracker:', error);
      }

      // Cleanup function
      return () => {
        if (playerElement.parentNode) {
          playerElement.parentNode.removeChild(playerElement);
        }
      };
    };

    // Load API if not already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
    } else if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      window.onYouTubeIframeAPIReady = initializePlayer;
    }
  }, [videoId, onTimeUpdate]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player || !duration) return;
    
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    player.seekTo(seekTime, true);
    setCurrentTime(seekTime);
    onTimeUpdate?.(seekTime, duration);
  }, [player, duration, onTimeUpdate]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3', className)}>
      <div className="flex items-center justify-between text-white text-sm mb-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(-remainingTime)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={handleSeek}
        className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-track]:bg-white/30
          [&::-webkit-slider-track]:rounded-full
          [&::-webkit-slider-track]:h-1"
        style={{
          background: `linear-gradient(to right, white 0%, white ${progress}%, rgba(255,255,255,0.3) ${progress}%, rgba(255,255,255,0.3) 100%)`
        }}
      />
    </div>
  );
};