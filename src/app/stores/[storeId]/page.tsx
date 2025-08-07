'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { StoreManagementTemplate } from '@/components/templates';
import { DiscogsRelease } from '@/utils/discogs';

interface Store {
  id: string;
  username: string;
}

interface StoreInventoryResponse {
  results: DiscogsRelease[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
  store: Store;
}

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

function StorefrontContent() {
  const params = useParams();
  const storeId = params.storeId as string;
  
  const [storeData, setStoreData] = useState<StoreInventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<DiscogsRelease | undefined>();
  const [trackMatches, setTrackMatches] = useState<TrackMatch[]>([]);
  const [trackMatchesByRelease, setTrackMatchesByRelease] = useState<Record<number, Array<{
    trackIndex: number;
    approved?: boolean;
    candidates?: Array<{ confidence: number; }>;
  }>>>({});
  useEffect(() => {
    loadStoreInventory();
  }, [storeId]);

  // Removed handleManageItem since we no longer have the manage functionality

  const handleVerifyAudio = async (release: DiscogsRelease) => {
    console.log(`Manual verify audio for release: ${release.title}`);
    console.log(`Release has ${release.tracks?.length || 0} tracks`);
    setSelectedRelease(release);
    
    // Always fetch fresh detailed track match data for the modal
    // The listing view uses summary data, but the modal needs full candidate details
    console.log(`Fetching detailed track matches for modal display`);
    await generateRealTrackMatches(release);
  };
  
  const generateRealTrackMatches = async (release: DiscogsRelease) => {
    if (!release.tracks || release.tracks.length === 0) {
      console.log(`No tracks found for ${release.title}`);
      setTrackMatches([]);
      return;
    }

    console.log(`Generating audio matches for ${release.title} (${release.tracks.length} tracks)`);
    
    try {
      // Call the real API to get audio matches (GET endpoint handles full release)
      const response = await fetch(`/api/admin/releases/${release.id}/audio-match`);

      if (!response.ok) {
        throw new Error(`Audio matching API error: ${response.status}`);
      }

      const audioMatchData = await response.json();
      const totalCandidates = audioMatchData.data.matches.reduce((sum: number, match: any) => sum + (match.candidates?.length || 0), 0);
      console.log(`Found ${audioMatchData.data.matches.length} tracks with ${totalCandidates} total audio candidates`);

      // Transform the API response to match our TrackMatch interface
      const matches: TrackMatch[] = audioMatchData.data.matches.map((match: any) => {
        // Auto-approve the highest confidence match
        const sortedCandidates = match.candidates.sort((a: any, b: any) => b.confidence - a.confidence);
        const bestCandidate = sortedCandidates[0];
        
        const processedCandidates = match.candidates.map((candidate: any) => ({
          platform: candidate.platform,
          id: candidate.id,
          title: candidate.title,
          artist: candidate.artist,
          duration: candidate.duration,
          url: candidate.url,
          confidence: candidate.confidence,
          classification: candidate.classification,
          source: candidate.source,
          approved: candidate.id === bestCandidate?.id // Auto-approve highest confidence
        }));

        // Process track match data
        
        return {
          trackIndex: match.trackIndex,
          trackTitle: match.trackTitle,
          trackPosition: match.trackPosition,
          candidates: processedCandidates,
          bestMatch: bestCandidate,
          approved: sortedCandidates.length > 0 // Track is approved if it has any matches
        };
      });

      setTrackMatches(matches);
      
      // Also store the matches by release ID for the list view
      const trackMatchesForRelease = matches.map(match => ({
        trackIndex: match.trackIndex,
        approved: match.approved,
        candidates: match.candidates.map(c => ({ confidence: c.confidence }))
      }));
      
      setTrackMatchesByRelease(prev => ({
        ...prev,
        [release.id]: trackMatchesForRelease
      }));
      
      console.log(`Generated ${matches.length} track matches`);

    } catch (error) {
      console.error('Error generating audio matches:', error);
      // Fallback to empty matches on error
      setTrackMatches([]);
    }
  };

  const handleApproveMatch = async (trackIndex: number, candidateId: string) => {
    console.log('Approve match:', trackIndex, candidateId);
    
    if (!selectedRelease) return;
    
    // Find the candidate being approved
    const trackMatch = trackMatches.find(m => m.trackIndex === trackIndex);
    const candidate = trackMatch?.candidates.find(c => c.id === candidateId);
    
    if (!candidate) {
      console.error('Candidate not found for approval');
      return;
    }
    
    try {
      // Save to database via API
      const response = await fetch(`/api/admin/releases/${selectedRelease.id}/approve-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackIndex,
          platform: candidate.platform,
          url: candidate.url,
          confidence: candidate.confidence,
          action: 'approve'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Match approved and saved to database:', result);
      
      // Update UI state after successful database save
      setTrackMatches(prevMatches => 
        prevMatches.map(match => {
          if (match.trackIndex === trackIndex) {
            // Find the approved candidate
            const approvedCandidate = match.candidates.find(c => c.id === candidateId);
            return {
              ...match,
              approved: true,
              bestMatch: approvedCandidate,
              candidates: match.candidates.map(c => ({
                ...c,
                // Only the selected candidate is approved
                approved: c.id === candidateId
              }))
            };
          }
          return match;
        })
      );

      // Also update the trackMatchesByRelease state
      if (selectedRelease) {
        setTrackMatchesByRelease(prev => ({
          ...prev,
          [selectedRelease.id]: prev[selectedRelease.id]?.map(match => 
            match.trackIndex === trackIndex 
              ? { ...match, approved: true }
              : match
          ) || []
        }));
      }
      
    } catch (error) {
      console.error('Error approving match:', error);
      // TODO: Show error message to user
    }
  };

  const handleRejectMatch = async (trackIndex: number, candidateId: string) => {
    console.log('Reject match:', trackIndex, candidateId);
    
    if (!selectedRelease) return;
    
    try {
      // Remove from database via API
      const response = await fetch(`/api/admin/releases/${selectedRelease.id}/approve-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackIndex,
          platform: 'none', // Not needed for reject
          url: '',           // Not needed for reject
          confidence: 0,     // Not needed for reject
          action: 'reject'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Match rejected and removed from database:', result);
      
      // Update UI state after successful database operation
      setTrackMatches(prevMatches => 
        prevMatches.map(match => {
          if (match.trackIndex === trackIndex) {
            return {
              ...match,
              approved: false,
              bestMatch: null,
              candidates: match.candidates.map(candidate => ({
                ...candidate,
                approved: false
              }))
            };
          }
          return match;
        })
      );

      // Also update the trackMatchesByRelease state
      if (selectedRelease) {
        setTrackMatchesByRelease(prev => ({
          ...prev,
          [selectedRelease.id]: prev[selectedRelease.id]?.map(match => 
            match.trackIndex === trackIndex 
              ? { ...match, approved: false }
              : match
          ) || []
        }));
      }
      
    } catch (error) {
      console.error('Error rejecting match:', error);
      // TODO: Show error message to user
    }
  };

  const handleProvideCorrectVideo = (trackIndex: number, candidateId: string, newUrl: string) => {
    console.log('Provide correct video:', { trackIndex, candidateId, newUrl });
    // TODO: Implement the logic to update the track match with the correct video
  };

  const loadStoreInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/stores/${storeId}/inventory`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Store not found');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      setStoreData(data);
      
      // After loading inventory, automatically generate track matches for all releases in the background
      if (data.results && data.results.length > 0) {
        console.log(`Auto-generating track matches for ${data.results.length} releases...`);
        // Run background loading without blocking the UI
        loadTrackMatchesForAllReleases(data.results).catch(error => {
          console.error('Background track matching failed:', error);
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load store inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackMatchesForAllReleases = async (releases: DiscogsRelease[]) => {
    // Process only first few releases to avoid overwhelming the system
    const limitedReleases = releases.slice(0, 5); // Only auto-load first 5 releases
    console.log(`Auto-loading track matches for first ${limitedReleases.length} releases (out of ${releases.length} total)`);
    
    // Process one at a time with longer delays
    for (const release of limitedReleases) {
      try {
        console.log(`Auto-loading track matches for: ${release.title} by ${release.artist}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`/api/admin/releases/${release.id}/audio-match`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`Failed to load track matches for release ${release.id}: ${response.status}`);
          continue;
        }
        
        const audioMatchData = await response.json();
        
        if (audioMatchData.data?.matches) {
          // Transform the API response to match our TrackMatch interface
          const matches = audioMatchData.data.matches.map((match: any) => {
            const sortedCandidates = match.candidates.sort((a: any, b: any) => b.confidence - a.confidence);
            const bestCandidate = sortedCandidates[0];
            
            return {
              trackIndex: match.trackIndex,
              approved: bestCandidate?.confidence >= 85, // Auto-approve high confidence matches
              candidates: match.candidates.map((c: any) => ({ confidence: c.confidence }))
            };
          });
          
          // Update the trackMatchesByRelease state - even if matches array is empty
          setTrackMatchesByRelease(prev => ({
            ...prev,
            [release.id]: matches
          }));
          
          console.log(`Loaded ${matches.length} track matches for release ${release.id} (${audioMatchData.data.summary.totalMatched} with audio found)`);
        } else {
          // No matches data - still update state to indicate processing is complete
          setTrackMatchesByRelease(prev => ({
            ...prev,
            [release.id]: [] // Empty array indicates no matches found but processing complete
          }));
          
          console.log(`No track matches found for release ${release.id}`);
        }
        
        // Longer delay between requests to be more respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`Track matching request timed out for release ${release.id}`);
        } else {
          console.error(`Error loading track matches for release ${release.id}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }
    
    console.log('Finished auto-loading track matches for initial releases');
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Store Not Found</h1>
          <p className="text-red-400 mb-8">{error}</p>
        </div>
      </div>
    );
  }

  if (!storeData) {
    return null;
  }

  return (
    <StoreManagementTemplate
      storeName={storeData.store.username}
      releases={storeData.results || []}
      onVerifyAudio={handleVerifyAudio}
      trackMatches={trackMatches}
      trackMatchesByRelease={trackMatchesByRelease}
      onApproveMatch={handleApproveMatch}
      onRejectMatch={handleRejectMatch}
      onProvideCorrectVideo={handleProvideCorrectVideo}
    />
  );
}

export default function StorefrontPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-white mb-4">Loading store...</h1>
        </div>
      </div>
    }>
      <StorefrontContent />
    </Suspense>
  );
}