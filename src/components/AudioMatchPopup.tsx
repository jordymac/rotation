'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon, PauseIcon, CheckIcon } from '@heroicons/react/24/outline';
import { TrackCandidate, AudioMatchResult } from '@/lib/audio-matching-service';

interface AudioMatchPopupProps {
  releaseId: number;
  releaseTitle: string;
  releaseArtist: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioMatchPopup({ releaseId, releaseTitle, releaseArtist, isOpen, onClose }: AudioMatchPopupProps) {
  const [matchData, setMatchData] = useState<AudioMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [processingDecisions, setProcessingDecisions] = useState<Set<string>>(new Set());
  const [selectedMatches, setSelectedMatches] = useState<Map<string, string>>(new Map());

  // Load audio matches when popup opens
  useEffect(() => {
    if (isOpen && !matchData) {
      loadAudioMatches();
    }
  }, [isOpen, releaseId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadAudioMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`[AudioMatchPopup] Loading audio matches for release ${releaseId}`);
      
      const response = await fetch(`/api/admin/releases/${releaseId}/audio-match`);
      
      if (!response.ok) {
        throw new Error(`Failed to load audio matches: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setMatchData(result.data);
        console.log(`[AudioMatchPopup] Loaded ${result.data.matches.length} track matches`);
      } else {
        throw new Error(result.error || 'Failed to load audio matches');
      }
    } catch (err) {
      console.error('[AudioMatchPopup] Error loading audio matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audio matches');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewSelection = async (
    trackPosition: string,
    candidate: TrackCandidate,
    selected: boolean
  ) => {
    if (selected) {
      setSelectedMatches(prev => new Map(prev.set(trackPosition, candidate.id)));
      
      const decisionKey = `${trackPosition}-${candidate.id}`;
      setProcessingDecisions(prev => new Set([...prev, decisionKey]));
      
      try {
        console.log(`[AudioMatchPopup] Auto-approving selected preview: ${trackPosition} - ${candidate.platform}`);
        
        const response = await fetch(`/api/admin/releases/${releaseId}/tracks/${trackPosition}/match`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: candidate.platform,
            candidateId: candidate.id,
            url: candidate.url,
            approved: true,
            confidence: candidate.confidence,
            notes: 'Selected as preferred preview'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to record selection: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`[AudioMatchPopup] Selection recorded:`, result);
        
      } catch (err) {
        console.error('[AudioMatchPopup] Error recording selection:', err);
        alert(`Failed to record selection: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setSelectedMatches(prev => {
          const newMap = new Map(prev);
          newMap.delete(trackPosition);
          return newMap;
        });
      } finally {
        setProcessingDecisions(prev => {
          const newSet = new Set(prev);
          newSet.delete(decisionKey);
          return newSet;
        });
      }
    } else {
      setSelectedMatches(prev => {
        const newMap = new Map(prev);
        newMap.delete(trackPosition);
        return newMap;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-xl font-bold text-white">YouTube Audio Matching</h2>
            <p className="text-white/80">{releaseTitle} - {releaseArtist}</p>
            <p className="text-white/60 text-sm">
              {matchData ? `Processing ${matchData.processedTracks} tracks` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-white">Searching YouTube for matches...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300">{error}</p>
              <button
                onClick={loadAudioMatches}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {matchData && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{selectedMatches.size}</div>
                  <div className="text-white/60 text-sm">Previews Selected</div>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{matchData.processedTracks}</div>
                  <div className="text-white/60 text-sm">Tracks Processed</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {matchData.matches.reduce((sum, match) => sum + match.candidates.filter(c => c.platform === 'youtube').length, 0)}
                  </div>
                  <div className="text-white/60 text-sm">YouTube Matches</div>
                </div>
              </div>

              {/* Track List */}
              <div className="space-y-6">
                {matchData.matches.map((match) => {
                  const youtubeCandidates = match.candidates.filter(c => c.platform === 'youtube');
                  const selectedCandidateId = selectedMatches.get(match.trackPosition);
                  
                  return (
                    <div key={match.trackPosition} className="bg-white/5 rounded-lg border border-white/10 p-6">
                      {/* Track Header */}
                      <div className="mb-4">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-white/60 font-mono text-sm bg-white/10 px-2 py-1 rounded">
                            {match.trackPosition}
                          </span>
                          <div>
                            <div className="text-white font-medium text-lg">{match.trackTitle}</div>
                            <div className="text-white/60">{match.trackArtist}</div>
                          </div>
                        </div>
                        {selectedCandidateId && (
                          <div className="text-green-400 text-sm flex items-center gap-2">
                            <CheckIcon className="w-4 h-4" />
                            YouTube preview selected
                          </div>
                        )}
                      </div>

                      {/* YouTube Results */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">📺</span>
                          <h4 className="text-white font-medium">YouTube Results</h4>
                          <span className="text-white/60 text-sm">({youtubeCandidates.length} found)</span>
                        </div>
                        
                        {youtubeCandidates.length === 0 ? (
                          <div className="text-white/40 text-sm p-4 border border-white/10 rounded bg-white/5">
                            No YouTube matches found
                          </div>
                        ) : (
                          youtubeCandidates.map(candidate => {
                            const isSelected = selectedCandidateId === candidate.id;
                            const decisionKey = `${match.trackPosition}-${candidate.id}`;
                            const isProcessing = processingDecisions.has(decisionKey);
                            
                            return (
                              <div
                                key={candidate.id}
                                className={`p-4 rounded border transition-all ${
                                  isSelected 
                                    ? 'border-green-500/50 bg-green-500/10' 
                                    : 'border-red-500/30 bg-red-500/10 hover:border-red-500/50'
                                }`}
                              >
                                <div className="flex gap-4">
                                  {/* Left side - Text and controls */}
                                  <div className="flex-1">
                                    <div className="flex items-start gap-3 mb-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={isProcessing}
                                        onChange={(e) => handlePreviewSelection(match.trackPosition, candidate, e.target.checked)}
                                        className="mt-1 w-4 h-4 text-green-600 bg-transparent border-white/30 rounded focus:ring-green-500 focus:ring-2"
                                      />
                                      
                                      <div className="flex-1">
                                        <div className="text-white font-medium">{candidate.title}</div>
                                        <div className="text-white/60 text-sm mb-2">
                                          {candidate.artist} • {Math.floor(candidate.duration / 60)}:{(candidate.duration % 60).toString().padStart(2, '0')}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            candidate.classification === 'high' ? 'bg-green-500/20 text-green-400' :
                                            candidate.classification === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                          }`}>
                                            {candidate.confidence}% match
                                          </span>
                                          
                                          <button
                                            onClick={() => {
                                              if (playingAudio === candidate.id) {
                                                setPlayingAudio(null);
                                              } else {
                                                setPlayingAudio(candidate.id);
                                              }
                                            }}
                                            className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                                          >
                                            {playingAudio === candidate.id ? (
                                              <PauseIcon className="w-3 h-3 text-white" />
                                            ) : (
                                              <PlayIcon className="w-3 h-3 text-white" />
                                            )}
                                          </button>
                                          
                                          <a
                                            href={candidate.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                          >
                                            View on YouTube
                                          </a>
                                        </div>
                                        
                                        {isProcessing && (
                                          <div className="text-xs text-yellow-400">Processing selection...</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Right side - YouTube Video Embed */}
                                  {candidate.videoId && (
                                    <div className="flex-shrink-0">
                                      <iframe
                                        width="320"
                                        height="180"
                                        src={`https://www.youtube.com/embed/${candidate.videoId}?start=0${playingAudio === candidate.id ? '&autoplay=1' : ''}`}
                                        title={candidate.title}
                                        style={{ border: 'none' }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="rounded"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/20">
          <div className="text-white/60 text-sm">
            YouTube API integration active • Real video matching enabled
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}