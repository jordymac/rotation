// Audio Matching Service for Multi-Platform Integration
// Supports YouTube and SoundCloud

interface TrackCandidate {
  platform: 'youtube' | 'soundcloud';
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string; // For SoundCloud MP3 stream URL
  embedUrl?: string; // For YouTube embed URL
  videoId?: string; // For YouTube video ID
  confidence: number; // 0-100
  classification: 'high' | 'medium' | 'low';
  // SoundCloud specific fields
  transcodings?: Array<{
    url: string;
    preset: string;
    duration: number;
    snipped: boolean;
    format: {
      protocol: string;
      mime_type: string;
    };
  }>;
}

interface TrackMatch {
  trackPosition: string;
  trackTitle: string;
  trackArtist: string;
  trackDuration: number;
  candidates: TrackCandidate[];
  autoApproved: TrackCandidate[];
  needsReview: TrackCandidate[];
  rejected: TrackCandidate[];
}

interface AudioMatchResult {
  releaseId: number;
  totalTracks: number;
  processedTracks: number; // Max 10
  matches: TrackMatch[];
  summary: {
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    autoApproved: number;
    needsReview: number;
  };
}

// Simple string similarity using Levenshtein distance
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const matrix = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s1.length][s2.length];
  return Math.round(((maxLength - distance) / maxLength) * 100);
}

// Calculate duration similarity (within 2 seconds = high confidence)
function calculateDurationSimilarity(originalDuration: number, candidateDuration: number): number {
  const difference = Math.abs(originalDuration - candidateDuration);
  if (difference <= 2) return 100; // Perfect match within 2 seconds
  if (difference <= 5) return 80;  // Good match within 5 seconds
  if (difference <= 10) return 60; // Acceptable match within 10 seconds
  if (difference <= 30) return 40; // Poor match within 30 seconds
  return 20; // Very poor match
}

// Calculate overall match confidence
function calculateMatchConfidence(
  originalTitle: string,
  originalArtist: string,
  originalDuration: number,
  candidateTitle: string,
  candidateArtist: string,
  candidateDuration: number
): number {
  const titleSimilarity = calculateStringSimilarity(originalTitle, candidateTitle);
  const artistSimilarity = calculateStringSimilarity(originalArtist, candidateArtist);
  const durationSimilarity = calculateDurationSimilarity(originalDuration, candidateDuration);
  
  // Weighted average: title 40%, artist 35%, duration 25%
  const confidence = Math.round(
    (titleSimilarity * 0.4) + (artistSimilarity * 0.35) + (durationSimilarity * 0.25)
  );
  
  return Math.min(100, Math.max(0, confidence));
}

// Classify confidence level
function classifyConfidence(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence > 90) return 'high';
  if (confidence >= 70) return 'medium';
  return 'low';
}

// Real API implementations
class PlatformAPIService {
  static async searchYouTube(query: string): Promise<Partial<TrackCandidate>[]> {
    console.log(`[YouTube API] Searching: ${query}`);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!apiKey) {
        console.warn('[YouTube API] No API key found, using mock data');
        return await this.mockYouTubeSearch(query);
      }

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        throw new Error(`YouTube search failed: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      
      // Get video details for duration
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      
      if (!detailsResponse.ok) {
        throw new Error(`YouTube details failed: ${detailsResponse.status}`);
      }
      
      const detailsData = await detailsResponse.json();
      
      return detailsData.items.map((video: any) => {
        const duration = this.parseYouTubeDuration(video.contentDetails.duration);
        const videoId = video.id;
        
        return {
          platform: 'youtube' as const,
          id: videoId,
          videoId: videoId,
          title: video.snippet.title,
          artist: video.snippet.channelTitle,
          duration: duration,
          url: `https://youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        };
      });
    } catch (error) {
      console.error('[YouTube API] Error:', error);
      return await this.mockYouTubeSearch(query);
    }
  }

  static async searchSoundCloud(query: string): Promise<Partial<TrackCandidate>[]> {
    console.log(`[SoundCloud API] Searching: ${query}`);
    
    try {
      // Support multiple client IDs separated by commas for fallback
      const clientIdsEnv = process.env.NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID;
      if (!clientIdsEnv) {
        console.warn('[SoundCloud API] No client ID found, using mock data');
        console.warn('[SoundCloud API] To get a client ID: Go to soundcloud.com → F12 → Network → look for api-v2.soundcloud.com requests');
        return await this.mockSoundCloudSearch(query);
      }

      const clientIds = clientIdsEnv.split(',').map(id => id.trim());
      let workingClientId = null;
      
      // Try each client ID until we find one that works
      for (const clientId of clientIds) {
        if (await this.validateSoundCloudClientId(clientId)) {
          workingClientId = clientId;
          console.log(`[SoundCloud API] Using client ID: ${clientId.substring(0, 8)}...`);
          break;
        } else {
          console.warn(`[SoundCloud API] Client ID ${clientId.substring(0, 8)}... failed validation`);
        }
      }
      
      if (!workingClientId) {
        console.warn('[SoundCloud API] No working client IDs found, using mock data');
        console.warn('[SoundCloud API] Extract fresh client IDs from soundcloud.com and test with: node scripts/test-soundcloud-client-id.js <client_id>');
        return await this.mockSoundCloudSearch(query);
      }

      const searchUrl = `https://api.soundcloud.com/tracks?q=${encodeURIComponent(query)}&client_id=${workingClientId}&limit=3`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('[SoundCloud API] Unauthorized - client ID may be invalid or expired');
          console.warn('[SoundCloud API] Try extracting a new client ID from soundcloud.com network requests');
        }
        throw new Error(`SoundCloud search failed: ${response.status}`);
      }
      
      const tracks = await response.json();
      
      const results = await Promise.all(tracks.map(async (track: any) => {
        let previewUrl = null;
        
        // Get streamable URL from media transcodings
        if (track.media && track.media.transcodings) {
          const mp3Transcoding = track.media.transcodings.find(
            (t: any) => t.format.mime_type === 'audio/mpeg' && t.format.protocol === 'progressive'
          );
          
          if (mp3Transcoding) {
            try {
              const streamResponse = await fetch(`${mp3Transcoding.url}?client_id=${workingClientId}`);
              if (streamResponse.ok) {
                const streamData = await streamResponse.json();
                previewUrl = streamData.url;
              }
            } catch (err) {
              console.warn('[SoundCloud API] Failed to get stream URL:', err);
            }
          }
        }
        
        return {
          platform: 'soundcloud' as const,
          id: track.id.toString(),
          title: track.title,
          artist: track.user.username,
          duration: Math.floor(track.duration / 1000), // Convert from ms to seconds
          url: track.permalink_url,
          previewUrl: previewUrl,
          thumbnailUrl: track.artwork_url || track.user.avatar_url,
          transcodings: track.media?.transcodings,
        };
      }));
      
      return results;
    } catch (error) {
      console.error('[SoundCloud API] Error:', error);
      return await this.mockSoundCloudSearch(query);
    }
  }

  // Fallback mock methods
  private static async mockYouTubeSearch(query: string): Promise<Partial<TrackCandidate>[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        platform: 'youtube' as const,
        id: `mock_yt_${Math.random().toString(36).substring(2, 11)}`,
        videoId: `mock_yt_${Math.random().toString(36).substring(2, 11)}`,
        title: query.split(' - ')[1] || query,
        artist: query.split(' - ')[0] || 'Unknown Artist',
        duration: 180 + Math.floor(Math.random() * 120),
        url: `https://youtube.com/watch?v=mock_${Math.random().toString(36).substring(2, 11)}`,
        embedUrl: `https://www.youtube.com/embed/mock_${Math.random().toString(36).substring(2, 11)}`,
        thumbnailUrl: `https://img.youtube.com/vi/mock/maxresdefault.jpg`,
      }
    ];
  }

  private static async mockSoundCloudSearch(query: string): Promise<Partial<TrackCandidate>[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [
      {
        platform: 'soundcloud' as const,
        id: `mock_sc_${Math.random().toString(36).substring(2, 11)}`,
        title: query.split(' - ')[1] || query,
        artist: query.split(' - ')[0] || 'Unknown Artist',
        duration: 175 + Math.floor(Math.random() * 130),
        url: `https://soundcloud.com/mock/${Math.random().toString(36).substring(2, 11)}`,
        previewUrl: undefined, // No preview for mock data
      }
    ];
  }

  // Parse YouTube duration format (PT4M13S) to seconds
  private static parseYouTubeDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Validate SoundCloud client ID by making a simple API request
  private static async validateSoundCloudClientId(clientId: string): Promise<boolean> {
    try {
      // Use a simple search request to test the client ID
      const testUrl = `https://api.soundcloud.com/tracks?q=test&client_id=${clientId}&limit=1`;
      const response = await fetch(testUrl);
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data); // Should return an array of tracks
      }
      
      return false;
    } catch (error) {
      console.warn(`[SoundCloud API] Client ID ${clientId.substring(0, 8)}... validation failed:`, error);
      return false;
    }
  }

}

// Main audio matching service
export class AudioMatchingService {
  static async findMatches(
    releaseId: number,
    releaseTitle: string,
    releaseArtist: string,
    tracks: Array<{
      position: string;
      title: string;
      duration: string;
      artists?: Array<{ name: string; id: number; }>;
    }>
  ): Promise<AudioMatchResult> {
    console.log(`[AudioMatchingService] Starting audio matching for release ${releaseId}`);
    console.log(`[AudioMatchingService] Processing up to 10 tracks (${Math.min(tracks.length, 10)} total)`);

    // Limit to first 10 tracks
    const tracksToProcess = tracks.slice(0, 10);
    const matches: TrackMatch[] = [];

    for (const track of tracksToProcess) {
      console.log(`[AudioMatchingService] Processing track: ${track.position} - ${track.title}`);
      
      // Parse duration (convert "3:45" to seconds)
      const durationParts = track.duration.split(':');
      const trackDurationSeconds = durationParts.length === 2 
        ? parseInt(durationParts[0]) * 60 + parseInt(durationParts[1])
        : 180; // Default 3 minutes

      // Determine track artist (use track artist if available, otherwise release artist)
      const trackArtist = track.artists && track.artists.length > 0 
        ? track.artists[0].name 
        : releaseArtist;

      // Create search query
      const searchQuery = `${trackArtist} - ${track.title}`;

      // Search all platforms in parallel
      const [youtubeResults, soundcloudResults] = await Promise.all([
        PlatformAPIService.searchYouTube(searchQuery).catch(err => {
          console.error('[YouTube API] Error:', err);
          return [];
        }),
        PlatformAPIService.searchSoundCloud(searchQuery).catch(err => {
          console.error('[SoundCloud API] Error:', err);
          return [];
        })
      ]);

      // Combine all results and calculate confidence scores
      const allCandidates: TrackCandidate[] = [
        ...youtubeResults,
        ...soundcloudResults
      ].map(candidate => {
        const confidence = calculateMatchConfidence(
          track.title,
          trackArtist,
          trackDurationSeconds,
          candidate.title || '',
          candidate.artist || '',
          candidate.duration || 0
        );

        return {
          ...candidate,
          confidence,
          classification: classifyConfidence(confidence)
        } as TrackCandidate;
      });

      // Sort by confidence (highest first)
      allCandidates.sort((a, b) => b.confidence - a.confidence);

      // Classify candidates
      const autoApproved = allCandidates.filter(c => c.classification === 'high');
      const needsReview = allCandidates.filter(c => c.classification === 'medium');
      const rejected = allCandidates.filter(c => c.classification === 'low');

      matches.push({
        trackPosition: track.position,
        trackTitle: track.title,
        trackArtist: trackArtist,
        trackDuration: trackDurationSeconds,
        candidates: allCandidates,
        autoApproved,
        needsReview,
        rejected
      });

      console.log(`[AudioMatchingService] Track ${track.position}: ${autoApproved.length} auto-approved, ${needsReview.length} need review, ${rejected.length} rejected`);
    }

    // Calculate summary
    const summary = {
      highConfidence: matches.reduce((sum, match) => sum + match.autoApproved.length, 0),
      mediumConfidence: matches.reduce((sum, match) => sum + match.needsReview.length, 0),
      lowConfidence: matches.reduce((sum, match) => sum + match.rejected.length, 0),
      autoApproved: matches.reduce((sum, match) => sum + match.autoApproved.length, 0),
      needsReview: matches.reduce((sum, match) => sum + match.needsReview.length, 0)
    };

    console.log(`[AudioMatchingService] Summary:`, summary);

    return {
      releaseId,
      totalTracks: tracks.length,
      processedTracks: tracksToProcess.length,
      matches,
      summary
    };
  }
}

export type { TrackCandidate, TrackMatch, AudioMatchResult };