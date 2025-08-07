import React from 'react';
import { cn } from '@/lib/utils';
import { Button, P } from '@/components/atoms';
import { PlayIcon, PauseIcon } from '@/components/atoms';

interface Track {
  position: string;
  title: string;
  duration?: string;
}

interface TrackRowProps {
  track: Track;
  index: number;
  isPlaying?: boolean;
  isActive?: boolean;
  onPlay?: () => void;
  onSelect?: () => void;
  showDuration?: boolean;
  className?: string;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  isPlaying = false,
  isActive = false,
  onPlay,
  onSelect,
  showDuration = true,
  className
}) => {
  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer',
        isActive 
          ? 'bg-white/20 text-white' 
          : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
        className
      )}
      onClick={onSelect}
    >
      {/* Play Button */}
      {onPlay && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex-shrink-0"
        >
          {isPlaying ? (
            <PauseIcon className="w-3 h-3" />
          ) : (
            <PlayIcon className="w-3 h-3" />
          )}
        </Button>
      )}

      {/* Track Position */}
      <div className="w-8 text-center text-sm font-mono text-white/60 flex-shrink-0">
        {track.position}
      </div>

      {/* Track Title */}
      <div className="flex-1 min-w-0">
        <P className="text-sm truncate mt-0">
          {track.title}
        </P>
      </div>

      {/* Duration */}
      {showDuration && track.duration && (
        <div className="text-sm text-white/60 font-mono flex-shrink-0">
          {track.duration}
        </div>
      )}
    </div>
  );
};