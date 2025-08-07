import { NextResponse } from 'next/server';
import { 
  getQueuedReleases, 
  cacheReleaseWithMatches,
  getDatabase,
  saveTrackMatch,
  type QueuedRelease 
} from '@/lib/db';
import { createMatchService } from '@/lib/match-service';

export async function POST() {
  try {
    console.log('[Queue Processor] Starting background processing...');
    
    // Get releases to process (limit to 5 at a time for efficiency)
    const queuedReleases = await getQueuedReleases(5);
    
    if (queuedReleases.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No releases in queue to process',
        processed: 0
      });
    }

    console.log(`[Queue Processor] Processing ${queuedReleases.length} releases`);
    
    const results = {
      processed: 0,
      cached: 0,
      failed: 0,
      details: [] as Array<{
        discogs_id: number;
        status: 'cached' | 'skipped' | 'failed';
        audio_matches: number;
        error?: string;
      }>
    };

    const database = getDatabase();
    const matchService = createMatchService();

    // Process each release
    for (const release of queuedReleases) {
      try {
        console.log(`[Queue Processor] Processing release ${release.discogs_id} for store ${release.store_username}`);
        
        // Mark as processing
        await database.none(`
          UPDATE processing_queue 
          SET status = 'processing', started_at = NOW() 
          WHERE id = $1
        `, [release.id]);

        // Parse release data
        const releaseData = typeof release.release_data === 'string' 
          ? JSON.parse(release.release_data) 
          : release.release_data;

        // Enhanced audio matching for all tracks
        let totalMatches = 0;
        const tracklist = releaseData.release?.tracklist || [];

        if (tracklist.length > 0) {
          console.log(`[Queue Processor] Finding audio matches for ${tracklist.length} tracks`);
          
          for (let trackIndex = 0; trackIndex < tracklist.length; trackIndex++) {
            const track = tracklist[trackIndex];
            
            if (!track.title || track.title.trim() === '') {
              continue; // Skip tracks without titles
            }

            try {
              // Enhanced search query with mix-aware terminology
              const searchQuery = `${releaseData.release.artist} ${track.title}`;
              
              console.log(`[Queue Processor] Searching for track: "${searchQuery}"`);
              
              const matches = await matchService.findAudioMatches(
                release.discogs_id,
                trackIndex,
                searchQuery,
                {
                  artist: releaseData.release.artist,
                  title: track.title,
                  album: releaseData.release.title,
                  year: releaseData.release.year,
                  duration: track.duration,
                  // Enhanced context for better matching
                  label: releaseData.release.label,
                  genres: releaseData.release.genres || [],
                  styles: releaseData.release.styles || []
                }
              );

              if (matches && matches.length > 0) {
                // Only count matches with confidence >= 50%
                const confidentMatches = matches.filter(match => match.confidence >= 0.5);
                
                if (confidentMatches.length > 0) {
                  // Save the best match to database
                  const bestMatch = confidentMatches[0]; // Already sorted by confidence
                  
                  try {
                    await saveTrackMatch({
                      release_id: release.discogs_id,
                      track_index: trackIndex,
                      platform: bestMatch.platform,
                      match_url: bestMatch.url,
                      confidence: bestMatch.confidence,
                      approved: true, // Auto-approve confident matches
                      verified_by: 'background-processor'
                    });
                    
                    totalMatches++;
                    console.log(`[Queue Processor] Saved confident match for track ${trackIndex + 1}: ${bestMatch.platform} (${Math.round(bestMatch.confidence * 100)}%)`);
                  } catch (saveError) {
                    console.error(`[Queue Processor] Error saving track match:`, saveError);
                  }
                }
              }
              
              // Small delay to respect rate limits
              await new Promise(resolve => setTimeout(resolve, 100));
              
            } catch (trackError) {
              console.error(`[Queue Processor] Error processing track ${trackIndex}:`, trackError);
              // Continue with other tracks even if one fails
            }
          }
        }

        console.log(`[Queue Processor] Release ${release.discogs_id} total confident matches: ${totalMatches}`);

        // Only cache releases with audio matches (confidence threshold met)
        if (totalMatches > 0) {
          console.log(`[Queue Processor] Caching release ${release.discogs_id} with ${totalMatches} audio matches`);
          
          const cached = await cacheReleaseWithMatches(
            release.store_username,
            release.discogs_id,
            releaseData.release,
            totalMatches
          );

          if (cached) {
            results.cached++;
            results.details.push({
              discogs_id: release.discogs_id,
              status: 'cached',
              audio_matches: totalMatches
            });
            
            // Mark as completed
            await database.none(`
              UPDATE processing_queue 
              SET status = 'completed', completed_at = NOW() 
              WHERE id = $1
            `, [release.id]);
            
          } else {
            throw new Error('Failed to cache release in database');
          }
        } else {
          console.log(`[Queue Processor] Skipping release ${release.discogs_id} - no confident audio matches found`);
          
          results.details.push({
            discogs_id: release.discogs_id,
            status: 'skipped',
            audio_matches: 0
          });
          
          // Mark as completed but don't cache
          await database.none(`
            UPDATE processing_queue 
            SET status = 'completed', completed_at = NOW() 
            WHERE id = $1
          `, [release.id]);
        }

        results.processed++;

      } catch (error) {
        console.error(`[Queue Processor] Error processing release ${release.discogs_id}:`, error);
        
        results.failed++;
        results.details.push({
          discogs_id: release.discogs_id,
          status: 'failed',
          audio_matches: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Mark as failed and increment retry count
        await database.none(`
          UPDATE processing_queue 
          SET status = 'failed', 
              error_message = $2,
              retry_count = retry_count + 1,
              completed_at = NOW()
          WHERE id = $1
        `, [release.id, error instanceof Error ? error.message : 'Unknown error']);
      }
    }

    console.log(`[Queue Processor] Batch complete: ${results.processed} processed, ${results.cached} cached, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} releases`,
      ...results
    });

  } catch (error) {
    console.error('[Queue Processor] Error:', error);
    return NextResponse.json(
      { 
        error: 'Background processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return processing queue status
    const database = getDatabase();
    
    const [queueStats, recentProcessed] = await Promise.all([
      database.one(`
        SELECT 
          COUNT(*) as total_queued,
          COUNT(*) FILTER (WHERE status = 'queued') as pending,
          COUNT(*) FILTER (WHERE status = 'processing') as processing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM processing_queue
      `),
      database.manyOrNone(`
        SELECT discogs_id, store_username, status, completed_at, error_message
        FROM processing_queue 
        WHERE status IN ('completed', 'failed')
        ORDER BY completed_at DESC 
        LIMIT 10
      `)
    ]);

    return NextResponse.json({
      success: true,
      queueStats: {
        total: parseInt(queueStats.total_queued),
        pending: parseInt(queueStats.pending),
        processing: parseInt(queueStats.processing), 
        completed: parseInt(queueStats.completed),
        failed: parseInt(queueStats.failed)
      },
      recentProcessed: recentProcessed || []
    });

  } catch (error) {
    console.error('[Queue Processor] Error getting status:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}