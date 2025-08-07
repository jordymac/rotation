import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { DiscogsRelease } from '@/utils/discogs';
import { RecordCard } from '@/components/molecules';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon 
} from '@/components/atoms';

interface RecordTableProps {
  releases: DiscogsRelease[];
  isSellerMode?: boolean;
  onVerifyAudio?: (release: DiscogsRelease) => void;
  trackMatchesByRelease?: Record<number, Array<{
    trackIndex: number;
    approved?: boolean;
    candidates?: Array<{ confidence: number; }>;
  }>>;
  className?: string;
}

export const RecordTable: React.FC<RecordTableProps> = ({
  releases,
  isSellerMode = false,
  onVerifyAudio,
  trackMatchesByRelease = {},
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'year' | 'price'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort releases
  const filteredReleases = releases.filter(release => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      release.title.toLowerCase().includes(query) ||
      release.artist.toLowerCase().includes(query) ||
      release.label.toLowerCase().includes(query)
    );
  });

  const sortedReleases = [...filteredReleases].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'artist':
        aValue = a.artist;
        bValue = b.artist;
        break;
      case 'year':
        aValue = a.year;
        bValue = b.year;
        break;
      case 'price':
        aValue = parseFloat(a.price?.split(' ')[1] || '0');
        bValue = parseFloat(b.price?.split(' ')[1] || '0');
        break;
      default:
        aValue = a.title;
        bValue = b.title;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedReleases.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReleases = sortedReleases.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className={cn('', className)}>
      {/* Header Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              type="text"
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>

          {/* Sort Controls */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center text-sm text-white/70">
          <span>
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, sortedReleases.length)} of {sortedReleases.length} releases
          </span>
          
          <div className="flex items-center gap-2">
            <span>Page size:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4 mb-6">
        {paginatedReleases.map((release) => (
          <RecordCard
            key={release.id}
            release={release}
            viewMode="list"
            isSellerMode={isSellerMode}
            onVerifyAudio={onVerifyAudio}
            trackMatches={trackMatchesByRelease[release.id]}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={
                    currentPage === pageNum 
                      ? '' 
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      )}

      {paginatedReleases.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60">
            {searchQuery ? 'No releases found matching your search.' : 'No releases available.'}
          </p>
        </div>
      )}
    </div>
  );
};