import React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@/components/atoms';

interface AudioMatch {
  id: string;
  title: string;
  artist: string;
  platform: 'youtube' | 'soundcloud';
  confidence: number;
  classification: 'high' | 'medium' | 'low';
  source: 'discogs_embedded' | 'youtube_search';
  url: string;
}

interface MatchDropdownProps {
  matches: AudioMatch[];
  selectedMatch?: string;
  onMatchChange: (matchId: string) => void;
  placeholder?: string;
  showConfidence?: boolean;
  className?: string;
}

export const MatchDropdown: React.FC<MatchDropdownProps> = ({
  matches,
  selectedMatch,
  onMatchChange,
  placeholder = "Select audio match...",
  showConfidence = true,
  className
}) => {
  const getConfidenceColor = (classification: string) => {
    switch (classification) {
      case 'high': return 'bg-green-500/20 text-green-200';
      case 'medium': return 'bg-yellow-500/20 text-yellow-200';
      case 'low': return 'bg-red-500/20 text-red-200';
      default: return 'bg-gray-500/20 text-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'discogs_embedded': return '🎵';
      case 'youtube_search': return '🔍';
      default: return '❓';
    }
  };

  return (
    <Select value={selectedMatch} onValueChange={onMatchChange}>
      <SelectTrigger className={cn('bg-white/10 border-white/20 text-white', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {matches.map((match) => (
          <SelectItem key={match.id} value={match.id}>
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex-1 min-w-0 mr-2">
                <div className="font-medium truncate">
                  {match.title}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {match.artist} • {match.platform}
                </div>
              </div>
              
              {showConfidence && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs">
                    {getSourceIcon(match.source)}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={cn('text-xs', getConfidenceColor(match.classification))}
                  >
                    {match.confidence}%
                  </Badge>
                </div>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};