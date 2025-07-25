import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userDiscogsUsernames } from '@/lib/storage';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const discogsUsername = userDiscogsUsernames.get(userId) || '';
  
  return NextResponse.json({ discogsUsername });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { discogsUsername } = await request.json();
    
    if (typeof discogsUsername !== 'string') {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    // Save the username (in production, save to database)
    userDiscogsUsernames.set(userId, discogsUsername.trim());
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving discogs username:', error);
    return NextResponse.json({ error: 'Failed to save username' }, { status: 500 });
  }
}