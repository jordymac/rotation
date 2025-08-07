import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose,
  Button,
  H2
} from '@/components/atoms';
import { TrackListItem, AudioMatchCandidate } from '@/components/molecules';
import { DiscogsRelease } from '@/utils/discogs';
import { XMarkIcon } from '@/components/atoms';

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
    approved?: boolean;
  }>;
  bestMatch: any;
  approved?: boolean;
}

interface AudioMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: DiscogsRelease;
  trackMatches: TrackMatch[];
  onApproveMatch: (trackIndex: number, candidateId: string) => void;
  onRejectMatch: (trackIndex: number, candidateId: string) => void;
  onProvideCorrectVideo?: (trackIndex: number, candidateId: string, newUrl: string) => void;
  className?: string;
}

export const AudioMatchingModal: React.FC<AudioMatchingModalProps> = ({
  isOpen,
  onClose,
  release,
  trackMatches,
  onApproveMatch,
  onRejectMatch,
  onProvideCorrectVideo,
  className
}) => {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);

  const selectedTrackMatch = trackMatches.find(match => match.trackIndex === selectedTrackIndex);
  const selectedTrack = release.tracks?.[selectedTrackIndex];

  // Debug logging
  React.useEffect(() => {
    if (selectedTrackMatch) {
      console.log(`Selected track ${selectedTrackIndex}: "${selectedTrack?.title}"`);
      console.log('Selected track match:', selectedTrackMatch);
      console.log('Candidates for this track:', selectedTrackMatch.candidates.map(c => ({ title: c.title, artist: c.artist })));
    }
  }, [selectedTrackIndex, selectedTrackMatch, selectedTrack]);

  const getMatchStats = () => {
    const totalTracks = release.tracks?.length || 0;
    const tracksWithMatches = trackMatches.filter(match => match.candidates.length > 0).length;
    const approvedTracks = trackMatches.filter(match => match.approved).length;
    
    return {
      totalTracks,
      tracksWithMatches,
      approvedTracks,
      matchPercentage: totalTracks > 0 ? Math.round((tracksWithMatches / totalTracks) * 100) : 0,
      approvedPercentage: totalTracks > 0 ? Math.round((approvedTracks / totalTracks) * 100) : 0
    };
  };

  const stats = getMatchStats();

  if (!release.tracks || release.tracks.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Audio Matching</DialogTitle>
            <DialogClose className="absolute right-4 top-4">
              <XMarkIcon className="h-4 w-4 text-white/60 hover:text-white" />
            </DialogClose>
          </DialogHeader>
          
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎵</div>
            <H2 className="text-white/80 mb-2">No tracks available</H2>
            <p className="text-white/60 mt-0">This release doesn't have track information.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn("bg-black border-white/20 p-0 overflow-hidden w-[95vw] max-w-[75vw] sm:max-w-4xl max-h-[90vh]", className)}
      >
        <DialogHeader className="px-6 py-4 border-b border-white/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-white text-xl font-bold">
                Audio Matching: {release.title}
              </DialogTitle>
              <p className="text-white/70 mt-1">
                {release.artist} • {stats.tracksWithMatches}/{stats.totalTracks} tracks matched ({stats.matchPercentage}%)
              </p>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-white/60">
                {stats.tracksWithMatches} with matches
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-white/60">
                {stats.approvedTracks} approved
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
              <span className="text-white/60">
                {stats.totalTracks - stats.tracksWithMatches} no matches
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[600px] min-w-0">
          {/* Left Column: Track List */}
          <div className="w-1/3 min-w-0 border-r border-white/20 flex flex-col">
            <div className="px-4 py-3 border-b border-white/20 bg-white/5 flex-shrink-0">
              <h3 className="font-semibold text-white">Tracks</h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {release.tracks.map((track, index) => {
                const trackMatch = trackMatches.find(match => match.trackIndex === index);
                return (
                  <TrackListItem
                    key={index}
                    track={track}
                    trackIndex={index}
                    trackMatch={trackMatch}
                    isSelected={selectedTrackIndex === index}
                    onClick={() => setSelectedTrackIndex(index)}
                  />
                );
              })}
            </div>
          </div>

          {/* Right Column: Audio Matches */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="px-4 py-3 border-b border-white/20 bg-white/5 flex-shrink-0">
              <h3 className="font-semibold text-white truncate">
                Audio Matches for "{selectedTrack?.title}"
              </h3>
              {selectedTrackMatch && (
                <p className="text-sm text-white/60 mt-1">
                  {selectedTrackMatch.candidates.length} candidate{selectedTrackMatch.candidates.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {selectedTrackMatch && selectedTrackMatch.candidates.length > 0 ? (
                <div className="space-y-4">
                  {selectedTrackMatch.candidates.map((candidate, candidateIndex) => (
                    <AudioMatchCandidate
                      key={candidateIndex}
                      candidate={candidate}
                      trackIndex={selectedTrackIndex}
                      isApproved={candidate.approved}
                      onApprove={onApproveMatch}
                      onReject={onRejectMatch}
                      onProvideCorrectVideo={onProvideCorrectVideo}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-white/80 font-medium mb-2">No matches found</h3>
                    <p className="text-white/60 text-sm">
                      No audio matches were found for this track.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/20 flex items-center justify-between bg-white/5 flex-shrink-0">
          <div className="text-sm text-white/60 truncate">
            Track {selectedTrackIndex + 1} of {release.tracks.length}
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};