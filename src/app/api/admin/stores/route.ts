import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminStores } from '@/lib/storage';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For now, anyone can access admin. In production, add admin role check
  const stores = adminStores.getAll();
  
  return NextResponse.json({ stores });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await request.json();
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Valid username is required' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    
    // Check if store already exists
    const existingStores = adminStores.getAll();
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
            'Authorization': `Discogs token=${process.env.DISCOGS_TOKEN}`,
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
    const store = adminStores.add(trimmedUsername);
    
    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error('Error adding store:', error);
    return NextResponse.json({ error: 'Failed to add store' }, { status: 500 });
  }
}