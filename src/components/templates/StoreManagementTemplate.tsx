import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { DiscogsRelease } from '@/utils/discogs';
import { H1, P, Button } from '@/components/atoms';
import { RecordTable, AudioMatchingModal } from '@/components/organisms';
import { PageLayout } from './PageLayout';

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

interface StoreManagementTemplateProps {
  storeName: string;
  releases: DiscogsRelease[];
  onVerifyAudio?: (release: DiscogsRelease) => void;
  trackMatches?: TrackMatch[];
  trackMatchesByRelease?: Record<number, Array<{
    trackIndex: number;
    approved?: boolean;
    candidates?: Array<{ confidence: number; }>;
  }>>;
  onApproveMatch?: (trackIndex: number, candidateId: string) => void;
  onRejectMatch?: (trackIndex: number, candidateId: string) => void;
  onProvideCorrectVideo?: (trackIndex: number, candidateId: string, newUrl: string) => void;
  className?: string;
}

export const StoreManagementTemplate: React.FC<StoreManagementTemplateProps> = ({
  storeName,
  releases,
  onVerifyAudio,
  trackMatches = [],
  trackMatchesByRelease = {},
  onApproveMatch,
  onRejectMatch,
  onProvideCorrectVideo,
  className
}) => {
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<DiscogsRelease | undefined>();

  const handleVerifyAudio = (release: DiscogsRelease) => {
    setSelectedRelease(release);
    onVerifyAudio?.(release); // This will generate track matches
    setAudioModalOpen(true);
  };
  return (
    <PageLayout className={className}>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-white/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <H1 className="text-3xl font-bold">Store Management</H1>
                <P className="text-white/70 mt-1">@{storeName} - Manage records and audio matching</P>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.href = '/admin'}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  ← Back to Admin
                </Button>
                <Button
                  onClick={() => window.location.href = `/feed?store=${storeName}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  View Store Feed
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Record Management */}
          <div className="mb-8">
            <div className="mb-6">
              <H1 className="text-2xl font-bold text-white mb-2">Record Management</H1>
              <P className="text-white/70 mt-0">
                Manage your store's inventory and verify audio matches for better discovery.
              </P>
            </div>
            
            <RecordTable
              releases={releases}
              isSellerMode={true}
              onVerifyAudio={handleVerifyAudio}
              trackMatchesByRelease={trackMatchesByRelease}
            />
          </div>

          {/* Audio Matching Modal */}
          {selectedRelease && (
            <AudioMatchingModal
              isOpen={audioModalOpen}
              onClose={() => setAudioModalOpen(false)}
              release={selectedRelease}
              trackMatches={trackMatches}
              onApproveMatch={onApproveMatch || (() => {})}
              onRejectMatch={onRejectMatch || (() => {})}
              onProvideCorrectVideo={onProvideCorrectVideo}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};