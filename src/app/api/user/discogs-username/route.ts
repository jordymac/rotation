import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // TODO: Add authentication when implementing Discogs OAuth (Phase 2)
  return NextResponse.json({
    error: 'User profile features require authentication. Coming in Phase 2 with Discogs OAuth.'
  }, { status: 501 });
}

export async function POST(request: NextRequest) {
  // TODO: Add authentication when implementing Discogs OAuth (Phase 2)
  return NextResponse.json({
    error: 'User profile features require authentication. Coming in Phase 2 with Discogs OAuth.'
  }, { status: 501 });

  /*
  Future implementation with Discogs OAuth - code preserved for Phase 2:

  const { userId } = await getDiscogsAuth();
  const { discogsUsername } = await request.json();

  if (typeof discogsUsername !== 'string') {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  // Save to database
  await saveUserDiscogsUsername(userId, discogsUsername.trim());

  return NextResponse.json({ success: true });
  */
}