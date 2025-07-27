import { NextRequest, NextResponse } from 'next/server';
import { UserStorage } from '@/lib/user-service';

// GET /api/user/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    // TODO: Get user ID from session/JWT token
    // For now, we'll expect it as a query parameter for testing
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    if (!userId && !username) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let userProfile = null;
    
    if (userId) {
      userProfile = await UserStorage.getUserById(userId);
    } else if (username) {
      userProfile = await UserStorage.getUserByDiscogsUsername(username);
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile without sensitive data
    const publicProfile = {
      id: userProfile.id,
      discogsUsername: userProfile.discogsUsername,
      email: userProfile.email,
      avatarUrl: userProfile.avatarUrl,
      role: userProfile.role,
      canSell: userProfile.canSell,
      sellerInfo: userProfile.sellerInfo ? {
        acceptedCurrencies: userProfile.sellerInfo.acceptedCurrencies,
        paymentMethods: userProfile.sellerInfo.paymentMethods,
        minimumOrder: userProfile.sellerInfo.minimumOrder,
      } : undefined,
      createdAt: userProfile.createdAt,
      lastLoginAt: userProfile.lastLoginAt,
    };

    return NextResponse.json({
      success: true,
      user: publicProfile,
    });
  } catch (error) {
    console.error('User profile fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

// PUT /api/user/me - Update user profile
export async function PUT(request: NextRequest) {
  try {
    // TODO: Get user ID from session/JWT token
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userProfile = await UserStorage.getUserById(userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updates = await request.json();
    
    // Only allow certain fields to be updated
    const allowedUpdates = ['email'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updatedProfile = {
      ...userProfile,
      ...filteredUpdates,
      updatedAt: new Date().toISOString(),
    };

    await UserStorage.updateUser(updatedProfile);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('User profile update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}