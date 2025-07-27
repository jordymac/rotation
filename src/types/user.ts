// User management and authentication types

export interface DiscogsUserInfo {
  id: number;
  username: string;
  email?: string;
  profile?: string;
  avatar_url?: string;
  seller_info?: {
    allow_payment_methods: string[];
    buyer_selects_shipping: boolean;
    shipping_policy: string;
    accepted_currencies: string[];
    minimum_order_total?: number;
  };
  buyer_rating?: number;
  seller_rating?: number;
  num_for_sale?: number;
  num_collection?: number;
  num_wantlist?: number;
}

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface UserProfile {
  id: string;
  discogsUserId: number;
  discogsUsername: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  canSell: boolean;
  
  // Seller-specific data
  sellerInfo?: {
    storeId?: string;
    acceptedCurrencies: string[];
    paymentMethods: string[];
    shippingPolicy?: string;
    minimumOrder?: number;
  };
  
  // Authentication
  discogsAccessToken: string; // encrypted in database
  discogsTokenSecret: string; // encrypted in database
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface AuthContext {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { token: string; secret: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// For session storage
export interface SessionData {
  userId: string;
  discogsUsername: string;
  role: UserRole;
  expiresAt: number;
}