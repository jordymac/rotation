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
import { VideoScrubber } from './VideoScrubber';
import { AutoplayVideoPlayer } from './AutoplayVideoPlayer';

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
  index?: number; // For priority loading
  currentIndex?: number; // Current position (1-based)
  totalCount?: number; // Total number of records
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
  trackMatches,
  index,
  currentIndex,
  totalCount
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
              priority={index !== undefined && index < 6}
              sizes="(max-width: 768px) 100vw, 96px"
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

  // Grid View - Mobile 9:16 Feed Card
  return (
    <div 
      className="w-full max-w-sm mx-auto flex flex-col bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden" 
      style={{ aspectRatio: '9 / 16' }}
    >
      {/* Video Region - Fixed 16:9 at very top */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
        {youtubeVideoId ? (
          <AutoplayVideoPlayer
            videoId={youtubeVideoId}
            title={`${release.artist} - ${release.title}`}
          />
        ) : audioLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-white/60">Loading video...</div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-white/60">Video Placeholder</div>
          </div>
        )}
      </div>
      
      {/* Details Section */}
      <div className="flex-1 flex flex-col p-4 space-y-3">
        {/* Track Title (emphasized) */}
        <h2 className="text-lg font-bold text-white leading-tight">
          {currentTrack?.title || release.title}
        </h2>
        
        {/* Artist (smaller) */}
        <p className="text-base text-white/80 font-medium">
          {release.artist}
        </p>
        
        {/* Album (smaller) */}
        <p className="text-sm text-white/60">
          {release.title}
        </p>
        
        {/* Genres - Multiple Badge Pills */}
        <div className="flex flex-wrap gap-1">
          {(release.genre || []).concat(release.style || []).slice(0, 4).map((genre, index) => (
            <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-white/20 text-white/80">
              {genre}
            </Badge>
          ))}
        </div>
        
        {/* Meta Row: Year • Track # • Time */}
        <div className="text-sm text-white/60 flex items-center gap-2">
          <span>{release.year}</span>
          <span>•</span>
          <span>Track {currentTrackIndex + 1}</span>
          <span>•</span>
          <span>{currentTrack?.duration || '4:45'}</span>
        </div>
        
        {/* Price (large) + Condition (small) */}
        <div className="space-y-1">
          <div className="text-2xl font-bold text-white">
            {release.price || '$24.99'}
          </div>
          <div className="text-sm text-white/60">
            {release.condition || 'VG+'} / {release.sleeve_condition || 'Sleeve VG'}
          </div>
        </div>
        
        {/* CTAs: Wishlist (secondary) and Buy Now */}
        <div className="flex gap-3 mt-auto">
          <Button
            variant="outline"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <HeartIcon className="w-4 h-4 mr-2" />
            Wishlist
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            asChild
          >
            <a
              href={release.listingUri || `https://www.discogs.com${release.uri}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ShoppingCartIcon className="w-4 h-4 mr-2" />
              Buy Now
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};