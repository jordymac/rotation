import { NextRequest, NextResponse } from 'next/server';
import { supabaseStores } from '@/lib/db-supabase';

export async function GET() {
  // TODO: Add authentication when implementing Discogs OAuth (Phase 2)
  // Will protect admin routes for store owners only
  const stores = await supabaseStores.getAll();
  
  return NextResponse.json({ stores });
}

export async function POST(request: NextRequest) {
  // TODO: Add authentication when implementing Discogs OAuth (Phase 2)

  try {
    const { username } = await request.json();
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Valid username is required' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    
    // Check if store already exists
    const existingStores = await supabaseStores.getAll();
    if (existingStores.some(store => store.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      return NextResponse.json({ error: 'Store already exists' }, { status: 400 });
    }

    // Validate that the Discogs user exists and has inventory (skip validation for testing)
    try {
      const response = await fetch(
        `https://api.discogs.com/users/${trimmedUsername}/inventory?status=For%20Sale&per_page=1`,
        {
          headers: {
            'User-Agent': 'Rotation/1.0 +https://rotation.app',
            'Authorization': `Discogs token=${process.env.DISCOGS_USER_TOKEN}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`Store ${trimmedUsername} validation: ${data.pagination?.items || 0} items`);
      } else {
        console.log(`Store ${trimmedUsername} validation failed: ${response.status} (will use mock data)`);
      }
    } catch (error) {
      console.error('Error validating Discogs store:', error);
      console.log(`Store ${trimmedUsername} will use mock data`);
    }

    // Add the store
    const store = await supabaseStores.add(trimmedUsername);
    
    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error('Error adding store:', error);
    return NextResponse.json({ 
      error: 'Failed to add store', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}