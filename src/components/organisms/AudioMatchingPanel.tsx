import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { DiscogsRelease } from '@/utils/discogs';
import { 
  Card, 
  Button, 
  Badge, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  H3,
  P
} from '@/components/atoms';
import { 
  CheckIcon, 
  XMarkIcon, 
  MusicalNoteIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon
} from '@/components/atoms';

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

interface AudioMatchingPanelProps {
  release: DiscogsRelease;
  matches: TrackMatch[];
  onApproveMatch: (trackIndex: number, candidateId: string) => void;
  onRejectMatch: (trackIndex: number, candidateId: string) => void;
  onPlayPreview: (url: string) => void;
  currentlyPlaying?: string;
  className?: string;
}

export const AudioMatchingPanel: React.FC<AudioMatchingPanelProps> = ({
  release,
  matches,
  onApproveMatch,
  onRejectMatch,
  onPlayPreview,
  currentlyPlaying,
  className
}) => {
  const [selectedTrack, setSelectedTrack] = useState(0);

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
    <div className={cn('', className)}>
      <div className="mb-6">
        <H3 className="text-white mb-2">Audio Matching</H3>
        <P className="text-white/70 mt-0">
          Review and approve audio matches for {release.artist} - {release.title}
        </P>
      </div>

      <Tabs value={selectedTrack.toString()} onValueChange={(value) => setSelectedTrack(parseInt(value))}>
        {/* Track Tabs */}
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 bg-white/10">
          {matches.map((match, index) => (
            <TabsTrigger
              key={index}
              value={index.toString()}
              className="data-[state=active]:bg-white/20 text-white"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">{match.trackPosition}</span>
                {match.approved && <CheckIcon className="w-3 h-3 text-green-400" />}
                {match.bestMatch && !match.approved && (
                  <ExclamationTriangleIcon className="w-3 h-3 text-yellow-400" />
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Track Content */}
        {matches.map((match, index) => (
          <TabsContent key={index} value={index.toString()} className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
              <div className="mb-4">
                <H3 className="text-white text-lg mb-1">
                  {match.trackPosition}. {match.trackTitle}
                </H3>
                <P className="text-white/70 mt-0">
                  {match.candidates.length} candidate{match.candidates.length !== 1 ? 's' : ''} found
                </P>
              </div>

              {match.candidates.length === 0 ? (
                <div className="text-center py-8">
                  <MusicalNoteIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <P className="text-white/60 mt-0">No audio matches found for this track</P>
                </div>
              ) : (
                <div className="space-y-4">
                  {match.candidates.map((candidate, candidateIndex) => (
                    <Card
                      key={candidateIndex}
                      className={cn(
                        'bg-white/5 border-white/10 p-4 transition-all',
                        match.bestMatch?.id === candidate.id && 'ring-2 ring-blue-500/50'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Play Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onPlayPreview(candidate.url)}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                        >
                          {currentlyPlaying === candidate.url ? (
                            <PauseIcon className="w-4 h-4" />
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                        </Button>

                        {/* Match Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0 flex-1">
                              <H3 className="text-white text-sm font-medium truncate mb-1">
                                {candidate.title}
                              </H3>
                              <P className="text-white/70 text-sm truncate mt-0">
                                {candidate.artist}
                              </P>
                            </div>
                            
                            <div className="flex gap-2 ml-4 flex-shrink-0">
                              <Badge className={getConfidenceColor(candidate.classification)}>
                                {candidate.confidence}%
                              </Badge>
                              <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">
                                {getSourceIcon(candidate.source)} {candidate.platform}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-white/60">
                              Duration: {Math.floor(candidate.duration / 60)}:{(candidate.duration % 60).toString().padStart(2, '0')}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRejectMatch(match.trackIndex, candidate.id)}
                                className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30"
                              >
                                <XMarkIcon className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onApproveMatch(match.trackIndex, candidate.id)}
                                className="bg-green-500/20 border-green-500/30 text-green-200 hover:bg-green-500/30"
                              >
                                <CheckIcon className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};