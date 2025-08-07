'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { DiscogsRelease } from '@/utils/discogs';
import { FeedGrid, RecordCarousel } from '@/components/organisms';
import { PageLayout } from './PageLayout';

interface FeedTemplateProps {
  releases: DiscogsRelease[];
  currentReleaseIndex: number;
  currentTrackIndex: number;
  onReleaseChange: (index: number) => void;
  onTrackChange: (index: number) => void;
  isScrolling: boolean;
  onScroll: (direction: 'up' | 'down') => void;
  onTrackScroll: (direction: 'left' | 'right') => void;
  slideDirection: 'up' | 'down' | 'left' | 'right' | null;
  currentBgImage: string;
  nextBgImage: string;
  bgTransitioning: boolean;
  youtubeVideoId: string | null;
  audioLoading: boolean;
  cartCount: number;
  onAddToCart: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: {
    searchQuery: string;
    minPrice: string;
    maxPrice: string;
    format: string;
    condition: string;
    genre: string;
    year: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  storeInfo?: {
    id: string;
    username: string;
  };
  className?: string;
}

export const FeedTemplate: React.FC<FeedTemplateProps> = ({
  releases,
  currentReleaseIndex,
  currentTrackIndex,
  onReleaseChange,
  onTrackChange,
  isScrolling,
  onScroll,
  onTrackScroll,
  slideDirection,
  currentBgImage,
  nextBgImage,
  bgTransitioning,
  youtubeVideoId,
  audioLoading,
  cartCount,
  onAddToCart,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  onClearFilters,
  storeInfo,
  className
}) => {
  return (
    <PageLayout showFooter={false} className={className}>
      <div className="relative">
        {/* Desktop Feed */}
        <div className="hidden md:block">
          <FeedGrid
            releases={releases}
            currentReleaseIndex={currentReleaseIndex}
            currentTrackIndex={currentTrackIndex}
            onReleaseChange={onReleaseChange}
            onTrackChange={onTrackChange}
            isScrolling={isScrolling}
            onScroll={onScroll}
            onTrackScroll={onTrackScroll}
            slideDirection={slideDirection}
            currentBgImage={currentBgImage}
            nextBgImage={nextBgImage}
            bgTransitioning={bgTransitioning}
            youtubeVideoId={youtubeVideoId}
            audioLoading={audioLoading}
            cartCount={cartCount}
            onAddToCart={onAddToCart}
            showFilters={showFilters}
            onToggleFilters={onToggleFilters}
            filters={filters}
            onFiltersChange={onFiltersChange}
            onClearFilters={onClearFilters}
            storeInfo={storeInfo}
          />
        </div>

        {/* Mobile Carousel */}
        <RecordCarousel
          releases={releases}
          currentReleaseIndex={currentReleaseIndex}
          currentTrackIndex={currentTrackIndex}
          onReleaseChange={onReleaseChange}
          onTrackChange={onTrackChange}
          isScrolling={isScrolling}
          onScroll={onScroll}
          onTrackScroll={onTrackScroll}
          slideDirection={slideDirection}
          currentBgImage={currentBgImage}
          nextBgImage={nextBgImage}
          bgTransitioning={bgTransitioning}
          youtubeVideoId={youtubeVideoId}
          audioLoading={audioLoading}
          cartCount={cartCount}
          onAddToCart={onAddToCart}
          showFilters={showFilters}
          onToggleFilters={onToggleFilters}
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
          storeInfo={storeInfo}
        />
      </div>
    </PageLayout>
  );
};