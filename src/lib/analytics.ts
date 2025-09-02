// Analytics and metrics tracking for early-stage app
// Since we're in early days, we'll track minimal essential metrics

interface ViewEvent {
  storeUsername: string;
  releaseId: string;
  timestamp: Date;
  sessionId?: string;
  userAgent?: string;
}

interface WishlistEvent {
  storeUsername: string;
  releaseId: string;
  action: 'add' | 'remove';
  timestamp: Date;
  sessionId?: string;
}

interface SaleEvent {
  storeUsername: string;
  releaseId: string;
  price: number;
  currency: string;
  timestamp: Date;
  source: 'discogs' | 'direct';
}

// Simple in-memory storage for development
// In production, this would be a proper database or analytics service
class SimpleAnalytics {
  private views: ViewEvent[] = [];
  private wishlists: WishlistEvent[] = [];
  private sales: SaleEvent[] = [];

  // Track a release view
  trackView(event: Omit<ViewEvent, 'timestamp'>) {
    this.views.push({
      ...event,
      timestamp: new Date()
    });
  }

  // Track wishlist action
  trackWishlist(event: Omit<WishlistEvent, 'timestamp'>) {
    this.wishlists.push({
      ...event,
      timestamp: new Date()
    });
  }

  // Track a sale (would normally come from external system)
  trackSale(event: Omit<SaleEvent, 'timestamp'>) {
    this.sales.push({
      ...event,
      timestamp: new Date()
    });
  }

  // Get stats for a store
  getStoreStats(storeUsername: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Views in last 30 days
    const recentViews = this.views.filter(v => 
      v.storeUsername === storeUsername && 
      v.timestamp >= thirtyDaysAgo
    ).length;

    // Current wishlists (adds minus removes)
    const wishlistEvents = this.wishlists.filter(w => w.storeUsername === storeUsername);
    const adds = wishlistEvents.filter(w => w.action === 'add').length;
    const removes = wishlistEvents.filter(w => w.action === 'remove').length;
    const currentWishlists = Math.max(0, adds - removes);

    // Sales in last 30 days
    const recentSales = this.sales.filter(s => 
      s.storeUsername === storeUsername && 
      s.timestamp >= thirtyDaysAgo
    ).length;

    return {
      views: recentViews,
      wishlists: currentWishlists,
      sales: recentSales,
      lastUpdated: now.toISOString()
    };
  }

  // Get all tracked stores
  getTrackedStores(): string[] {
    const stores = new Set<string>();
    this.views.forEach(v => stores.add(v.storeUsername));
    this.wishlists.forEach(w => stores.add(w.storeUsername));
    this.sales.forEach(s => stores.add(s.storeUsername));
    return Array.from(stores);
  }
}

// Singleton instance for development
export const analytics = new SimpleAnalytics();

// Lightweight metrics for admin dashboard - no heavy processing
export const getStoreMetrics = async (storeUsername: string) => {
  try {
    // Use lightweight admin stats endpoint (database only, no API calls)
    const statsResponse = await fetch(`/api/admin/stores/${storeUsername}/stats`);
    
    if (!statsResponse.ok) {
      throw new Error(`Stats API error: ${statsResponse.status}`);
    }

    const { stats } = await statsResponse.json();
    
    // Get minimal analytics data (will be empty in early days)
    const analyticsData = analytics.getStoreStats(storeUsername);

    return {
      collectionCount: stats.collectionCount,
      views: analyticsData.views, // Real but likely 0 initially
      wishlists: analyticsData.wishlists, // Real but likely 0 initially  
      sales: analyticsData.sales, // Real but likely 0 initially
      audioMatchPercentage: stats.audioMatchPercentage,
      lastSync: stats.lastSync,
      // Additional admin info
      queueStats: stats.queue,
      totalMatches: stats.totalMatches
    };
  } catch (error) {
    console.error(`Error fetching metrics for ${storeUsername}:`, error);
    throw error;
  }
};

// Export types for use in components
export type { ViewEvent, WishlistEvent, SaleEvent };