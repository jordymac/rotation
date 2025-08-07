import React from 'react';
import { cn } from '@/lib/utils';
import { TrackStatus } from '@/components/atoms';

interface Track {
  title: string;
  position: string;
  duration?: string;
}

interface TrackMatch {
  trackIndex: number;
  trackTitle: string;
  trackPosition: string;
  candidates: Array<{
    platform: 'youtube' | 'soundcloud';
    id: string;
    title: string;
    artist: string;
    duration: number;
    url: string;
    confidence: number;
    classification: 'high' | 'medium' | 'low';
    source: 'discogs_embedded' | 'youtube_search';
  }>;
  bestMatch: any;
  approved?: boolean;
}

interface TrackListItemProps {
  track: Track;
  trackIndex: number;
  trackMatch?: TrackMatch;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TrackListItem: React.FC<TrackListItemProps> = ({
  track,
  trackIndex,
  trackMatch,
  isSelected = false,
  onClick,
  className
}) => {
  const getTrackStatus = () => {
    if (!trackMatch) return 'pending';
    if (trackMatch.approved) return 'approved';
    if (trackMatch.candidates.length > 0) return 'matched';
    return 'no-match';
  };

  return (
    <div 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:bg-white/10 border-b border-white/10 last:border-b-0',
        isSelected ? 'bg-white/15' : '',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 px-3 py-2">
        {/* Track Position */}
        <div className="flex-shrink-0 w-6 text-xs font-medium text-white/60 text-center">
          {track.position}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "text-sm font-medium truncate transition-colors",
            isSelected ? 'text-white' : 'text-white/80'
          )}>
            {track.title}
          </div>
          
          {/* Duration and match info in same line */}
          <div className="flex items-center gap-2 text-xs text-white/50">
            {track.duration && <span>{track.duration}</span>}
            {trackMatch && trackMatch.candidates.length > 0 && (
              <>
                <span>•</span>
                <span>{trackMatch.candidates.length} match{trackMatch.candidates.length !== 1 ? 'es' : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* Match Status */}
        <div className="flex-shrink-0">
          <TrackStatus 
            status={getTrackStatus()}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};