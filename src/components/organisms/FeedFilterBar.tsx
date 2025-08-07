import React from 'react';
import { cn } from '@/lib/utils';
import { H2, Button } from '@/components/atoms';
import { SearchFilters } from '@/components/molecules';
import { ArrowLeftIcon } from '@/components/atoms';

interface FeedFilterBarProps {
  storeInfo?: {
    id: string;
    username: string;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    minPrice: string;
    maxPrice: string;
    format: string;
    condition: string;
    genre: string;
    year: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  resultsCount: number;
  totalCount: number;
  className?: string;
}

export const FeedFilterBar: React.FC<FeedFilterBarProps> = ({
  storeInfo,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  resultsCount,
  totalCount,
  className
}) => {
  return (
    <div className={cn('', className)}>
      <div className="mb-6">
        <H2 className="text-white mb-2 border-0 pb-0">Filters</H2>
        {storeInfo && (
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm text-white/80">
            {storeInfo.id === 'general-feed' ? 'Curated Feed' : storeInfo.username}
          </span>
        )}
      </div>

      {/* Go Back to Stores */}
      <div className="pb-4 border-b border-white/20 mb-4">
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/stores'}
          className="w-full justify-start gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>All Stores</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <SearchFilters
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        filters={filters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
      />

      {/* Results Count */}
      <div className="text-center text-white/60 text-sm mt-6 pt-4 border-t border-white/20">
        Showing {resultsCount} of {totalCount} releases
      </div>
    </div>
  );
};