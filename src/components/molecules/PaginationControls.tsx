import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/atoms';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPreviousNext?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  disabled?: boolean;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPreviousNext = true,
  showPageNumbers = true,
  maxPageNumbers = 5,
  disabled = false,
  className
}) => {
  const getVisiblePages = () => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPageNumbers / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPageNumbers - 1);

    if (end - start + 1 < maxPageNumbers) {
      start = Math.max(1, end - maxPageNumbers + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Previous Button */}
      {showPreviousNext && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
      )}

      {/* Page Numbers */}
      {showPageNumbers && (
        <>
          {/* First page indicator */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={disabled}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <span className="text-white/50 px-2">...</span>
              )}
            </>
          )}

          {/* Visible page numbers */}
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={disabled}
              className={
                currentPage === page
                  ? ''
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }
            >
              {page}
            </Button>
          ))}

          {/* Last page indicator */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="text-white/50 px-2">...</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={disabled}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {totalPages}
              </Button>
            </>
          )}
        </>
      )}

      {/* Next Button */}
      {showPreviousNext && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};