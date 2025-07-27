import { NextRequest, NextResponse } from 'next/server';
import { createDiscogsService } from '@/lib/discogs-service';

// POST /api/wishlist - Add item to wishlist (local-first, sync-later)
export async function POST(request: NextRequest) {
  try {
    const { releaseId, userId } = await request.json();

    if (!releaseId) {
      return NextResponse.json(
        { error: 'Release ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get user's Discogs token from encrypted database storage
    // For now, we'll simulate the local-first approach
    
    // Step 1: Immediately respond with success (optimistic UI)
    const localWishlistItem = {
      id: `temp_${Date.now()}`,
      releaseId,
      addedAt: new Date().toISOString(),
      synced: false,
    };

    // TODO: Store in local database/IndexedDB
    console.log('Added to local wishlist:', localWishlistItem);

    // Step 2: Queue background sync to Discogs
    // In production, this would be a background job
    try {
      // Simulate getting user token (in production, decrypt from database)
      const userToken = process.env.DISCOGS_USER_TOKEN; // Temporary for testing
      
      if (userToken) {
        const service = createDiscogsService(userToken);
        
        // Background sync (don't await in production - use job queue)
        setTimeout(async () => {
          try {
            await service.addToWishlist(parseInt(releaseId));
            console.log(`Successfully synced release ${releaseId} to Discogs wishlist`);
            
            // TODO: Update local record to mark as synced
          } catch (syncError) {
            console.error(`Failed to sync release ${releaseId} to Discogs:`, syncError);
            
            // TODO: Queue for retry or notify user
          }
        }, 1000); // Small delay to ensure response is sent first
      }
    } catch (error) {
      console.error('Background sync setup failed:', error);
      // Don't fail the request - local add still succeeded
    }

    return NextResponse.json({
      success: true,
      item: localWishlistItem,
      message: 'Added to wishlist',
    });
  } catch (error) {
    console.error('Wishlist add failed:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get('releaseId');

    if (!releaseId) {
      return NextResponse.json(
        { error: 'Release ID is required' },
        { status: 400 }
      );
    }

    // TODO: Remove from local storage and sync to Discogs
    console.log('Removing from wishlist:', releaseId);

    return NextResponse.json({
      success: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    console.error('Wishlist remove failed:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // TODO: Get from local storage first, then sync with Discogs
    console.log('Getting wishlist for:', username);

    return NextResponse.json({
      success: true,
      items: [], // TODO: Return actual wishlist items
    });
  } catch (error) {
    console.error('Wishlist get failed:', error);
    return NextResponse.json(
      { error: 'Failed to get wishlist' },
      { status: 500 }
    );
  }
}