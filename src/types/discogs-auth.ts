// Discogs OAuth and authentication types

export interface DiscogsOAuthRequest {
  url: string;
  requestToken: string;
  requestSecret: string;
}

export interface DiscogsAccessToken {
  token: string;
  secret: string;
}

export interface DiscogsUser {
  id: number;
  username: string;
  email?: string;
  profile?: string;
  avatar_url?: string;
  seller_info?: {
    allow_payment_methods: string[];
    buyer_selects_shipping: boolean;
    shipping_policy: string;
  };
}

export interface WishlistItem {
  id: string;
  releaseId: number;
  userId: string;
  addedAt: string;
  synced: boolean;
  discogsWantlistId?: number;
}

export interface InventorySync {
  storeId: string;
  lastSyncAt: string;
  itemCount: number;
  status: 'syncing' | 'completed' | 'failed';
  errors?: string[];
}

// For local-first wishlist storage
export interface LocalWishlistState {
  items: WishlistItem[];
  pendingSync: WishlistItem[];
  lastSyncAt?: string;
}