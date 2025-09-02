'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DiscogsRelease } from '@/utils/discogs';

interface LightRelease {
  id: number;
  title: string;
  artist: string;
  year?: number;
  label?: string;
  catno?: string;
  thumb?: string;
  price?: string;
  condition?: string;
  uri?: string;
  listingUri?: string;
  genre?: string[];
  trackCount?: number;
  hasAudioMatches?: boolean;
}

interface UseTwoStageLoadingOptions {
  storeId?: string;
  initialLimit?: number;
  enabled?: boolean;
}

export function useTwoStageLoading({
  storeId,
  initialLimit = 20,
  enabled = true
}: UseTwoStageLoadingOptions = {}) {
  const [lightReleases, setLightReleases] = useState<LightRelease[]>([]);
  const [fullReleases, setFullReleases] = useState<Map<number, DiscogsRelease>>(new Map());
  const [isLoadingLight, setIsLoadingLight] = useState(false);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>('0');
  const [totalCount, setTotalCount] = useState(0);
  
  const loadingFullRef = useRef<Set<number>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef<Record<string, Promise<any>>>({});

  console.log('🚀 useTwoStageLoading hook initialized:', {
    storeId,
    initialLimit,
    enabled,
    lightCount: lightReleases.length,
    fullCount: fullReleases.size
  });

  // Stage 1: Load light data (fast)
  const loadLightData = useCallback(async (cursor: string = '0', limit: number = initialLimit) => {
    if (!enabled) return;

    const cacheKey = `light:${storeId || 'general'}:${cursor}:${limit}`;
    
    // Check if request is already in flight
    if (inFlightRef.current[cacheKey]) {
      console.log('🔄 Light data request already in flight, waiting...');
      return inFlightRef.current[cacheKey];
    }

    setIsLoadingLight(true);
    setError(null);

    const fetchPromise = (async () => {
      try {
        const params = new URLSearchParams({
          cursor,
          limit: limit.toString()
        });
        
        if (storeId) {
          params.set('store', storeId);
        }

        const response = await fetch(`/api/feed/light?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        console.warn('🚨 Empty response from light API, using fallback');
        setLightReleases([]);
        setHasNextPage(false);
        setNextCursor(null);
        setTotalCount(0);
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🚨 JSON Parse Error in light API:', parseError);
        console.error('🚨 Response text:', responseText.substring(0, 200) + '...');
        throw new Error(`Failed to parse light API response: ${parseError.message}`);
      }
      
      console.log('🔥 Stage 1 (Light) loaded:', {
        count: data.results?.length || 0,
        cursor,
        hasNext: data.pagination?.hasNext
      });

      if (cursor === '0') {
        // Initial load - replace data
        setLightReleases(data.results || []);
      } else {
        // Pagination - append data
        setLightReleases(prev => [...prev, ...(data.results || [])]);
      }

      setHasNextPage(data.pagination?.hasNext || false);
      setNextCursor(data.pagination?.nextCursor || null);
      setTotalCount(data.pagination?.total || 0);

      } catch (err) {
        console.error('Failed to load light data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load light data');
        throw err;
      } finally {
        setIsLoadingLight(false);
      }
    })();

    // Store the promise to prevent duplicates
    inFlightRef.current[cacheKey] = fetchPromise;
    
    try {
      await fetchPromise;
    } finally {
      // Clean up the in-flight reference
      delete inFlightRef.current[cacheKey];
    }
  }, [enabled, storeId, initialLimit]);

  // Stage 2: Load full data for specific release (heavy)
  const loadFullData = useCallback(async (releaseId: number): Promise<DiscogsRelease | null> => {
    if (!enabled) {
      return fullReleases.get(releaseId) || null;
    }

    // Check if we already have full data
    if (fullReleases.has(releaseId)) {
      return fullReleases.get(releaseId) || null;
    }

    // Check if already loading this release
    if (loadingFullRef.current.has(releaseId)) {
      return fullReleases.get(releaseId) || null;
    }

    const cacheKey = `full:${storeId || 'general'}:${releaseId}`;
    
    // Check if request is already in flight
    if (inFlightRef.current[cacheKey]) {
      console.log(`🔄 Full data request already in flight for release ${releaseId}, waiting...`);
      return inFlightRef.current[cacheKey];
    }

    loadingFullRef.current.add(releaseId);
    setIsLoadingFull(true);

    const fetchPromise = (async () => {
      try {
        const params = new URLSearchParams();
        if (storeId) {
          params.set('store', storeId);
        }

        const response = await fetch(`/api/feed/${releaseId}?${params}`, {
          signal: abortControllerRef.current?.signal
        });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        console.warn(`🚨 Empty response from full API for release ${releaseId}`);
        return null;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`🚨 JSON Parse Error in full API for release ${releaseId}:`, parseError);
        console.error('🚨 Response text:', responseText.substring(0, 200) + '...');
        return null;
      }
      
      console.log('💾 Stage 2 (Full) loaded for release:', releaseId, {
        tracks: data.release?.tracks?.length || 0,
        audioMatches: data.release?.audioMatches?.length || 0
      });

      if (data.release) {
        setFullReleases(prev => new Map(prev.set(releaseId, data.release)));
        return data.release;
      }

      return null;

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Full data load aborted for release:', releaseId);
          return null;
        }
        
        console.error(`Failed to load full data for release ${releaseId}:`, err);
        return null;
      } finally {
        loadingFullRef.current.delete(releaseId);
        setIsLoadingFull(loadingFullRef.current.size > 0);
      }
    })();

    // Store the promise to prevent duplicates
    inFlightRef.current[cacheKey] = fetchPromise;
    
    try {
      return await fetchPromise;
    } finally {
      // Clean up the in-flight reference
      delete inFlightRef.current[cacheKey];
    }
  }, [enabled, storeId, fullReleases]);

  // Get merged release data (light + full where available)
  const getMergedReleases = useCallback((): DiscogsRelease[] => {
    return lightReleases.map(lightRelease => {
      const fullRelease = fullReleases.get(lightRelease.id);
      
      if (fullRelease) {
        // Return full data
        return fullRelease;
      } else {
        // Return light data with empty tracks/audioMatches
        return {
          ...lightRelease,
          tracks: [],
          audioMatches: []
        } as DiscogsRelease;
      }
    });
  }, [lightReleases, fullReleases]);

  // Load more light data (pagination)
  const loadMoreLight = useCallback(() => {
    if (hasNextPage && nextCursor && !isLoadingLight) {
      loadLightData(nextCursor, initialLimit);
    }
  }, [hasNextPage, nextCursor, isLoadingLight, loadLightData, initialLimit]);

  // Initial load
  useEffect(() => {
    if (enabled) {
      loadLightData('0', initialLimit);
    }

    // Setup abort controller for cleanup
    abortControllerRef.current = new AbortController();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [enabled, storeId]); // Re-load when storeId changes

  return {
    // Data
    lightReleases,
    fullReleases,
    mergedReleases: getMergedReleases(),
    totalCount,
    
    // Loading states
    isLoadingLight,
    isLoadingFull,
    isLoadingAny: isLoadingLight || isLoadingFull,
    
    // Pagination
    hasNextPage,
    loadMoreLight,
    
    // Individual release loading
    loadFullData,
    hasFullData: (releaseId: number) => fullReleases.has(releaseId),
    
    // Error state
    error,
    
    // Stats
    stats: {
      lightCount: lightReleases.length,
      fullCount: fullReleases.size,
      loadingFullCount: loadingFullRef.current.size
    }
  };
}