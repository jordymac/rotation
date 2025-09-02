'use client';

import React, { useMemo } from 'react';
import { DiscogsRelease } from '@/utils/discogs';

interface FeedWindowProps {
  releases: DiscogsRelease[];
  currentReleaseIndex: number;
  windowSize?: number;
  children: (windowedReleases: DiscogsRelease[], adjustedIndex: number) => React.ReactNode;
}

export const FeedWindow: React.FC<FeedWindowProps> = ({
  releases,
  currentReleaseIndex,
  windowSize = 3,
  children
}) => {
  // Calculate the windowed releases and adjusted index
  const { windowedReleases, adjustedIndex } = useMemo(() => {
    if (releases.length === 0) {
      return { windowedReleases: [], adjustedIndex: 0 };
    }

    // Ensure current index is within bounds
    const safeCurrentIndex = Math.max(0, Math.min(currentReleaseIndex, releases.length - 1));
    
    // Calculate window boundaries
    const halfWindow = Math.floor(windowSize / 2);
    let startIndex = safeCurrentIndex - halfWindow;
    let endIndex = safeCurrentIndex + halfWindow + 1;
    
    // Adjust window boundaries to stay within array bounds
    if (startIndex < 0) {
      endIndex = Math.min(endIndex - startIndex, releases.length);
      startIndex = 0;
    }
    
    if (endIndex > releases.length) {
      startIndex = Math.max(0, startIndex - (endIndex - releases.length));
      endIndex = releases.length;
    }
    
    // Extract the windowed slice
    const windowedReleases = releases.slice(startIndex, endIndex);
    
    // Calculate the adjusted index within the window
    const adjustedIndex = safeCurrentIndex - startIndex;
    
    return { windowedReleases, adjustedIndex };
  }, [releases, currentReleaseIndex, windowSize]);

  console.log('🪟 FeedWindow:', {
    totalReleases: releases.length,
    currentReleaseIndex,
    windowedCount: windowedReleases.length,
    adjustedIndex,
    windowSize
  });

  return (
    <>
      {children(windowedReleases, adjustedIndex)}
    </>
  );
};