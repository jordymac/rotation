'use client';

import { useState, useEffect } from 'react';

interface AudioMatch {
  platform: string;
  match_url: string;
  confidence: number;
  approved: boolean;
  verified_by?: string;
  verified_at?: Date;
  source: 'cache' | 'database' | 'computed';
}

interface UseAudioMatchOptions {
  enabled?: boolean;
}

export function useAudioMatch(
  releaseId: number | string,
  trackIndex: number,
  releaseTitle?: string,
  releaseArtist?: string,
  trackTitle?: string,
  options: UseAudioMatchOptions = {}
) {
  const [audioMatch, setAudioMatch] = useState<AudioMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { enabled = true } = options;

  console.log('🎵 useAudioMatch hook called:', {
    releaseId,
    trackIndex,
    releaseTitle,
    releaseArtist,
    trackTitle,
    enabled
  });

  useEffect(() => {
    console.log('🎵 useAudioMatch useEffect triggered. Checking conditions:', {
      enabled,
      releaseId: !!releaseId,
      trackIndexValid: trackIndex >= 0,
      releaseTitle: !!releaseTitle,
      releaseArtist: !!releaseArtist,
      trackTitle: !!trackTitle
    });

    if (!enabled || !releaseId || trackIndex < 0 || !releaseTitle || !releaseArtist || !trackTitle) {
      console.log('🎵 useAudioMatch: Conditions not met, skipping fetch');
      return;
    }

    console.log('🎵 useAudioMatch: All conditions met, starting fetch...');

    let cancelled = false;

    const fetchAudioMatch = async () => {
      setLoading(true);
      setError(null);

      console.log('useAudioMatch: Fetching audio match for:', {
        releaseId,
        trackIndex,
        releaseTitle,
        releaseArtist,
        trackTitle
      });

      try {
        const requestBody = {
          trackIndex,
          releaseTitle,
          releaseArtist,
          trackInfo: {
            position: `${trackIndex + 1}`,
            title: trackTitle,
            duration: '3:30', // Default duration
            artists: []
          }
        };

        console.log('useAudioMatch: Request body:', requestBody);

        const response = await fetch(`/api/admin/releases/${releaseId}/audio-match`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (cancelled) return;

        console.log('useAudioMatch: Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('useAudioMatch: Response error:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        if (!text.trim()) {
          throw new Error('Empty response from audio match API');
        }
        
        const data = JSON.parse(text);
        console.log('useAudioMatch: Response data:', data);
        
        if (cancelled) return;

        if (data.success && data.match && data.match.platform !== 'none') {
          console.log('useAudioMatch: Found match:', data.match);
          setAudioMatch(data.match);
        } else {
          console.log('useAudioMatch: No match found or no audio available');
          setAudioMatch(null);
        }
      } catch (err) {
        if (cancelled) return;
        
        console.error('Failed to fetch audio match:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch audio match');
        setAudioMatch(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAudioMatch();

    return () => {
      cancelled = true;
    };
  }, [enabled, releaseId, trackIndex, releaseTitle, releaseArtist, trackTitle]);

  // Extract YouTube video ID from match URL (only YouTube supported)
  const youtubeVideoId = audioMatch?.platform === 'youtube' && audioMatch?.match_url
    ? extractYouTubeVideoId(audioMatch.match_url)
    : null;
    
  console.log('🎵 YouTube video extraction:', {
    platform: audioMatch?.platform,
    match_url: audioMatch?.match_url,
    extractedVideoId: youtubeVideoId
  });

  return {
    audioMatch,
    youtubeVideoId,
    loading,
    error,
    hasAudio: !!audioMatch && audioMatch.approved,
    confidence: audioMatch?.confidence || 0
  };
}

function extractYouTubeVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}