import { NextRequest, NextResponse } from 'next/server';
import { DiscogsService } from '@/lib/discogs-service';

// GET /api/auth/discogs - Start OAuth flow
export async function GET(request: NextRequest) {
  try {
    const callbackUrl = `${request.nextUrl.origin}/api/auth/discogs/callback`;

    const authData = await DiscogsService.getAuthUrl(callbackUrl);

    // Store request token and secret in session/cookies for callback
    // For now, we'll include them in the redirect URL (in production, use secure session storage)
    const redirectUrl = new URL('/auth/discogs-connecting', request.nextUrl.origin);
    redirectUrl.searchParams.set('authUrl', authData.url);
    redirectUrl.searchParams.set('requestToken', authData.requestToken);
    redirectUrl.searchParams.set('requestSecret', authData.requestSecret);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Discogs OAuth initiation failed:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Discogs OAuth' },
      { status: 500 }
    );
  }
}