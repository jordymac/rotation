import { DiscogsService } from './discogs-service';
import { DiscogsUserInfo, UserProfile, UserRole } from '@/types/user';

export class UserService {
  
  /**
   * Detect user role based on Discogs account info
   */
  static detectUserRole(discogsUserInfo: DiscogsUserInfo): UserRole {
    // Check if user has seller privileges
    if (discogsUserInfo.seller_info && 
        discogsUserInfo.seller_info.allow_payment_methods && 
        discogsUserInfo.seller_info.allow_payment_methods.length > 0) {
      return 'seller';
    }
    
    return 'buyer';
  }

  /**
   * Check if user can sell based on Discogs account
   */
  static canUserSell(discogsUserInfo: DiscogsUserInfo): boolean {
    return !!(discogsUserInfo.seller_info && 
              discogsUserInfo.seller_info.allow_payment_methods &&
              discogsUserInfo.seller_info.allow_payment_methods.length > 0);
  }

  /**
   * Create user profile from Discogs authentication
   */
  static async createUserProfileFromDiscogs(
    discogsUserInfo: DiscogsUserInfo,
    accessToken: string,
    tokenSecret: string
  ): Promise<UserProfile> {
    const role = this.detectUserRole(discogsUserInfo);
    const canSell = this.canUserSell(discogsUserInfo);
    
    const userProfile: UserProfile = {
      id: `discogs_${discogsUserInfo.id}`, // Temporary ID generation
      discogsUserId: discogsUserInfo.id,
      discogsUsername: discogsUserInfo.username,
      email: discogsUserInfo.email,
      avatarUrl: discogsUserInfo.avatar_url,
      role,
      canSell,
      discogsAccessToken: accessToken, // TODO: Encrypt before storing
      discogsTokenSecret: tokenSecret, // TODO: Encrypt before storing
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Add seller-specific information if user can sell
    if (canSell && discogsUserInfo.seller_info) {
      userProfile.sellerInfo = {
        acceptedCurrencies: discogsUserInfo.seller_info.accepted_currencies || ['USD'],
        paymentMethods: discogsUserInfo.seller_info.allow_payment_methods,
        shippingPolicy: discogsUserInfo.seller_info.shipping_policy,
        minimumOrder: discogsUserInfo.seller_info.minimum_order_total,
      };
    }

    return userProfile;
  }

  /**
   * Get user's Discogs service instance
   */
  static createDiscogsServiceForUser(userProfile: UserProfile): DiscogsService {
    return new DiscogsService(userProfile.discogsAccessToken);
  }

  /**
   * Refresh user profile from Discogs (check for role changes)
   */
  static async refreshUserProfile(userProfile: UserProfile): Promise<UserProfile> {
    try {
      const service = this.createDiscogsServiceForUser(userProfile);
      const updatedDiscogsInfo = await service.getUser();
      
      const updatedRole = this.detectUserRole(updatedDiscogsInfo);
      const updatedCanSell = this.canUserSell(updatedDiscogsInfo);
      
      // Update profile with new information
      const refreshedProfile: UserProfile = {
        ...userProfile,
        role: updatedRole,
        canSell: updatedCanSell,
        email: updatedDiscogsInfo.email || userProfile.email,
        avatarUrl: updatedDiscogsInfo.avatar_url || userProfile.avatarUrl,
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Update seller info if applicable
      if (updatedCanSell && updatedDiscogsInfo.seller_info) {
        refreshedProfile.sellerInfo = {
          ...userProfile.sellerInfo,
          acceptedCurrencies: updatedDiscogsInfo.seller_info.accepted_currencies || ['USD'],
          paymentMethods: updatedDiscogsInfo.seller_info.allow_payment_methods,
          shippingPolicy: updatedDiscogsInfo.seller_info.shipping_policy,
          minimumOrder: updatedDiscogsInfo.seller_info.minimum_order_total,
        };
      } else if (!updatedCanSell) {
        // Remove seller info if user lost selling privileges
        delete refreshedProfile.sellerInfo;
      }

      return refreshedProfile;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      return userProfile; // Return original profile if refresh fails
    }
  }

  /**
   * Check if user can manage a specific store
   */
  static canUserManageStore(userProfile: UserProfile, storeUsername: string): boolean {
    return userProfile.canSell && 
           userProfile.discogsUsername.toLowerCase() === storeUsername.toLowerCase();
  }

  /**
   * Get user's store inventory if they're a seller
   */
  static async getUserStoreInventory(userProfile: UserProfile, options: any = {}) {
    if (!userProfile.canSell) {
      throw new Error('User does not have seller privileges');
    }

    const service = this.createDiscogsServiceForUser(userProfile);
    return await service.getUserInventory(userProfile.discogsUsername, options);
  }
}

// Temporary in-memory user storage (replace with database)
const userStore = new Map<string, UserProfile>();

export class UserStorage {
  
  static async saveUser(userProfile: UserProfile): Promise<void> {
    // TODO: Save to encrypted database
    userStore.set(userProfile.id, userProfile);
    console.log('User saved (in-memory):', {
      id: userProfile.id,
      username: userProfile.discogsUsername,
      role: userProfile.role,
      canSell: userProfile.canSell
    });
  }

  static async getUserById(userId: string): Promise<UserProfile | null> {
    // TODO: Load from database
    return userStore.get(userId) || null;
  }

  static async getUserByDiscogsUsername(username: string): Promise<UserProfile | null> {
    // TODO: Database query
    for (const user of userStore.values()) {
      if (user.discogsUsername.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  static async updateUser(userProfile: UserProfile): Promise<void> {
    // TODO: Update in database
    userProfile.updatedAt = new Date().toISOString();
    userStore.set(userProfile.id, userProfile);
  }

  static async deleteUser(userId: string): Promise<void> {
    // TODO: Delete from database
    userStore.delete(userId);
  }
}