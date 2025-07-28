'use client';

import { DiscogsRelease } from '@/utils/discogs';
import { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

interface RecordManagementModalProps {
  release: DiscogsRelease;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedRelease: Partial<DiscogsRelease>) => void;
}

// Mock track data - in real app this would come from the release data or API
const generateMockTracks = (release: DiscogsRelease) => [
  { position: 'A1', title: `${release.title} - Track 1`, duration: '4:32', hasAudio: true, audioMatchScore: 92 },
  { position: 'A2', title: 'Second Track', duration: '3:15', hasAudio: true, audioMatchScore: 87 },
  { position: 'A3', title: 'Third Track', duration: '5:41', hasAudio: false, audioMatchScore: 0 },
  { position: 'B1', title: 'Fourth Track', duration: '3:58', hasAudio: true, audioMatchScore: 94 },
  { position: 'B2', title: 'Final Track', duration: '6:12', hasAudio: true, audioMatchScore: 89 },
];

export default function RecordManagementModal({ release, isOpen, onClose, onSave }: RecordManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'tracks' | 'audio' | 'pricing'>('details');
  const [editedPrice, setEditedPrice] = useState(release.price || '');
  const [editedCondition, setEditedCondition] = useState(release.condition || '');
  const [editedSleeveCondition, setEditedSleeveCondition] = useState(release.sleeve_condition || '');
  const [status, setStatus] = useState('active');
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);
  
  const tracks = generateMockTracks(release);
  const totalTracks = tracks.length;
  const tracksWithAudio = tracks.filter(t => t.hasAudio).length;
  const avgAudioScore = Math.round(tracks.reduce((sum, t) => sum + t.audioMatchScore, 0) / totalTracks);

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

  const handleSave = () => {
    onSave?.({
      price: editedPrice,
      condition: editedCondition,
      sleeve_condition: editedSleeveCondition,
    });
    onClose();
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
            <div>
              <h2 className="text-xl font-bold text-white">{release.title}</h2>
              <p className="text-white/80">{release.artist}</p>
              <p className="text-white/60 text-sm">{release.label} • {release.year}</p>
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
            { id: 'tracks', label: 'Tracks' },
            { id: 'audio', label: 'Audio Matching' },
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
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Track Listing</h3>
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center text-white/60 text-sm font-mono">
                        {track.position}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{track.title}</div>
                        <div className="text-white/60 text-sm">{track.duration}</div>
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
                        <span className="text-white/40 text-sm">No Audio</span>
                      )}
                      <div className={`w-2 h-2 rounded-full ${track.hasAudio ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{tracksWithAudio}/{totalTracks}</div>
                  <div className="text-white/60 text-sm">Tracks with Audio</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{avgAudioScore}%</div>
                  <div className="text-white/60 text-sm">Avg Match Score</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">✅</div>
                  <div className="text-white/60 text-sm">Verification Status</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Audio Match Details</h3>
                <div className="space-y-3">
                  {tracks.map((track, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-white">{track.position}. {track.title}</div>
                        <div className={`text-sm ${track.hasAudio ? 'text-green-400' : 'text-red-400'}`}>
                          {track.hasAudio ? `${track.audioMatchScore}% match` : 'No audio found'}
                        </div>
                      </div>
                      {track.hasAudio && (
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-green-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${track.audioMatchScore}%` }}
                          ></div>
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
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/70 hover:text-white transition-colors"
          >
            Cancel
          </button>
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
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}