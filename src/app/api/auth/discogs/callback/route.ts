import { NextRequest, NextResponse } from 'next/server';
import { DiscogsService } from '@/lib/discogs-service';
import { UserService, UserStorage } from '@/lib/user-service';

// GET /api/auth/discogs/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verifier = searchParams.get('oauth_verifier');
    const token = searchParams.get('oauth_token');
    
    // In production, get these from secure session storage
    // For now, expect them to be passed via URL params (temporary solution)
    const requestToken = searchParams.get('requestToken') || searchParams.get('oauth_token');
    const requestSecret = searchParams.get('requestSecret');

    if (!verifier || !token || !requestToken || !requestSecret) {
      return NextResponse.json(
        { error: 'Missing OAuth parameters' },
        { status: 400 }
      );
    }

    // Exchange for access token
    const accessData = await DiscogsService.getAccessToken(
      requestToken,
      requestSecret,
      verifier
    );

    // Create service with user token to get user info
    const service = new DiscogsService(accessData.token);

    const userInfo = await service.getUser();

    // Create user profile with automatic role detection
    const userProfile = await UserService.createUserProfileFromDiscogs(
      userInfo,
      accessData.token,
      accessData.secret
    );

    // Save user to storage (in production: encrypted database)
    await UserStorage.saveUser(userProfile);

    // Log successful authentication with role detection
    console.log('Discogs OAuth successful:', {
      userId: userProfile.id,
      username: userProfile.discogsUsername,
      role: userProfile.role,
      canSell: userProfile.canSell,
      sellerInfo: userProfile.sellerInfo ? 'Present' : 'None'
    });

    // TODO: Create secure session/JWT token
    // For now, pass user data via URL params

    // Redirect to success page with user info
    const successUrl = new URL('/auth/discogs-success', request.nextUrl.origin);
    successUrl.searchParams.set('username', userProfile.discogsUsername);
    successUrl.searchParams.set('role', userProfile.role);
    successUrl.searchParams.set('canSell', userProfile.canSell.toString());
    
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Discogs OAuth callback failed:', error);
    
    const errorUrl = new URL('/auth/discogs-error', request.nextUrl.origin);
    errorUrl.searchParams.set('error', 'Authentication failed');
    
    return NextResponse.redirect(errorUrl);
  }
}