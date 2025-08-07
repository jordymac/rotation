'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface YouTubeAudioPlayerProps {
  videoId: string;
  className?: string;
  onReady?: () => void;
  onError?: (error: any) => void;
  autoplay?: boolean;
}

interface YouTubePlayer {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
  destroy: () => void;
}

// YouTube Player States
const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};

// Global flag to track if YouTube API is loaded
let youTubeAPILoaded = false;
let youTubeAPILoading = false;

export default function YouTubeAudioPlayer({ 
  videoId, 
  className = '', 
  onReady, 
  onError,
  autoplay = true 
}: YouTubeAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const animationFrameRef = useRef<number | undefined>();
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load YouTube IFrame API
  const loadYouTubeAPI = useCallback(() => {
    if (youTubeAPILoaded || youTubeAPILoading) return;
    
    youTubeAPILoading = true;
    
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    
    // YouTube API callback
    (window as any).onYouTubeIframeAPIReady = () => {
      youTubeAPILoaded = true;
      youTubeAPILoading = false;
      
      // Trigger a custom event for all waiting players
      window.dispatchEvent(new CustomEvent('youtubeAPIReady'));
    };
    
    document.head.appendChild(script);
  }, []);

  // Initialize player when API is ready and component is visible
  const initializePlayer = useCallback(() => {
    if (!isVisible || !youTubeAPILoaded || !containerRef.current || playerRef.current) {
      return;
    }

    try {
      // Create hidden iframe container
      const iframeContainer = document.createElement('div');
      iframeContainer.style.width = '0';
      iframeContainer.style.height = '0';
      iframeContainer.style.position = 'absolute';
      iframeContainer.style.left = '-9999px';
      containerRef.current.appendChild(iframeContainer);

      console.log('Initializing YouTube player with video ID:', videoId);
      
      playerRef.current = new (window as any).YT.Player(iframeContainer, {
        width: 0,
        height: 0,
        videoId: videoId,
        playerVars: {
          autoplay: 0, // Always start paused to avoid autoplay issues
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready for video:', videoId);
            console.log('Setting playerReady to true');
            setPlayerReady(true);
            
            // Always start muted to satisfy autoplay policies
            event.target.mute();
            setIsMuted(true);
            
            // Set initial volume for when user unmutes
            event.target.setVolume(volume);
            setDuration(event.target.getDuration());
            
            onReady?.();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            const player = event.target;
            
            console.log('YouTube player state changed:', state);
            setIsPlaying(state === YT_PLAYER_STATE.PLAYING);
            
            // Update duration and current time when video state changes
            if (state === YT_PLAYER_STATE.PLAYING || state === YT_PLAYER_STATE.PAUSED || state === YT_PLAYER_STATE.BUFFERING) {
              const videoDuration = player.getDuration();
              const currentTime = player.getCurrentTime();
              
              if (videoDuration && videoDuration > 0) {
                setDuration(videoDuration);
              }
              if (currentTime >= 0) {
                setCurrentTime(currentTime);
              }
            }
            
            if (state === YT_PLAYER_STATE.PLAYING) {
              console.log('Player is playing - starting time sync');
              // Small delay to ensure player is fully ready
              setTimeout(() => {
                startTimeSync();
              }, 100);
            } else if (state === YT_PLAYER_STATE.PAUSED || state === YT_PLAYER_STATE.BUFFERING) {
              console.log('Player paused/buffering - stopping time sync');
              stopTimeSync();
              // Update time once more when paused
              setTimeout(() => {
                if (playerRef.current) {
                  const currentTime = playerRef.current.getCurrentTime();
                  console.log('Setting time on pause:', currentTime);
                  setCurrentTime(currentTime);
                }
              }, 50);
            } else {
              console.log('Player other state - stopping time sync');
              stopTimeSync();
            }
            
            if (state === YT_PLAYER_STATE.ENDED) {
              setCurrentTime(0);
              stopTimeSync();
            }
          },
          onError: (event: any) => {
            const errorCode = event.data;
            let errorMessage = 'Unknown error';
            
            switch (errorCode) {
              case 2:
                errorMessage = 'Invalid video ID';
                break;
              case 5:
                errorMessage = 'HTML5 player error';
                break;
              case 100:
                errorMessage = 'Video not found or private';
                break;
              case 101:
              case 150:
                errorMessage = 'Video embedding disabled';
                break;
            }
            
            console.error('YouTube player error:', errorCode, errorMessage);
            setError(errorMessage);
            onError?.(errorMessage);
          }
        }
      });
    } catch (err) {
      console.error('Failed to initialize YouTube player:', err);
      setError('Failed to initialize player');
      onError?.(err);
    }
  }, [isVisible, videoId, autoplay, volume, onReady, onError]);

  // Time synchronization using requestAnimationFrame
  const startTimeSync = useCallback(() => {
    console.log('Starting time sync...');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    const updateTime = () => {
      if (playerRef.current) {
        try {
          const currentPlayerTime = playerRef.current.getCurrentTime();
          const playerState = playerRef.current.getPlayerState();
          
          console.log('RAF Update - Time:', currentPlayerTime, 'State:', playerState);
          setCurrentTime(currentPlayerTime);
          
          // Continue if player is still playing (check actual player state, not React state)
          if (playerState === YT_PLAYER_STATE.PLAYING) {
            animationFrameRef.current = requestAnimationFrame(updateTime);
          } else {
            console.log('RAF loop ended - player state:', playerState);
          }
        } catch (error) {
          console.warn('Error updating time:', error);
          // If there's an error, the player might not be ready yet, so stop the loop
        }
      } else {
        console.log('Cannot update time - no playerRef');
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [playerReady]);

  const stopTimeSync = useCallback(() => {
    console.log('Stopping time sync');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px' // Load when 200px from viewport
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load API when component becomes visible
  useEffect(() => {
    if (isVisible && !youTubeAPILoaded && !youTubeAPILoading) {
      loadYouTubeAPI();
    }
  }, [isVisible, loadYouTubeAPI]);

  // Initialize player when API loads
  useEffect(() => {
    if (youTubeAPILoaded) {
      initializePlayer();
    } else {
      const handleAPIReady = () => {
        initializePlayer();
      };
      
      window.addEventListener('youtubeAPIReady', handleAPIReady);
      return () => window.removeEventListener('youtubeAPIReady', handleAPIReady);
    }
  }, [initializePlayer]);

  // Don't use useEffect for time sync - let the YouTube player events handle it

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimeSync();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.warn('Error destroying YouTube player:', err);
        }
        playerRef.current = null;
      }
    };
  }, [stopTimeSync]);

  // Control functions
  const play = useCallback(() => {
    if (playerRef.current && playerReady) {
      // Ensure muted for autoplay compliance
      if (isMuted) {
        playerRef.current.mute();
      }
      playerRef.current.playVideo();
    }
  }, [playerReady, isMuted]);

  const pause = useCallback(() => {
    if (playerRef.current && playerReady) {
      playerRef.current.pauseVideo();
    }
  }, [playerReady]);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && playerReady) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
      
      // Restart time sync if player is playing
      const playerState = playerRef.current.getPlayerState();
      if (playerState === YT_PLAYER_STATE.PLAYING) {
        startTimeSync();
      }
    }
  }, [playerReady, startTimeSync]);

  const setVolume = useCallback((vol: number) => {
    const clampedVolume = Math.max(0, Math.min(100, vol));
    setVolumeState(clampedVolume);
    
    if (playerRef.current && playerReady) {
      playerRef.current.setVolume(clampedVolume);
      
      if (clampedVolume > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  }, [playerReady, isMuted]);

  const toggleMute = useCallback(() => {
    if (playerRef.current && playerReady) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  }, [playerReady, isMuted]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle scrub bar interaction
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerReady || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    seekTo(newTime);
  };

  if (error) {
    return (
      <div ref={containerRef} className={`youtube-audio-player error ${className}`}>
        <div className="bg-red-500/20 rounded-lg p-3 text-red-200 text-sm">
          Audio unavailable: {error}
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return (
      <div ref={containerRef} className={`youtube-audio-player placeholder ${className}`}>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white/60 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>--:--</span>
                <span>--:--</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full">
                <div className="h-full w-0 bg-white/60 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`youtube-audio-player ${className}`}>
      <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={isPlaying ? pause : play}
            disabled={!playerReady}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Progress and Controls */}
          <div className="flex-1">
            {/* Time Labels */}
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            {/* Progress Bar */}
            <div 
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full transition-all group-hover:bg-white/90"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              disabled={!playerReady}
              className="p-1 text-white/80 hover:text-white disabled:opacity-50 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : volume < 50 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              disabled={!playerReady}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none slider disabled:opacity-50"
              style={{
                background: `linear-gradient(to right, white 0%, white ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}