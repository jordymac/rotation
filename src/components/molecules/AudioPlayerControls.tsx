'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Slider } from '@/components/atoms';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@/components/atoms';

interface AudioPlayerControlsProps {
  videoId: string;
  autoplay?: boolean;
  onError?: (error: any) => void;
  className?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  videoId,
  autoplay = false,
  onError,
  className = ''
}) => {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [videoId]);

  const initializePlayer = useCallback(() => {
    if (!playerRef.current || !window.YT?.Player) return;

    try {
      const newPlayer = new window.YT.Player(playerRef.current, {
        width: '0',
        height: '0',
        videoId: videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
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
            event.target.setVolume(volume);
            setDuration(event.target.getDuration());
            
            if (autoplay) {
              event.target.mute();
              setIsMuted(true);
            }
          },
          onStateChange: (event: any) => {
            const playerState = event.data;
            setIsPlaying(playerState === window.YT.PlayerState.PLAYING);
            
            if (playerState === window.YT.PlayerState.PLAYING) {
              startTimeUpdate();
            } else {
              stopTimeUpdate();
            }
            
            if (playerState === window.YT.PlayerState.ENDED) {
              setCurrentTime(0);
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
            onError?.(event.data);
          }
        }
      });

      setPlayer(newPlayer);
    } catch (error) {
      console.error('Failed to initialize YouTube player:', error);
      onError?.(error);
    }
  }, [videoId, autoplay, volume, onError]);

  const startTimeUpdate = useCallback(() => {
    if (timeUpdateInterval.current) return;
    
    timeUpdateInterval.current = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        requestAnimationFrame(() => {
          setCurrentTime(player.getCurrentTime());
        });
      }
    }, 100);
  }, [player]);

  const stopTimeUpdate = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
      timeUpdateInterval.current = null;
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      }
      player.playVideo();
    }
  }, [player, isPlaying, isMuted]);

  const handleSeek = useCallback((value: number[]) => {
    if (!player || !duration) return;
    const seekTime = (value[0] / 100) * duration;
    player.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  }, [player, duration]);

  const handleVolumeChange = useCallback((value: number[]) => {
    if (!player) return;
    const newVolume = value[0];
    setVolume(newVolume);
    player.setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [player, isMuted]);

  const toggleMute = useCallback(() => {
    if (!player) return;
    
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }, [player, isMuted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isReady) {
    return (
      <div className={`bg-white/10 rounded-lg p-3 backdrop-blur-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white/60 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>Loading...</span>
              <span>--:--</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full">
              <div className="h-full w-0 bg-white/60 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/10 rounded-lg p-3 backdrop-blur-sm ${className}`}>
      {/* Hidden YouTube player */}
      <div ref={playerRef} style={{ display: 'none' }} />
      
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
        >
          {isPlaying ? (
            <PauseIcon className="w-4 h-4" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
        </Button>

        {/* Progress Section */}
        <div className="flex-1">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Progress Slider */}
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full cursor-pointer"
          />
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="w-4 h-4" />
            ) : (
              <SpeakerWaveIcon className="w-4 h-4" />
            )}
          </Button>
          
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-16 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};