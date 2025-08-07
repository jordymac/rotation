import React from 'react';
import { Card, Badge, Button } from '@/components/atoms';
import { 
  EyeIcon, 
  MusicalNoteIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  HeartIcon,
  ShoppingCartIcon 
} from '@/components/atoms';
import { DiscogsRelease } from '@/utils/discogs';
import { AudioPlayerControls } from './AudioPlayerControls';
import { AlbumArtwork } from './AlbumArtwork';
import { TrackInfo } from './TrackInfo';
import { ArtistAlbumInfo } from './ArtistAlbumInfo';
import { LabelYearInfo } from './LabelYearInfo';
import { GenresStylesTags } from './GenresStylesTags';
import { PriceCondition } from './PriceCondition';
import { ActionButtons } from './ActionButtons';

interface RecordCardProps {
  release: DiscogsRelease;
  viewMode?: 'grid' | 'list';
  isSellerMode?: boolean;
  onVerifyAudio?: (release: DiscogsRelease) => void;
  currentTrack?: {
    title: string;
    duration: string;
    position: string;
  };
  showTrackInfo?: boolean;
  tracks?: Array<{
    title: string;
    duration: string;
    position: string;
  }>;
  currentTrackIndex?: number;
  onTrackChange?: (index: number) => void;
  isScrolling?: boolean;
  youtubeVideoId?: string | null;
  audioLoading?: boolean;
  trackMatches?: Array<{
    trackIndex: number;
    approved?: boolean;
    candidates?: Array<{
      confidence: number;
    }>;
  }>;
}

// Calculate verification status for list view
const calculateVerificationStatus = (release: DiscogsRelease, trackMatches?: Array<{
  trackIndex: number;
  approved?: boolean;
  candidates?: Array<{ confidence: number; }>;
}>) => {
  const totalTracks = release.tracks?.length || 0;
  
  if (trackMatches && trackMatches.length > 0) {
    // Use real track match data
    const tracksWithAudio = trackMatches.filter(match => 
      match.approved || (match.candidates && match.candidates.length > 0)
    ).length;
    const audioMatchPercentage = totalTracks > 0 ? Math.round((tracksWithAudio / totalTracks) * 100) : 0;
    const isVerified = audioMatchPercentage >= 80;
    
    return { totalTracks, tracksWithAudio, audioMatchPercentage, isVerified };
  }
  
  // If trackMatches is an empty array, it means processing is complete but no matches found
  if (trackMatches && trackMatches.length === 0) {
    return { totalTracks, tracksWithAudio: 0, audioMatchPercentage: 0, isVerified: false };
  }
  
  // If trackMatches is undefined, it means still processing (show loading state)
  if (trackMatches === undefined) {
    return { totalTracks, tracksWithAudio: 0, audioMatchPercentage: 0, isVerified: false, isLoading: true };
  }
  
  // Fallback for old data without trackMatches
  if (totalTracks === 0) {
    return { totalTracks: 0, tracksWithAudio: 0, audioMatchPercentage: 0, isVerified: false };
  }
  
  const tracksWithAudio = Math.floor(totalTracks * 0.8); // 80% have audio
  const audioMatchPercentage = Math.round((tracksWithAudio / totalTracks) * 100);
  const isVerified = audioMatchPercentage >= 80;
  
  return { totalTracks, tracksWithAudio, audioMatchPercentage, isVerified };
};

export const RecordCard: React.FC<RecordCardProps> = ({
  release,
  viewMode = 'grid',
  isSellerMode = false,
  onVerifyAudio,
  currentTrack,
  showTrackInfo = false,
  tracks,
  currentTrackIndex = 0,
  onTrackChange,
  isScrolling = false,
  youtubeVideoId,
  audioLoading,
  trackMatches
}) => {
  const verificationStatus = calculateVerificationStatus(release, trackMatches);

  if (viewMode === 'list') {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-200">
        <div className="flex gap-4 min-h-[120px] p-4">
          {/* Album Image */}
          <div className="flex-shrink-0">
            <AlbumArtwork
              imageUrl={release.thumb}
              alt={`${release.artist} - ${release.title}`}
              size="sm"
              className="w-24 h-[112px]"
            />
          </div>
          
          {/* Content Area - 4 Column Grid */}
          <div className="flex-1 min-w-0 grid grid-cols-4 gap-6 items-center">
            {/* Column 1: Album Details */}
            <div className="min-w-0">
              <ArtistAlbumInfo
                artist={release.artist}
                title={release.title}
                variant="compact"
                className="mb-2"
              />
              <LabelYearInfo
                label={release.label}
                year={release.year}
                country={release.country}
                variant="compact"
                className="mb-2"
              />
              <GenresStylesTags
                genres={release.genre || []}
                styles={release.style || []}
                maxVisible={2}
                size="sm"
                className="mb-2"
              />
              
              {/* Mock Stats */}
              <div className="flex items-center gap-3 text-xs text-white/60">
                <div className="flex items-center gap-1">
                  <span>🎵</span>
                  <span>{Math.floor(Math.random() * 1000 + 50)} plays</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>❤️</span>
                  <span>{Math.floor(Math.random() * 200 + 10)} wishlists</span>
                </div>
              </div>
            </div>
            
            {/* Column 2: Condition/Price */}
            <div className="text-center">
              <PriceCondition
                condition={release.condition}
                sleeveCondition={release.sleeve_condition}
                price={release.price}
                layout="vertical"
              />
            </div>
            
            {/* Column 3: Verification */}
            <div className="text-center">
              {(verificationStatus as any).isLoading ? (
                // Loading state - still processing
                <div className="animate-pulse">
                  <p className="text-sm text-white/50 mb-1">Loading...</p>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-3 h-3 bg-white/30 rounded-full" />
                    <span className="text-xs text-white/40">Checking audio</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 bg-white/30 rounded-full" />
                    <span className="text-xs text-white/40">Please wait</span>
                  </div>
                </div>
              ) : verificationStatus.totalTracks === 0 ? (
                // No tracks found
                <div>
                  <p className="text-sm text-white/50 mb-1">No tracks</p>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ExclamationTriangleIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-white/40">No track data</span>
                  </div>
                </div>
              ) : verificationStatus.tracksWithAudio === 0 && trackMatches?.length === 0 ? (
                // Processing complete, no audio matches found
                <div>
                  <p className="text-sm text-white/80 mb-1">
                    {verificationStatus.totalTracks} tracks
                  </p>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ExclamationTriangleIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-white/40">No audio found</span>
                  </div>
                </div>
              ) : (
                // Normal display with real data
                <>
                  <p className="text-sm text-white/80 mb-1">
                    {verificationStatus.tracksWithAudio}/{verificationStatus.totalTracks} tracks
                  </p>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MusicalNoteIcon className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-white/60">{verificationStatus.audioMatchPercentage}% Audio Match</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {verificationStatus.isVerified ? (
                      <CheckIcon className="w-3 h-3 text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="w-3 h-3 text-orange-400" />
                    )}
                    <span className="text-xs text-white/60">
                      {verificationStatus.isVerified ? 'Verified' : 'Needs Review'}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {/* Column 4: Actions */}
            <div className="text-center">
              <ActionButtons
                release={release}
                isSellerMode={isSellerMode}
                onVerifyAudio={onVerifyAudio}
                layout="vertical"
                trackMatches={trackMatches}
              />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid View (default)
  return (
    <Card className="w-full max-w-72 sm:max-w-80 mx-auto flex flex-col h-full">
      {/* Album Artwork with Track Navigation */}
      <div className="relative flex-shrink-0 mb-3 sm:mb-4 mx-auto aspect-square max-h-48 sm:max-h-64 max-w-48 sm:max-w-full">
        <AlbumArtwork
          imageUrl={release.thumb}
          alt={`${release.artist} - ${release.title}`}
          size="lg"
          className="w-full h-full"
        />
        
        {/* Track Navigation Dots */}
        {tracks && tracks.length > 1 && onTrackChange && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-full max-w-full px-4">
            <div className="bg-black/20 rounded-full px-4 py-1 backdrop-blur-sm max-w-full">
              <div className="flex justify-center gap-2 py-1">
                {tracks.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => !isScrolling && onTrackChange(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 flex-shrink-0 ${
                      index === currentTrackIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Record Details */}
      <div className="flex-1 flex flex-col px-2">
        {/* Current Track Info */}
        {showTrackInfo && currentTrack && (
          <TrackInfo
            title={currentTrack.title}
            position={currentTrack.position}
            duration={currentTrack.duration}
            className="mb-3"
          />
        )}
        
        {/* Artist & Album */}
        <ArtistAlbumInfo
          artist={release.artist}
          title={release.title}
          className="mb-3"
        />
        
        {/* Label | Year | Country */}
        <LabelYearInfo
          label={release.label}
          year={release.year}
          country={release.country}
          className="mb-3"
        />
        
        {/* Genres & Styles */}
        <GenresStylesTags
          genres={release.genre || []}
          styles={release.style || []}
          className="mb-4"
        />
        
        {/* Audio Player */}
        {showTrackInfo && (
          <div className="mb-4">
            {youtubeVideoId ? (
              <AudioPlayerControls
                videoId={youtubeVideoId}
                autoplay={false}
                onError={(error) => console.error('YouTube player error:', error)}
              />
            ) : audioLoading ? (
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white/60 rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>Loading...</span>
                      <span>--:--</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full">
                      <div className="h-full w-0 bg-white/60 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/60">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>No audio</span>
                      <span>{currentTrack?.duration || "3:45"}</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full">
                      <div className="h-full w-0 bg-white/40 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Price and Condition */}
        <div className="mt-auto">
          <PriceCondition
            condition={release.condition}
            sleeveCondition={release.sleeve_condition}
            price={release.price}
          />
        </div>
      </div>
    </Card>
  );
};