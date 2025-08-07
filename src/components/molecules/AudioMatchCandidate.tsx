import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, Button, ConfidenceIndicator, Input } from '@/components/atoms';
import { CheckIcon, XMarkIcon } from '@/components/atoms';

interface AudioCandidate {
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
}

interface AudioMatchCandidateProps {
  candidate: AudioCandidate;
  trackIndex: number;
  isApproved?: boolean;
  isRejected?: boolean;
  onApprove?: (trackIndex: number, candidateId: string) => void;
  onReject?: (trackIndex: number, candidateId: string) => void;
  onProvideCorrectVideo?: (trackIndex: number, candidateId: string, newUrl: string) => void;
  className?: string;
}

export const AudioMatchCandidate: React.FC<AudioMatchCandidateProps> = ({
  candidate,
  trackIndex,
  isApproved = false,
  isRejected = false,
  onApprove,
  onReject,
  onProvideCorrectVideo,
  className
}) => {
  const [showCorrectVideoInput, setShowCorrectVideoInput] = useState(false);
  const [correctVideoUrl, setCorrectVideoUrl] = useState('');
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPlatformIcon = () => {
    switch (candidate.platform) {
      case 'youtube':
        return (
          <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
            YT
          </div>
        );
      case 'soundcloud':
        return (
          <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
            SC
          </div>
        );
    }
  };

  const getVideoId = (url: string) => {
    // Extract YouTube video ID from URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const isFromDiscogs = candidate.source === 'discogs_embedded';
  const videoId = getVideoId(candidate.url);

  const handleProvideCorrectVideo = () => {
    if (correctVideoUrl.trim() && onProvideCorrectVideo) {
      onProvideCorrectVideo(trackIndex, candidate.id, correctVideoUrl.trim());
      setCorrectVideoUrl('');
      setShowCorrectVideoInput(false);
    }
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-200',
        isApproved ? 'bg-green-500/10 border-green-500/30' : 
        isRejected ? 'bg-red-500/10 border-red-500/30' : 
        'bg-white/10 border-white/20 hover:bg-white/15',
        className
      )}
    >
      <div className="p-4">
        {/* Header with Platform Info */}
        <div className="flex items-center gap-3 mb-3">
          {getPlatformIcon()}
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white truncate">
              {candidate.title}
            </div>
            <div className="text-sm text-white/60 truncate">
              {candidate.artist}
            </div>
          </div>
        </div>

        {/* Video Preview */}
        {videoId && candidate.platform === 'youtube' && (
          <div className="mb-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="120"
                src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0`}
                style={{ border: 'none' }}
                allowFullScreen
                className="rounded-lg"
              />
            </div>
            
            {/* Auto-approval message for Discogs embedded */}
            {isFromDiscogs && (
              <div className="mt-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded p-2">
                ✓ Auto-approved (from Discogs)
              </div>
            )}
          </div>
        )}

        {/* Confidence Indicator */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>Match Confidence</span>
            <span>{formatDuration(candidate.duration)}</span>
          </div>
          <ConfidenceIndicator
            confidence={candidate.confidence}
            classification={candidate.classification}
            size="sm"
          />
        </div>

        {/* Source Info */}
        <div className="text-xs text-white/50 mb-4">
          Source: {candidate.source === 'discogs_embedded' ? 'Discogs Embedded' : 'YouTube Search'}
        </div>

        {/* Action Buttons */}
        {candidate.approved ? (
          // Currently approved match
          <div className="space-y-2">
            <div className="w-full text-sm py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded flex items-center justify-center">
              <CheckIcon className="w-4 h-4 mr-2" />
              Currently Approved
            </div>
            
            {isFromDiscogs && (
              <Button
                onClick={() => setShowCorrectVideoInput(!showCorrectVideoInput)}
                className="w-full text-sm py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30"
              >
                Doesn't look right?
              </Button>
            )}
            
            {showCorrectVideoInput && (
              <div className="space-y-2">
                <Input
                  placeholder="Paste correct YouTube URL here..."
                  value={correctVideoUrl}
                  onChange={(e) => setCorrectVideoUrl(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleProvideCorrectVideo}
                    disabled={!correctVideoUrl.trim()}
                    className="flex-1 text-sm py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                  >
                    Submit Correction
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCorrectVideoInput(false);
                      setCorrectVideoUrl('');
                    }}
                    className="flex-1 text-sm py-2 bg-white/10 text-white/60 hover:bg-white/20 border border-white/20"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Non-approved match - allow switching to this match
          <div className="space-y-2">
            <Button
              onClick={() => onApprove?.(trackIndex, candidate.id)}
              className="w-full text-sm py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Set as Approved Track
            </Button>
            
            <Button
              onClick={() => setShowCorrectVideoInput(!showCorrectVideoInput)}
              className="w-full text-sm py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30"
            >
              Provide correct video
            </Button>
            
            {showCorrectVideoInput && (
              <div className="space-y-2">
                <Input
                  placeholder="Paste correct YouTube URL here..."
                  value={correctVideoUrl}
                  onChange={(e) => setCorrectVideoUrl(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleProvideCorrectVideo}
                    disabled={!correctVideoUrl.trim()}
                    className="flex-1 text-sm py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                  >
                    Submit Correction
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCorrectVideoInput(false);
                      setCorrectVideoUrl('');
                    }}
                    className="flex-1 text-sm py-2 bg-white/10 text-white/60 hover:bg-white/20 border border-white/20"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};