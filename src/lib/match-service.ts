import { AudioMatchingService } from './audio-matching-service';
import { EnhancedAudioMatchingService } from './enhanced-audio-matching-service';

export interface MatchRecord {
  platform: string;
  match_url: string;
  confidence: number;
  approved: boolean;
  verified_by?: string;
  verified_at?: Date;
  source: 'cache' | 'database' | 'computed';
}

export interface TrackInfo {
  position: string;
  title: string;
  duration: string;
  artists: any[];
}

/**
 * Get or compute audio match with caching and persistence layers
 * 
 * Flow:
 * 1. Try Redis cache first (fastest)
 * 2. Try Postgres database (medium speed)
 * 3. Compute fresh match from APIs (slowest)
 * 4. If approved, persist to database and cache
 */
export async function getOrComputeMatch(
  releaseId: number,
  trackIndex: number,
  adminUserId: string,
  releaseTitle?: string,
  releaseArtist?: string,
  trackInfo?: TrackInfo,
  discogsVideos?: any[]
): Promise<MatchRecord> {
  console.log(`[MatchService] Getting or computing match for release ${releaseId}, track ${trackIndex}`);
  
  try {
    // 1. Try Redis cache first
    console.log(`[MatchService] Step 1: Checking Redis cache...`);
    const { getCachedMatch } = await import('./redis');
    const cached = await getCachedMatch(releaseId, trackIndex);
    if (cached) {
      console.log(`[MatchService] Cache hit! Returning cached result`);
      return {
        ...cached,
        verified_at: cached.verified_at ? new Date(cached.verified_at) : undefined,
        source: 'cache'
      };
    }

    // 2. Try Postgres database
    console.log(`[MatchService] Step 2: Checking database for existing match...`);
    try {
      const { getTrackMatch } = await import('./db');
      const dbRecord = await getTrackMatch(releaseId, trackIndex);
      if (dbRecord) {
        console.log(`[MatchService] Database hit! Caching and returning result`);
        
        // Cache the database result for future requests
        const { setCachedMatch } = await import('./redis');
        const cacheData = {
          platform: dbRecord.platform,
          match_url: dbRecord.match_url,
          confidence: dbRecord.confidence,
          approved: dbRecord.approved,
          verified_by: dbRecord.verified_by,
          verified_at: dbRecord.verified_at?.toISOString()
        };
        
        await setCachedMatch(releaseId, trackIndex, cacheData);
        
        return {
          platform: dbRecord.platform,
          match_url: dbRecord.match_url,
          confidence: dbRecord.confidence,
          approved: dbRecord.approved,
          verified_by: dbRecord.verified_by,
          verified_at: dbRecord.verified_at,
          source: 'database'
        };
      }
    } catch (error) {
      console.log(`[MatchService] Database check skipped:`, error);
    }

    // 3. Compute fresh match from external APIs
    console.log(`[MatchService] Step 3: Computing fresh match...`);
    
    if (!releaseTitle || !releaseArtist || !trackInfo) {
      throw new Error('Release title, artist, and track info are required for computing fresh matches');
    }
    
    // Use enhanced matching if Discogs videos are provided, otherwise fallback to original
    const matchResult = discogsVideos && discogsVideos.length > 0
      ? await EnhancedAudioMatchingService.findMatches(
          releaseId, 
          releaseArtist, 
          [{
            position: trackInfo.position,
            type_: 'track',
            title: trackInfo.title,
            duration: trackInfo.duration,
            artists: trackInfo.artists?.map(a => ({ name: a.name || a, id: a.id || 0 }))
          }],
          discogsVideos
        )
      : await AudioMatchingService.findMatches(
          releaseId, 
          releaseTitle, 
          releaseArtist, 
          [trackInfo]
        );
    
    // Find the match for our specific track index
    const trackMatch = matchResult.matches.find(
      (match: any) => match.trackIndex === 0 // We only process one track at a time
    );
    
    if (!trackMatch) {
      console.log(`[MatchService] No match found for track ${trackIndex}. Available tracks:`, 
        matchResult.matches.map((m: any) => ({ trackIndex: m.trackIndex, title: m.trackTitle }))
      );
      
      // Return "no match" result instead of throwing error
      return {
        platform: 'none',
        match_url: '',
        confidence: 0,
        approved: false,
        source: 'computed'
      };
    }
    
    // Get the best match - enhanced service provides bestMatch directly
    const bestMatch = (trackMatch as any).bestMatch || 
      (trackMatch.candidates && trackMatch.candidates.length > 0 ? trackMatch.candidates[0] : null);
    
    if (bestMatch) {
      console.log(`[MatchService] Found ${bestMatch.platform} match with confidence: ${bestMatch.confidence}`);
    }
    
    if (!bestMatch) {
      console.log(`[MatchService] No matches found for track ${trackIndex}`);
      return {
        platform: 'none',
        match_url: '',
        confidence: 0,
        approved: false,
        source: 'computed'
      };
    }
    
    console.log(`[MatchService] Found match: ${bestMatch.platform} (confidence: ${bestMatch.confidence})`);
    
    // Always use the highest confidence match, regardless of confidence level
    // This populates the feed with the most likely matches automatically
    const result: MatchRecord = {
      platform: bestMatch.platform,
      match_url: bestMatch.url,
      confidence: bestMatch.confidence,
      approved: true, // Always approve the best match for feed display
      verified_by: adminUserId,
      verified_at: new Date(),
      source: 'computed'
    };

    // 4. If approved, persist to database and cache
    if (result.approved) {
      console.log(`[MatchService] Auto-approving match (confidence: ${result.confidence}) - persisting to database`);
      
      const dbRecord = {
        release_id: releaseId,
        track_index: trackIndex,
        platform: result.platform,
        match_url: result.match_url,
        confidence: result.confidence,
        approved: true,
        verified_by: adminUserId
      };
      
      try {
        // Save to database
        const { saveTrackMatch } = await import('./db');
        const savedRecord = await saveTrackMatch(dbRecord);
        result.verified_at = savedRecord.verified_at;
        
        // Cache the result
        const { setCachedMatch } = await import('./redis');
        const cacheData = {
          platform: result.platform,
          match_url: result.match_url,
          confidence: result.confidence,
          approved: result.approved,
          verified_by: result.verified_by,
          verified_at: result.verified_at?.toISOString()
        };
        
        await setCachedMatch(releaseId, trackIndex, cacheData);
        
        console.log(`[MatchService] Successfully persisted approved match to database and cache`);
      } catch (error) {
        console.error(`[MatchService] Error persisting match:`, error);
        // Don't fail the request if persistence fails
      }
    } else {
      console.log(`[MatchService] Match needs manual review (confidence: ${result.confidence})`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`[MatchService] Error in getOrComputeMatch:`, error);
    throw error;
  }
}

/**
 * Manually approve a match and persist it
 */
export async function approveMatch(
  releaseId: number,
  trackIndex: number,
  platform: string,
  matchUrl: string,
  confidence: number,
  adminUserId: string
): Promise<MatchRecord> {
  console.log(`[MatchService] Manually approving match for release ${releaseId}, track ${trackIndex}`);
  
  try {
    const { saveTrackMatch } = await import('./db');
    
    const dbRecord = {
      release_id: releaseId,
      track_index: trackIndex,
      platform: platform,
      match_url: matchUrl,
      confidence: confidence,
      approved: true,
      verified_by: adminUserId
    };
    
    // Save to database
    const savedRecord = await saveTrackMatch(dbRecord);
    
    // Cache the result
    const { setCachedMatch } = await import('./redis');
    const cacheData = {
      platform: platform,
      match_url: matchUrl,
      confidence: confidence,
      approved: true,
      verified_by: adminUserId,
      verified_at: savedRecord.verified_at?.toISOString()
    };
    
    await setCachedMatch(releaseId, trackIndex, cacheData);
    
    console.log(`[MatchService] Successfully approved and persisted match`);
    
    return {
      platform: platform,
      match_url: matchUrl,
      confidence: confidence,
      approved: true,
      verified_by: adminUserId,
      verified_at: savedRecord.verified_at,
      source: 'database'
    };
    
  } catch (error) {
    console.error(`[MatchService] Error approving match:`, error);
    throw error;
  }
}

/**
 * Reject a match and optionally provide a better one
 */
export async function rejectMatch(
  releaseId: number,
  trackIndex: number,
  adminUserId: string,
  betterMatch?: {
    platform: string;
    matchUrl: string;
    confidence: number;
  }
): Promise<MatchRecord | null> {
  console.log(`[MatchService] Rejecting match for release ${releaseId}, track ${trackIndex}`);
  
  try {
    // Clear any existing cache and database entries
    await clearMatch(releaseId, trackIndex);
    
    // If a better match is provided, approve it
    if (betterMatch) {
      console.log(`[MatchService] Providing better match: ${betterMatch.platform}`);
      return await approveMatch(
        releaseId,
        trackIndex,
        betterMatch.platform,
        betterMatch.matchUrl,
        betterMatch.confidence,
        adminUserId
      );
    }
    
    console.log(`[MatchService] Match rejected with no replacement`);
    return null;
    
  } catch (error) {
    console.error(`[MatchService] Error rejecting match:`, error);
    throw error;
  }
}

/**
 * Clear a match from both cache and database
 */
export async function clearMatch(releaseId: number, trackIndex: number): Promise<void> {
  console.log(`[MatchService] Clearing match for release ${releaseId}, track ${trackIndex}`);
  
  try {
    // Clear from cache
    const { deleteCachedMatch } = await import('./redis');
    await deleteCachedMatch(releaseId, trackIndex);
    
    // Clear from database
    const { deleteTrackMatch } = await import('./db');
    await deleteTrackMatch(releaseId, trackIndex);
    
    console.log(`[MatchService] Successfully cleared match`);
  } catch (error) {
    console.error(`[MatchService] Error clearing match:`, error);
    throw error;
  }
}

/**
 * Get all matches for a release (for admin interface)
 */
export async function getMatchesForRelease(releaseId: number): Promise<MatchRecord[]> {
  console.log(`[MatchService] Getting all matches for release ${releaseId}`);
  
  try {
    const { getTrackMatchesForRelease } = await import('./db');
    const dbMatches = await getTrackMatchesForRelease(releaseId);
    
    return dbMatches.map(match => ({
      platform: match.platform,
      match_url: match.match_url,
      confidence: match.confidence,
      approved: match.approved,
      verified_by: match.verified_by,
      verified_at: match.verified_at,
      source: 'database' as const
    }));
    
  } catch (error) {
    console.error(`[MatchService] Error getting matches for release:`, error);
    throw error;
  }
}

/**
 * Bulk operations for release management
 */
export async function clearAllMatchesForRelease(releaseId: number): Promise<void> {
  console.log(`[MatchService] Clearing all matches for release ${releaseId}`);
  
  try {
    // Clear from cache
    const { clearCachedMatchesForRelease } = await import('./redis');
    await clearCachedMatchesForRelease(releaseId);
    
    // Clear from database
    const { getDatabase } = await import('./db');
    const db = getDatabase();
    await db.none('DELETE FROM track_matches WHERE release_id = $1', [releaseId]);
    
    console.log(`[MatchService] Successfully cleared all matches for release ${releaseId}`);
  } catch (error) {
    console.error(`[MatchService] Error clearing all matches for release:`, error);
    throw error;
  }
}

/**
 * System health check
 */
export async function healthCheck(): Promise<{
  redis: boolean;
  database: boolean;
  cacheStats?: any;
}> {
  const result: {
    redis: boolean;
    database: boolean;
    cacheStats?: any;
  } = {
    redis: false,
    database: false
  };
  
  try {
    // Test Redis
    const { getCacheStats } = await import('./redis');
    result.cacheStats = await getCacheStats();
    result.redis = true;
  } catch (error) {
    console.error('[MatchService] Redis health check failed:', error);
  }
  
  try {
    // Test Database
    const { testDatabaseConnection } = await import('./db');
    result.database = await testDatabaseConnection();
  } catch (error) {
    console.error('[MatchService] Database health check failed:', error);
  }
  
  return result;
}

/**
 * Create a match service instance for background processing
 */
export function createMatchService() {
  return {
    async findAudioMatches(
      releaseId: number,
      trackIndex: number,
      searchQuery: string,
      context: {
        artist: string;
        title: string;
        album: string;
        year?: number;
        duration?: string;
        label?: string;
        genres?: string[];
        styles?: string[];
      }
    ): Promise<Array<{ platform: string; url: string; confidence: number; title: string; artist: string }>> {
      console.log(`[MatchService] Finding audio matches for: "${searchQuery}"`);
      
      try {
        // Use enhanced matching with context
        const matchResult = await EnhancedAudioMatchingService.findMatches(
          releaseId,
          context.artist,
          [{
            position: (trackIndex + 1).toString(),
            type_: 'track',
            title: context.title,
            duration: context.duration || '0:00',
            artists: [{ name: context.artist, id: 0 }]
          }],
          [] // No Discogs videos for background processing
        );
        
        // Extract matches from the result
        const trackMatch = matchResult.matches.find(
          (match: any) => match.trackIndex === 0
        );
        
        if (!trackMatch || !trackMatch.candidates || trackMatch.candidates.length === 0) {
          console.log(`[MatchService] No matches found for: "${searchQuery}"`);
          return [];
        }
        
        // Return all candidates with confidence scores
        return trackMatch.candidates.map((candidate: any) => ({
          platform: candidate.platform,
          url: candidate.url,
          confidence: candidate.confidence,
          title: candidate.title || context.title,
          artist: candidate.artist || context.artist
        }));
        
      } catch (error) {
        console.error(`[MatchService] Error finding matches for "${searchQuery}":`, error);
        return [];
      }
    }
  };
}