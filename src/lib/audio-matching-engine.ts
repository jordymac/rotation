// Audio Matching Engine
// Core matching algorithm with mix-aware intelligence
// Prioritizes Discogs embedded videos, falls back to YouTube Data API search

interface DiscogsVideo {
  uri: string;
  title: string;
  description: string;
  duration: number; // in seconds
  embed: boolean;
}

interface DiscogsTrack {
  position: string;
  type_: string;
  title: string;
  duration: string; // format: "3:32"
  artists?: Array<{
    name: string;
    id: number;
  }>;
}

interface TrackCandidate {
  platform: 'youtube';
  id: string;
  videoId: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  url: string;
  thumbnailUrl?: string;
  embedUrl: string;
  confidence: number; // 0-100
  classification: 'high' | 'medium' | 'low';
  source: 'discogs_embedded' | 'youtube_search';
}

interface TrackMatch {
  trackIndex: number;
  trackPosition: string;
  trackTitle: string;
  trackArtist: string;
  trackDuration: number;
  candidates: TrackCandidate[];
  bestMatch: TrackCandidate | null;
}

interface EnhancedAudioMatchResult {
  releaseId: number;
  totalTracks: number;
  processedTracks: number;
  matches: TrackMatch[];
  summary: {
    discogsMatches: number;
    searchMatches: number;
    noMatches: number;
    totalMatched: number;
  };
}

// Utility functions
function parseTrackDuration(duration: string): number {
  if (!duration || typeof duration !== 'string') {
    return 180; // Default 3 minutes
  }
  
  const parts = duration.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 180; // Default 3 minutes
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Mix normalization mapping for dance/electronic music
const mixNormalizations = {
  'radio': ['radio', 'radio edit', 'radio version', 'radio mix', 'edit', 'single edit', 'short edit'],
  'extended': ['extended', 'extended mix', '12"', '12 inch', 'club mix', 'club version', 'full length', 'long version'],
  'dub': ['dub', 'dub mix', 'dub version', 'instrumental', 'inst', 'instro'],
  'original': ['original', 'original mix', 'original version', '7"', '7 inch', 'album version'],
  'remix': ['remix', 'rmx', 'rework', 'refix', 'rework'],
  'accapella': ['accapella', 'acapella', 'vocal', 'vocals only', 'a cappella'],
  'beats': ['beats', 'beats mix', 'beatmix', 'drum mix', 'drums'],
  'clean': ['clean', 'clean version', 'clean mix', 'clean edit'],
  'dirty': ['dirty', 'explicit', 'uncensored', 'uncut'],
  'live': ['live', 'live version', 'live mix', 'concert version']
};

interface MixInfo {
  baseName: string;
  mixType: string | null;
  confidence: number;
}

function extractMixInfo(title: string): MixInfo {
  if (!title || typeof title !== 'string') {
    return {
      baseName: '',
      mixType: 'original',
      confidence: 50
    };
  }
  
  const cleanTitle = title.toLowerCase().trim();
  
  // Look for content in parentheses or brackets
  const mixMatches = cleanTitle ? cleanTitle.match(/[\(\[]([^)\]]+)[\)\]]/g) : null;
  
  if (!mixMatches) {
    return {
      baseName: title.trim(),
      mixType: 'original', // Default to original if no mix specified
      confidence: 90
    };
  }
  
  // Extract and normalize mix information
  for (const match of mixMatches) {
    const mixContent = match.replace(/[\(\[\)\]]/g, '').toLowerCase().trim();
    
    // Check against our normalization map
    for (const [normalizedType, variations] of Object.entries(mixNormalizations)) {
      for (const variation of variations) {
        if (mixContent.includes(variation) || variation.includes(mixContent)) {
          const baseName = title.replace(match, '').trim();
          return {
            baseName,
            mixType: normalizedType,
            confidence: 95
          };
        }
      }
    }
  }
  
  // If we found parentheses but no known mix type, extract as unknown mix
  const lastMatch = mixMatches[mixMatches.length - 1];
  const unknownMix = lastMatch.replace(/[\(\[\)\]]/g, '').toLowerCase().trim();
  const baseName = title.replace(lastMatch, '').trim();
  
  return {
    baseName,
    mixType: unknownMix,
    confidence: 70 // Lower confidence for unknown mix types
  };
}

function calculateMixCompatibility(trackMix: MixInfo, candidateMix: MixInfo): number {
  // Exact mix type match
  if (trackMix.mixType === candidateMix.mixType) {
    return 100;
  }
  
  // Both are original/default
  if ((trackMix.mixType === 'original' || !trackMix.mixType) && 
      (candidateMix.mixType === 'original' || !candidateMix.mixType)) {
    return 95;
  }
  
  // Define strict incompatible mix types - these should NEVER match
  const incompatiblePairs = [
    ['radio', 'dub'],
    ['radio', 'instrumental'], 
    ['radio', 'remix'],
    ['radio', 'extended'],
    ['dub', 'radio'],
    ['dub', 'extended'],
    ['dub', 'remix'],
    ['instrumental', 'radio'],
    ['instrumental', 'extended'],
    ['instrumental', 'remix'],
    ['remix', 'radio'],
    ['remix', 'dub'],
    ['remix', 'instrumental'],
    ['remix', 'extended'],        // Extended ≠ Remix - fundamentally different
    ['extended', 'radio'],
    ['extended', 'dub'],
    ['extended', 'remix'],        // Extended ≠ Remix - fundamentally different
    ['accapella', 'instrumental'],
    ['beats', 'radio'],
    ['clean', 'dirty'],
    ['live', 'radio'],
    ['live', 'dub']
  ];
  
  // Check for incompatible pairs
  for (const [type1, type2] of incompatiblePairs) {
    if ((trackMix.mixType === type1 && candidateMix.mixType === type2) ||
        (trackMix.mixType === type2 && candidateMix.mixType === type1)) {
      return 20; // Very low compatibility for incompatible types
    }
  }
  
  // Only allow limited compatible relationships:
  
  // 1. Original can substitute for most things (but not vice versa)
  if (candidateMix.mixType === 'original' && trackMix.mixType !== 'original') {
    return 75; // Original video can work for specific mix request
  }
  
  // 2. Dub and instrumental are essentially the same
  if ((trackMix.mixType === 'dub' && candidateMix.mixType === 'instrumental') ||
      (trackMix.mixType === 'instrumental' && candidateMix.mixType === 'dub')) {
    return 90;
  }
  
  // 3. Clean/dirty versions of same mix type
  if ((trackMix.mixType === 'clean' && candidateMix.mixType === 'dirty') ||
      (trackMix.mixType === 'dirty' && candidateMix.mixType === 'clean')) {
    return 85;
  }
  
  // Everything else is incompatible
  return 25;
}

// Enhanced string similarity with mix-aware matching
function calculateStringSimilarity(str1: string, str2: string): number {
  // Extract mix info for intelligent comparison
  const mix1 = extractMixInfo(str1);
  const mix2 = extractMixInfo(str2);
  
  // Early exact match check
  if (str1.toLowerCase().trim() === str2.toLowerCase().trim()) return 100;
  
  // Calculate base title similarity (without mix info) using Levenshtein distance
  const s1 = mix1.baseName.toLowerCase().trim();
  const s2 = mix2.baseName.toLowerCase().trim();
  
  if (s1 === s2) {
    // Base titles match exactly, now factor in mix compatibility
    const mixCompatibility = calculateMixCompatibility(mix1, mix2);
    return Math.round((95 * 0.8) + (mixCompatibility * 0.2)); // Weighted towards base match
  }
  
  // Calculate Levenshtein distance for base titles
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
  const baseSimilarity = Math.round(((maxLength - distance) / maxLength) * 100);
  
  // Calculate mix compatibility
  const mixCompatibility = calculateMixCompatibility(mix1, mix2);
  
  // Weighted combination: base title 75%, mix compatibility 25%
  // This ensures mix types have significant influence on matching
  const finalSimilarity = Math.round((baseSimilarity * 0.75) + (mixCompatibility * 0.25));
  
  return Math.min(100, Math.max(0, finalSimilarity));
}

function calculateDurationSimilarity(originalDuration: number, candidateDuration: number): number {
  const difference = Math.abs(originalDuration - candidateDuration);
  if (difference <= 2) return 100; // Perfect match within 2 seconds
  if (difference <= 5) return 80;  // Good match within 5 seconds
  if (difference <= 10) return 60; // Acceptable match within 10 seconds
  if (difference <= 30) return 40; // Poor match within 30 seconds
  return 20; // Very poor match
}

function calculateMatchConfidence(
  originalTitle: string,
  originalArtist: string,
  originalDuration: number,
  candidateTitle: string,
  candidateArtist: string,
  candidateDuration: number,
  isDiscogsEmbed: boolean = false
): number {
  const titleSimilarity = calculateStringSimilarity(originalTitle, candidateTitle);
  const artistSimilarity = calculateStringSimilarity(originalArtist, candidateArtist);
  const durationSimilarity = calculateDurationSimilarity(originalDuration, candidateDuration);
  
  // Weighted average: title 40%, artist 35%, duration 25%
  let confidence = Math.round(
    (titleSimilarity * 0.4) + (artistSimilarity * 0.35) + (durationSimilarity * 0.25)
  );
  
  // Boost confidence for Discogs embedded videos (they're more reliable)
  if (isDiscogsEmbed) {
    confidence = Math.min(100, confidence + 15);
  }
  
  return Math.min(100, Math.max(0, confidence));
}

function classifyConfidence(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 85) return 'high';  // Raised threshold for better quality
  if (confidence >= 65) return 'medium'; // Raised threshold for better quality
  return 'low';
}

// YouTube Data API search (fallback)
async function searchYouTube(query: string): Promise<Partial<TrackCandidate>[]> {
  console.log(`[YouTube API] Fallback search: ${query}`);
  
  try {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn('[YouTube API] No API key found, skipping fallback search');
      return [];
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`YouTube search failed: ${searchResponse.status}`);
    }
    
    const searchText = await searchResponse.text();
    if (!searchText.trim()) {
      console.warn('[YouTube API] Empty response from search API');
      return [];
    }
    
    const searchData = JSON.parse(searchText);
    
    // Get video details for duration
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    
    if (!detailsResponse.ok) {
      throw new Error(`YouTube details failed: ${detailsResponse.status}`);
    }
    
    const detailsText = await detailsResponse.text();
    if (!detailsText.trim()) {
      console.warn('[YouTube API] Empty response from details API');
      return [];
    }
    
    const detailsData = JSON.parse(detailsText);
    
    return detailsData.items.map((video: any) => {
      const duration = parseYouTubeDuration(video.contentDetails.duration);
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
        source: 'youtube_search' as const
      };
    });
  } catch (error) {
    console.error('[YouTube API] Search error:', error);
    return [];
  }
}

// Parse YouTube duration format (PT4M13S) to seconds
function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]?.replace('H', '') || '0');
  const minutes = parseInt(match[2]?.replace('M', '') || '0');
  const seconds = parseInt(match[3]?.replace('S', '') || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Main audio matching engine
export class AudioMatchingEngine {
  static async findMatches(
    releaseId: number,
    releaseArtist: string,
    tracks: DiscogsTrack[],
    discogsVideos: DiscogsVideo[] = []
  ): Promise<EnhancedAudioMatchResult> {
    console.log(`[EnhancedAudioMatchingService] Starting enhanced audio matching for release ${releaseId}`);
    console.log(`[EnhancedAudioMatchingService] Found ${discogsVideos.length} embedded videos from Discogs`);
    console.log(`[EnhancedAudioMatchingService] Processing ${Math.min(tracks.length, 10)} of ${tracks.length} tracks`);

    const tracksToProcess = tracks.slice(0, 10);
    const matches: TrackMatch[] = [];
    let discogsMatches = 0;
    let searchMatches = 0;

    for (let i = 0; i < tracksToProcess.length; i++) {
      const track = tracksToProcess[i];
      console.log(`[EnhancedAudioMatchingService] Processing track ${i}: ${track.position} - ${track.title}`);
      
      const trackDurationSeconds = parseTrackDuration(track.duration);
      const trackArtist = track.artists && track.artists.length > 0 
        ? track.artists[0].name 
        : releaseArtist;

      const candidates: TrackCandidate[] = [];

      // STEP 1: Process Discogs embedded videos first
      for (const video of discogsVideos) {
        const videoId = extractYouTubeVideoId(video.uri);
        if (!videoId) continue;

        const confidence = calculateMatchConfidence(
          track.title,
          trackArtist,
          trackDurationSeconds,
          video.title,
          releaseArtist, // Videos are typically attributed to the release artist
          video.duration,
          true // isDiscogsEmbed = true for confidence boost
        );

        // Only include matches with reasonable confidence (65% minimum)
        if (confidence >= 65) {
          candidates.push({
          platform: 'youtube',
          id: videoId,
          videoId: videoId,
          title: video.title,
          artist: releaseArtist,
          duration: video.duration,
          url: video.uri,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          confidence,
          classification: classifyConfidence(confidence),
          source: 'discogs_embedded'
          });
        }
      }

      // STEP 2: Fallback to YouTube Data API search if no good Discogs matches  
      const bestDiscogsMatch = candidates
        .filter(c => c.source === 'discogs_embedded')
        .sort((a, b) => b.confidence - a.confidence)[0];

      if (!bestDiscogsMatch || bestDiscogsMatch.classification === 'low') {
        console.log(`[EnhancedAudioMatchingService] No high-confidence Discogs match for track ${i}, using YouTube search fallback`);
        
        const searchQuery = `${trackArtist} - ${track.title}`;
        const searchResults = await searchYouTube(searchQuery);
        
        for (const result of searchResults) {
          if (!result.videoId) continue;
          
          const confidence = calculateMatchConfidence(
            track.title,
            trackArtist,
            trackDurationSeconds,
            result.title || '',
            result.artist || '',
            result.duration || 0,
            false // isDiscogsEmbed = false
          );

          // Only include matches with reasonable confidence (50% minimum for YouTube search)
          if (confidence >= 50) {
            candidates.push({
            platform: 'youtube',
            id: result.videoId,
            videoId: result.videoId,
            title: result.title || '',
            artist: result.artist || '',
            duration: result.duration || 0,
            url: result.url || '',
            embedUrl: result.embedUrl || '',
            thumbnailUrl: result.thumbnailUrl,
            confidence,
            classification: classifyConfidence(confidence),
            source: 'youtube_search'
            });
          }
        }
      }

      // Sort all candidates by confidence (highest first)
      candidates.sort((a, b) => b.confidence - a.confidence);
      
      // Select best match
      const bestMatch = candidates.length > 0 ? candidates[0] : null;
      
      if (bestMatch) {
        if (bestMatch.source === 'discogs_embedded') {
          discogsMatches++;
        } else {
          searchMatches++;
        }
        
        console.log(`[EnhancedAudioMatchingService] Best match for track ${i}: ${bestMatch.source} (confidence: ${bestMatch.confidence}%)`);
      } else {
        console.log(`[EnhancedAudioMatchingService] No match found for track ${i}`);
      }

      matches.push({
        trackIndex: i,
        trackPosition: track.position,
        trackTitle: track.title,
        trackArtist: trackArtist,
        trackDuration: trackDurationSeconds,
        candidates,
        bestMatch
      });
    }

    const summary = {
      discogsMatches,
      searchMatches,
      noMatches: tracksToProcess.length - discogsMatches - searchMatches,
      totalMatched: discogsMatches + searchMatches
    };

    console.log(`[EnhancedAudioMatchingService] Summary:`, summary);

    return {
      releaseId,
      totalTracks: tracks.length,
      processedTracks: tracksToProcess.length,
      matches,
      summary
    };
  }
}

export type { TrackCandidate, TrackMatch, EnhancedAudioMatchResult, DiscogsVideo, DiscogsTrack };