'use client';

import { DiscogsRelease } from '@/utils/discogs';
import { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon, PauseIcon, MusicalNoteIcon, CheckIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AudioMatchPopup from './AudioMatchPopup';

interface RecordManagementModalProps {
  release: DiscogsRelease;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedRelease: Partial<DiscogsRelease>) => void;
  onNextUnverified?: () => void;
  allReleases?: DiscogsRelease[];
  currentReleaseIndex?: number;
  initialTab?: 'details' | 'tracks' | 'pricing';
}

// Platform icons mapping
const platformIcons = {
  youtube: '📺',
  spotify: '🎵', 
  apple: '🍎',
  soundcloud: '☁️'
};

// Enhanced track interface combining Discogs data with audio matching info
interface EnhancedTrack {
  position: string;
  title: string;
  duration: string;
  hasAudio: boolean;
  platforms: Array<keyof typeof platformIcons>;
  matchQuality: 'high' | 'medium' | 'low';
  artists?: Array<{ name: string; id: number; }>;
}

// Simple seeded random function for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Convert Discogs tracks to enhanced tracks with audio matching data
const generateEnhancedTracks = (release: DiscogsRelease): EnhancedTrack[] => {
  // Use real track data from the release if available, otherwise create minimal fallback
  const baseTracks = release.tracks && release.tracks.length > 0 
    ? release.tracks 
    : [
        { position: 'A1', title: release.title, duration: '3:30' },
        { position: 'A2', title: `${release.title} (Alternate)`, duration: '3:45' }
      ];
  
  return baseTracks.map((track, index) => {
    // Use release ID and track index as seed for consistent results
    const seed = release.id * 1000 + index;
    
    // Mock audio matching data - in production this would come from audio matching service
    const mockAudioData = {
      hasAudio: seededRandom(seed) > 0.2, // 80% chance of having audio
      platforms: [] as Array<keyof typeof platformIcons>,
      matchQuality: 'medium' as 'high' | 'medium' | 'low'
    };
    
    // Randomly assign platforms for tracks that have audio
    if (mockAudioData.hasAudio) {
      const allPlatforms: Array<keyof typeof platformIcons> = ['youtube', 'spotify', 'apple', 'soundcloud'];
      const numPlatforms = Math.floor(seededRandom(seed + 1) * 3) + 1; // 1-3 platforms
      const shuffled = [...allPlatforms].sort(() => 0.5 - seededRandom(seed + 2));
      mockAudioData.platforms = shuffled.slice(0, numPlatforms);
      
      // Higher quality if more platforms
      if (mockAudioData.platforms.length >= 3) {
        mockAudioData.matchQuality = 'high';
      } else if (mockAudioData.platforms.length >= 2) {
        mockAudioData.matchQuality = 'medium';
      } else {
        mockAudioData.matchQuality = seededRandom(seed + 3) > 0.5 ? 'medium' : 'low';
      }
    } else {
      mockAudioData.matchQuality = 'low';
    }
    
    return {
      position: track.position,
      title: track.title,
      duration: track.duration || '3:30', // Fallback duration
      artists: track.artists,
      ...mockAudioData
    };
  });
};

export default function RecordManagementModal({ release, isOpen, onClose, onSave, onNextUnverified, allReleases = [], currentReleaseIndex = 0, initialTab = 'details' }: RecordManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'tracks' | 'pricing'>(initialTab);
  const [editedPrice, setEditedPrice] = useState(release.price || '');
  const [editedCondition, setEditedCondition] = useState(release.condition || '');
  const [editedSleeveCondition, setEditedSleeveCondition] = useState(release.sleeve_condition || '');
  const [status, setStatus] = useState('active');
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);
  const [showAudioMatchPopup, setShowAudioMatchPopup] = useState(false);
  
  const tracks = generateEnhancedTracks(release);
  const totalTracks = tracks.length;
  const tracksWithAudio = tracks.filter(t => t.hasAudio).length;
  const audioMatchPercentage = Math.round((tracksWithAudio / totalTracks) * 100);
  
  // Determine if current release needs verification (less than 80% of tracks have audio)
  const needsVerification = (release: DiscogsRelease) => {
    const releaseTracks = generateEnhancedTracks(release);
    const tracksWithAudio = releaseTracks.filter(t => t.hasAudio).length;
    const audioPercentage = Math.round((tracksWithAudio / releaseTracks.length) * 100);
    return audioPercentage < 80;
  };
  
  // Find next release that needs verification
  const findNextUnverifiedRelease = () => {
    if (!allReleases.length) return null;
    
    // Start from the next release after current
    for (let i = currentReleaseIndex + 1; i < allReleases.length; i++) {
      if (needsVerification(allReleases[i])) {
        return { release: allReleases[i], index: i };
      }
    }
    
    // If no unverified found after current, search from beginning
    for (let i = 0; i < currentReleaseIndex; i++) {
      if (needsVerification(allReleases[i])) {
        return { release: allReleases[i], index: i };
      }
    }
    
    return null;
  };
  
  const currentNeedsVerification = needsVerification(release);
  const nextUnverified = findNextUnverifiedRelease();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab(initialTab); // Set the initial tab when modal opens
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialTab]);

  const handleSave = () => {
    onSave?.({
      price: editedPrice,
      condition: editedCondition,
      sleeve_condition: editedSleeveCondition,
    });
    onClose();
  };
  
  const handleSaveAndNextUnverified = () => {
    onSave?.({
      price: editedPrice,
      condition: editedCondition,
      sleeve_condition: editedSleeveCondition,
    });
    
    if (nextUnverified) {
      onNextUnverified?.();
      // Don't close the modal, let parent component handle the transition
    } else {
      onClose();
    }
  };

  const togglePlayTrack = (index: number) => {
    setPlayingTrack(playingTrack === index ? null : index);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              {release.thumb ? (
                <img
                  src={release.thumb}
                  alt={`${release.artist} - ${release.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <span className="text-white/60 text-xl">🎵</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{release.title}</h2>
              <p className="text-white/80">{release.artist}</p>
              <p className="text-white/60 text-sm">{release.label} • {release.year}</p>
              
              {/* Verification Status Badge */}
              <div className="mt-2">
                {currentNeedsVerification ? (
                  <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full text-xs">
                    <ExclamationTriangleIcon className="w-3 h-3" /> Needs Verification
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">
                    <CheckIcon className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/20">
          {[
            { id: 'details', label: 'Details' },
            { id: 'tracks', label: 'Tracks & Audio' },
            { id: 'pricing', label: 'Pricing & Status' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Release Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Title</label>
                      <div className="text-white bg-white/10 px-3 py-2 rounded-lg">{release.title}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Artist</label>
                      <div className="text-white bg-white/10 px-3 py-2 rounded-lg">{release.artist}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-white/70 mb-1">Label</label>
                        <div className="text-white bg-white/10 px-3 py-2 rounded-lg text-sm">{release.label}</div>
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-1">Year</label>
                        <div className="text-white bg-white/10 px-3 py-2 rounded-lg text-sm">{release.year}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Catalog Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Catalog Number</label>
                      <div className="text-white bg-white/10 px-3 py-2 rounded-lg">{release.id || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Format</label>
                      <div className="text-white bg-white/10 px-3 py-2 rounded-lg">Vinyl LP</div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Country</label>
                      <div className="text-white bg-white/10 px-3 py-2 rounded-lg">{release.country || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Genres and Styles */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Genres & Styles</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Genres</label>
                    <div className="flex flex-wrap gap-2">
                      {(release.genre || []).map((genre, index) => (
                        <span key={index} className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Styles</label>
                    <div className="flex flex-wrap gap-2">
                      {(release.style || []).map((style, index) => (
                        <span key={index} className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-sm">
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tracks' && (
            <div className="space-y-6">
              {/* Header with Verify Audio Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Audio Verification & Matching</h3>
                <button
                  onClick={() => setShowAudioMatchPopup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MusicalNoteIcon className="w-4 h-4" />
                  <span>Verify Audio</span>
                </button>
              </div>

              {/* Audio Matching Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{tracksWithAudio}/{totalTracks}</div>
                  <div className="text-white/60 text-sm">Tracks with Audio</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{audioMatchPercentage}%</div>
                  <div className="text-white/60 text-sm">Audio Match Rate</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 flex items-center justify-center">
                    {audioMatchPercentage >= 80 ? (
                      <CheckIcon className="w-8 h-8 text-green-400" />
                    ) : (
                      <QuestionMarkCircleIcon className="w-8 h-8 text-orange-400" />
                    )}
                  </div>
                  <div className="text-white/60 text-sm">
                    {audioMatchPercentage >= 80 ? 'Verified' : 'Needs Review'}
                  </div>
                </div>
              </div>

              {/* Track Listing with Audio Details */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Track Listing & Audio Sources</h3>
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-8 text-center text-white/60 text-sm font-mono">
                            {track.position}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{track.title}</div>
                            <div className="text-white/60 text-sm">
                              {track.duration}
                              {track.artists && track.artists.length > 0 && (
                                <span className="ml-2">
                                  • {track.artists.map(a => a.name).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {track.hasAudio ? (
                            <button
                              onClick={() => togglePlayTrack(index)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              {playingTrack === index ? (
                                <PauseIcon className="w-4 h-4 text-white" />
                              ) : (
                                <PlayIcon className="w-4 h-4 text-white" />
                              )}
                            </button>
                          ) : (
                            <span className="text-white/40 text-sm px-3 py-1 bg-red-400/20 rounded-full">
                              No Audio Found
                            </span>
                          )}
                          
                          <div className={`w-3 h-3 rounded-full ${
                            track.matchQuality === 'high' ? 'bg-green-400' : 
                            track.matchQuality === 'medium' ? 'bg-yellow-400' : 
                            'bg-red-400'
                          }`}></div>
                        </div>
                      </div>
                      
                      {/* Platform Sources */}
                      {track.hasAudio && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="text-white/60 text-sm">Available on:</span>
                            <div className="flex gap-2">
                              {track.platforms.map((platform, platformIndex) => (
                                <span 
                                  key={platformIndex}
                                  className="text-lg" 
                                  title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                >
                                  {platformIcons[platform]}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-white/60 text-xs">Match Quality:</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              track.matchQuality === 'high' ? 'bg-green-400/20 text-green-300' :
                              track.matchQuality === 'medium' ? 'bg-yellow-400/20 text-yellow-300' :
                              'bg-red-400/20 text-red-300'
                            }`}>
                              {track.matchQuality.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Pricing</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Price</label>
                      <input
                        type="text"
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                        placeholder="$0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Media Condition</label>
                      <select
                        value={editedCondition}
                        onChange={(e) => setEditedCondition(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                      >
                        <option value="">Select condition</option>
                        <option value="Mint (M)">Mint (M)</option>
                        <option value="Near Mint (NM)">Near Mint (NM)</option>
                        <option value="Very Good Plus (VG+)">Very Good Plus (VG+)</option>
                        <option value="Very Good (VG)">Very Good (VG)</option>
                        <option value="Good Plus (G+)">Good Plus (G+)</option>
                        <option value="Good (G)">Good (G)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Sleeve Condition</label>
                      <select
                        value={editedSleeveCondition}
                        onChange={(e) => setEditedSleeveCondition(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                      >
                        <option value="">Select condition</option>
                        <option value="Mint (M)">Mint (M)</option>
                        <option value="Near Mint (NM)">Near Mint (NM)</option>
                        <option value="Very Good Plus (VG+)">Very Good Plus (VG+)</option>
                        <option value="Very Good (VG)">Very Good (VG)</option>
                        <option value="Good Plus (G+)">Good Plus (G+)</option>
                        <option value="Good (G)">Good (G)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Status & Visibility</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Listing Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                      >
                        <option value="active">Active - Live on marketplace</option>
                        <option value="inactive">Inactive - Not visible</option>
                        <option value="draft">Draft - Work in progress</option>
                        <option value="sold">Sold - No longer available</option>
                      </select>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Performance Stats</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-white/60">Views</div>
                          <div className="text-white font-medium">{Math.floor(Math.random() * 500 + 25)}</div>
                        </div>
                        <div>
                          <div className="text-white/60">Wishlists</div>
                          <div className="text-white font-medium">{Math.floor(Math.random() * 50 + 5)}</div>
                        </div>
                        <div>
                          <div className="text-white/60">Inquiries</div>
                          <div className="text-white font-medium">{Math.floor(Math.random() * 10 + 1)}</div>
                        </div>
                        <div>
                          <div className="text-white/60">Days Listed</div>
                          <div className="text-white font-medium">{Math.floor(Math.random() * 90 + 1)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-white/20">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            {/* Show progress indicator if there are more unverified records */}
            {nextUnverified && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>📋</span>
                <span>Next unverified: {nextUnverified.release.artist} - {nextUnverified.release.title}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                // TODO: Implement duplicate functionality
                alert('Duplicate functionality will be implemented');
              }}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Duplicate
            </button>
            
            {/* Conditional Save Button */}
            {nextUnverified ? (
              <button
                onClick={handleSaveAndNextUnverified}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2"
                title={`Save and go to next unverified record: ${nextUnverified.release.artist} - ${nextUnverified.release.title}`}
              >
                <span>Save & Next Unverified</span>
                <span>→</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audio Match Popup */}
      {showAudioMatchPopup && (
        <AudioMatchPopup
          releaseId={release.id}
          releaseTitle={release.title}
          releaseArtist={release.artist}
          isOpen={showAudioMatchPopup}
          onClose={() => setShowAudioMatchPopup(false)}
        />
      )}
    </div>
  );
}