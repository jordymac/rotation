import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/atoms';

interface GenresStylesTagsProps {
  genres: string[];
  styles: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const GenresStylesTags: React.FC<GenresStylesTagsProps> = ({
  genres,
  styles,
  maxVisible = 1,
  size = 'md',
  className
}) => {
  const [showGenreTooltip, setShowGenreTooltip] = useState(false);
  const [showStyleTooltip, setShowStyleTooltip] = useState(false);
  const genreTooltipRef = useRef<HTMLDivElement>(null);
  const styleTooltipRef = useRef<HTMLDivElement>(null);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-xs px-2 py-1'
  };

  // Close tooltips when clicking outside (for mobile)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genreTooltipRef.current && !genreTooltipRef.current.contains(event.target as Node)) {
        setShowGenreTooltip(false);
      }
      if (styleTooltipRef.current && !styleTooltipRef.current.contains(event.target as Node)) {
        setShowStyleTooltip(false);
      }
    }
    
    if (showGenreTooltip || showStyleTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showGenreTooltip, showStyleTooltip]);
  
  if (genres.length === 0 && styles.length === 0) {
    return <div className={cn('h-8 mb-4', className)} />;
  }
  
  return (
    <div className={cn('h-8 flex items-start relative', className)}>
      <div className="flex flex-wrap gap-1">
        {/* Show first genre + overflow */}
        {genres.length > 0 && (
          <>
            <Badge
              variant="secondary"
              className={cn('bg-blue-500/20 text-blue-200 hover:bg-blue-500/30', sizeClasses[size])}
            >
              {genres[0]}
            </Badge>
            
            {genres.length > maxVisible && (
              <div className="relative" ref={genreTooltipRef}>
                <Badge
                  variant="secondary"
                  className={cn(
                    'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 cursor-pointer',
                    sizeClasses[size]
                  )}
                  onMouseEnter={() => setShowGenreTooltip(true)}
                  onMouseLeave={() => setShowGenreTooltip(false)}
                  onClick={() => setShowGenreTooltip(!showGenreTooltip)}
                >
                  +{genres.length - maxVisible}
                </Badge>
                
                {showGenreTooltip && (
                  <div className="absolute bottom-8 left-0 z-20 bg-black/90 backdrop-blur-sm rounded-lg p-3 min-w-48 max-w-64 border border-white/20">
                    <div className="flex flex-wrap gap-1">
                      {genres.slice(maxVisible).map((genre, index) => (
                        <Badge
                          key={`tooltip-genre-${index}`}
                          variant="secondary"
                          className="bg-blue-500/20 text-blue-200"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute -bottom-1 left-3 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/20" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Show first style + overflow */}
        {styles.length > 0 && (
          <>
            <Badge
              variant="secondary"
              className={cn('bg-purple-500/20 text-purple-200 hover:bg-purple-500/30', sizeClasses[size])}
            >
              {styles[0]}
            </Badge>
            
            {styles.length > maxVisible && (
              <div className="relative" ref={styleTooltipRef}>
                <Badge
                  variant="secondary"
                  className={cn(
                    'bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 cursor-pointer',
                    sizeClasses[size]
                  )}
                  onMouseEnter={() => setShowStyleTooltip(true)}
                  onMouseLeave={() => setShowStyleTooltip(false)}
                  onClick={() => setShowStyleTooltip(!showStyleTooltip)}
                >
                  +{styles.length - maxVisible}
                </Badge>
                
                {showStyleTooltip && (
                  <div className="absolute bottom-8 left-0 z-20 bg-black/90 backdrop-blur-sm rounded-lg p-3 min-w-48 max-w-64 border border-white/20">
                    <div className="flex flex-wrap gap-1">
                      {styles.slice(maxVisible).map((style, index) => (
                        <Badge
                          key={`tooltip-style-${index}`}
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-200"
                        >
                          {style}
                        </Badge>
                      ))}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute -bottom-1 left-3 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/20" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};